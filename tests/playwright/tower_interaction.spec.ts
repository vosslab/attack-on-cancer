import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

// Selector contract: semantic tower buttons come from src/tower_actor.tsx and
// the named inspector comes from src/app.tsx. This proof uses no simulation state.
const MAP_SIZE = { width: 960, height: 600 };
const DOCTOR_TOWER_NAME = "Doctor treatment, tier 1, id 1";

function playfield(page: Page): Locator {
  return page.locator("svg.playfield");
}

async function placeDoctor(page: Page): Promise<Locator> {
  const map = playfield(page);
  const bounds = await map.boundingBox();
  if (bounds === null) throw new Error("The visible battlefield has no rendered bounds.");

  await page.getByRole("button", { name: /1\. Doctor/ }).click();
  await map.click({
    position: {
      x: (470 * bounds.width) / MAP_SIZE.width,
      y: (120 * bounds.height) / MAP_SIZE.height,
    },
  });

  const tower = page.getByRole("button", { name: DOCTOR_TOWER_NAME, exact: true });
  await expect(tower).toBeVisible();
  return tower;
}

function inspector(page: Page): Locator {
  return page.getByRole("complementary", { name: "Selected treatment inspector" });
}

async function treatmentPoints(page: Page): Promise<number> {
  const status = await page.getByLabel("Game status").textContent();
  const match = /TP\s+(\d+)/.exec(status ?? "");
  if (match === null) throw new Error(`Unable to read Treatment Points from: ${status}`);
  return Number(match[1]);
}

async function expectDoctorInspector(page: Page): Promise<void> {
  await expect(inspector(page).getByRole("heading", { name: "Doctor - tier 1" })).toBeVisible();
  await expect(inspector(page).getByRole("button", { name: /^Upgrade:/ })).toBeVisible();
  await expect(inspector(page).getByRole("button", { name: /^Sell for \d+ TP$/ })).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear());
});

test("a placed treatment is a labeled SVG button with pointer and keyboard inspector access", async ({
  page,
}) => {
  await page.goto("/");
  const tower = await placeDoctor(page);

  await page.getByRole("button", { name: /2\. Chemotherapy/ }).click();
  const placedTowerCount = await page.locator("[data-tower-id]").count();
  await tower.click();
  await expectDoctorInspector(page);
  await expect(page.locator("[data-tower-id]")).toHaveCount(placedTowerCount);

  await page.getByRole("button", { name: "Start Wave 1", exact: true }).click();
  await expect(inspector(page)).toHaveCount(0);
  const movingCell = page.locator("[data-enemy-id]").first();
  await expect(movingCell).toBeVisible();
  const initialTransform = await movingCell.getAttribute("transform");
  await tower.focus();
  await expect(tower).toBeFocused();
  await expect.poll(() => movingCell.getAttribute("transform")).not.toBe(initialTransform);
  await expect(tower).toBeFocused();
  await expect
    .poll(() =>
      tower.evaluate((element) => {
        const hitTarget = element.querySelector(".tower-hit-target");
        if (hitTarget === null) return undefined;
        const style = getComputedStyle(hitTarget);
        return {
          fill: style.fill,
          stroke: style.stroke,
          strokeWidth: Number.parseFloat(style.strokeWidth),
        };
      }),
    )
    .toEqual({ fill: "none", stroke: "rgb(255, 253, 244)", strokeWidth: 4 });
  await tower.click();
  await expectDoctorInspector(page);

  await page.getByRole("button", { name: /2\. Chemotherapy/ }).click();
  await expect(inspector(page)).toHaveCount(0);
  await tower.focus();
  await page.keyboard.press("Space");
  await expectDoctorInspector(page);

  await page.getByRole("button", { name: /2\. Chemotherapy/ }).click();
  await expect(inspector(page)).toHaveCount(0);
  await tower.focus();
  await page.keyboard.press("Enter");
  await expectDoctorInspector(page);
});

test("the visible inspector upgrades and sells its selected treatment", async ({ page }) => {
  await page.goto("/");
  const tower = await placeDoctor(page);
  await tower.click();
  await expectDoctorInspector(page);

  const pointsBeforeUpgrade = await treatmentPoints(page);
  const upgrade = inspector(page).getByRole("button", { name: /^Upgrade:/ });
  const upgradeLabel = await upgrade.textContent();
  const upgradeCost = /\((\d+) TP\)/.exec(upgradeLabel ?? "");
  if (upgradeCost === null) throw new Error(`Unable to read upgrade cost from: ${upgradeLabel}`);
  await upgrade.click();
  const upgradedTower = page.getByRole("button", {
    name: "Doctor treatment, tier 2, id 1",
    exact: true,
  });
  await expect(upgradedTower).toBeVisible();
  await expect.poll(() => treatmentPoints(page)).toBe(pointsBeforeUpgrade - Number(upgradeCost[1]));

  const pointsBeforeSell = await treatmentPoints(page);
  const sell = inspector(page).getByRole("button", { name: /^Sell for \d+ TP$/ });
  const sellLabel = await sell.textContent();
  const sellReturn = /Sell for (\d+) TP/.exec(sellLabel ?? "");
  if (sellReturn === null) throw new Error(`Unable to read sell return from: ${sellLabel}`);
  await sell.click();
  await expect(upgradedTower).toHaveCount(0);
  await expect(inspector(page)).toHaveCount(0);
  await expect.poll(() => treatmentPoints(page)).toBe(pointsBeforeSell + Number(sellReturn[1]));
});

test("a signature upgrade confirms before spending and leaves a visible unlocked state", async ({
  page,
}) => {
  await page.goto("/");
  const tower = await placeDoctor(page);
  await tower.click();

  await inspector(page)
    .getByRole("button", { name: /^Upgrade:/ })
    .click();
  await inspector(page)
    .getByRole("button", { name: /^Upgrade:/ })
    .click();
  const pointsBeforeSignature = await treatmentPoints(page);
  await inspector(page)
    .getByRole("button", { name: /^Unlock signature:/ })
    .click();
  const dialog = page.getByRole("dialog", { name: "Confirm signature upgrade" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "No, keep planning" }).click();
  await expect(dialog).toHaveCount(0);
  await expect.poll(() => treatmentPoints(page)).toBe(pointsBeforeSignature);

  await inspector(page)
    .getByRole("button", { name: /^Unlock signature:/ })
    .click();
  await dialog.getByRole("button", { name: "Yes, unlock signature" }).click();
  await expect(page.getByRole("button", { name: "Doctor treatment, tier 4, id 1" })).toBeVisible();
  await expect(page.getByRole("status")).toHaveText(/Signature unlocked: DOUBLE TAP/);
  await expect(page.locator("[data-signature-confetti]")).toBeVisible();
  await expect(page.locator('[data-tower-id="1"]')).toHaveAttribute("data-visual-tier", "3");
  await expect(page.locator('[data-tower-id="1"]')).toHaveAttribute("data-signature", "unlocked");
});
