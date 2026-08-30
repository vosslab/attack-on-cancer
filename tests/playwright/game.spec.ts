import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

// Selector contract: player-visible controls, campaign status, and the named
// SVG playfield group are rendered by src/app.tsx. Map placement uses the public
// 960x600 playfield coordinate contract rather than rendered CSS pixels.

const MAP_SIZE = { width: 960, height: 600 };

function playfield(page: Page): Locator {
  return page.getByRole("group", {
    name: "Skin tissue route from the primary tumor to a blood vessel exit",
  });
}

async function clickMapPosition(field: Locator, position: { x: number; y: number }): Promise<void> {
  const bounds = await field.boundingBox();
  if (bounds === null) throw new Error("The visible battlefield has no rendered bounds.");
  await field.click({
    position: {
      x: (position.x * bounds.width) / MAP_SIZE.width,
      y: (position.y * bounds.height) / MAP_SIZE.height,
    },
  });
}

async function readTreatmentPoints(page: Page): Promise<number> {
  const status = await page.getByLabel("Game status").textContent();
  const match = /TP\s+(\d+)/.exec(status ?? "");
  if (match === null) {
    throw new Error(`Unable to read Treatment Points from: ${status}`);
  }
  return Number(match[1]);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear());
});

test("smoke: the game loads without browser errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.text());
    }
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Attack on Cancer" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Start Wave 1" })).toBeEnabled();
  expect(errors).toEqual([]);
});

test("a player can set difficulty, start a wave, pause, and choose 2x speed", async ({ page }) => {
  await page.goto("/");
  const standard = page.getByRole("button", { name: "Standard", exact: true });
  await standard.click();
  await expect(standard).toHaveClass(/active/);
  await expect(page.getByLabel("Game status")).toContainText("Metastases 0/15");

  await page.getByRole("button", { name: "Start Wave 1" }).click();
  await expect(page.getByRole("button", { name: "Pause" })).toBeEnabled();
  await page.getByRole("button", { name: "Pause" }).click();
  await expect(page.getByRole("button", { name: "Resume" })).toBeVisible();
  await page.getByRole("button", { name: "2x" }).click();
  await expect(page.getByRole("button", { name: "2x" })).toHaveClass(/active/);
});

test("the visible Start Wave control advances real animation frames into the battlefield", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Start Wave 1" }).click();

  const activeCells = page.locator("[data-enemy-id]");
  await expect(activeCells.first()).toBeVisible();
  await expect(page.getByLabel("Game status")).toContainText("Wave 1/");
  await expect(page.getByRole("button", { name: "Pause" })).toBeEnabled();
});

test("a player can select a treatment, place it in open tissue, and inspect it", async ({
  page,
}) => {
  await page.goto("/");
  const pointsBefore = await readTreatmentPoints(page);
  await page.getByRole("button", { name: /1\. Doctor/ }).click();
  const field = playfield(page);
  await clickMapPosition(field, { x: 470, y: 120 });
  const pointsAfter = await readTreatmentPoints(page);
  expect(pointsAfter).toBeLessThan(pointsBefore);

  await page.getByRole("button", { name: "Doctor treatment, tier 1, id 1", exact: true }).click();
  const inspector = page.getByRole("complementary", { name: "Selected treatment inspector" });
  await expect(inspector.getByRole("heading", { name: "Doctor" })).toBeVisible();
  await expect(inspector.getByText("A reliable syringe for nearby cells.")).toBeVisible();
});

test("keyboard shortcut 6 selects and places the CAR Macrophage", async ({ page }) => {
  await page.goto("/");
  const pointsBefore = await readTreatmentPoints(page);
  await page.keyboard.press("6");
  const macrophageButton = page.getByRole("button", { name: /6\. CAR Macrophage/ });
  await expect(macrophageButton).toHaveClass(/active/);

  await clickMapPosition(playfield(page), { x: 470, y: 120 });
  await expect(page.locator('[data-tower-type="macrophage"]')).toBeVisible();
  expect(await readTreatmentPoints(page)).toBeLessThan(pointsBefore);
});

test("keyboard shortcut 7 selects and places the CRISPR Repair Editor", async ({ page }) => {
  await page.goto("/");
  const pointsBefore = await readTreatmentPoints(page);
  await page.keyboard.press("7");
  const crisprButton = page.getByRole("button", { name: /7\. CRISPR Repair Editor/ });
  await expect(crisprButton).toHaveClass(/active/);

  await clickMapPosition(playfield(page), { x: 470, y: 120 });
  await expect(page.locator('[data-tower-type="crispr"]')).toBeVisible();
  expect(await readTreatmentPoints(page)).toBeLessThan(pointsBefore);
});
