import { expect, test } from "@playwright/test";

import {
  installCampaignFrameCadence,
  playVisibleCampaign,
  verifySceneLearningAtLevel,
} from "./helper_campaign_browser_driver";

// Selector contract: the shared browser driver uses only named player controls,
// semantic campaign regions, and the public SVG playfield from src/app.tsx.
// It contains no simulation, storage, or level-selection shortcuts.
test.beforeEach(async ({ page }) => {
  await installCampaignFrameCadence(page);
});

test("a player can visibly contain all ten campaign levels through the final win", async ({
  page,
}) => {
  test.setTimeout(35 * 60_000);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Attack on Cancer" })).toBeVisible();
  await expect(page.getByRole("button", { name: /level select|choose level|replay/i })).toHaveCount(
    0,
  );
  await playVisibleCampaign(page, {
    onLevelEntry: verifySceneLearningAtLevel,
  });
});
