import { expect, test } from "@playwright/test";

// Selector contract: player-visible buttons and labels in src/app.tsx.
// The SVG route has a descriptive aria-label at src/app.tsx:213 for the one
// visual placement gesture that cannot be expressed as a button click.

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
  await page.getByRole("button", { name: /Standard 500 TP \/ 15 capacity/ }).click();
  await expect(page.getByLabel("Game status")).toContainText("TP 500");

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
  await page.getByRole("button", { name: /1\. Doctor/ }).click();
  const playfield = page.getByRole("img", {
    name: "Skin tissue route from the primary tumor to a blood vessel exit",
  });
  await playfield.click({ position: { x: 470, y: 120 } });
  await expect(page.getByLabel("Game status")).toContainText("TP 560");

  await playfield.click({ position: { x: 470, y: 120 } });
  await page.getByRole("button", { name: "Inspect +" }).click();
  await expect(
    page.locator(".inspect").getByText("A reliable syringe for nearby cells."),
  ).toBeVisible();
});
