import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

// Selector contract: player-visible buttons and labels in src/app.tsx.
// The SVG route has a descriptive aria-label at src/app.tsx:438 for the one
// visual placement gesture that cannot be expressed as a button click.

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
  const standard = page.getByRole("button", { name: /Standard .*15 capacity/ });
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

test("a player can select a treatment, place it in open tissue, and inspect it", async ({
  page,
}) => {
  await page.goto("/");
  const pointsBefore = await readTreatmentPoints(page);
  await page.getByRole("button", { name: /1\. Doctor/ }).click();
  const playfield = page.getByRole("img", {
    name: "Skin tissue route from the primary tumor to a blood vessel exit",
  });
  await playfield.click({ position: { x: 470, y: 120 } });
  const pointsAfter = await readTreatmentPoints(page);
  expect(pointsAfter).toBeLessThan(pointsBefore);

  await playfield.click({ position: { x: 470, y: 120 } });
  await page.getByRole("button", { name: "Inspect +" }).click();
  await expect(
    page.locator(".inspect").getByText("A reliable syringe for nearby cells."),
  ).toBeVisible();
});

test("keyboard shortcut 6 selects and places the CAR Macrophage", async ({ page }) => {
  await page.goto("/");
  const pointsBefore = await readTreatmentPoints(page);
  await page.keyboard.press("6");
  const macrophageButton = page.getByRole("button", { name: /6\. CAR Macrophage/ });
  await expect(macrophageButton).toHaveClass(/active/);

  const playfield = page.getByRole("img", {
    name: "Skin tissue route from the primary tumor to a blood vessel exit",
  });
  await playfield.click({ position: { x: 470, y: 120 } });
  await expect(page.locator('[data-tower-type="macrophage"]')).toBeVisible();
  expect(await readTreatmentPoints(page)).toBeLessThan(pointsBefore);
});

test("keyboard shortcut 7 selects and places the CRISPR Repair Editor", async ({ page }) => {
  await page.goto("/");
  const pointsBefore = await readTreatmentPoints(page);
  await page.keyboard.press("7");
  const crisprButton = page.getByRole("button", { name: /7\. CRISPR Repair Editor/ });
  await expect(crisprButton).toHaveClass(/active/);

  const playfield = page.getByRole("img", {
    name: "Skin tissue route from the primary tumor to a blood vessel exit",
  });
  await playfield.click({ position: { x: 470, y: 120 } });
  await expect(page.locator('[data-tower-type="crispr"]')).toBeVisible();
  expect(await readTreatmentPoints(page)).toBeLessThan(pointsBefore);
});
