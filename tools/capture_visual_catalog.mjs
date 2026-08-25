// capture_visual_catalog.mjs - inspect and capture the real visual catalog.

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import path from "node:path";

import { chromium } from "playwright";

const REPO_ROOT = execFileSync("git", ["rev-parse", "--show-toplevel"], {
  encoding: "utf8",
}).trim();

async function main() {
  const url = process.argv[2];
  if (url === undefined || !/^http:\/\/127\.0\.0\.1:\d+\//.test(url)) {
    throw new Error("Expected a loopback HTTP visual-catalog URL.");
  }
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1100 } });
    const browserErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") browserErrors.push(message.text());
    });
    page.on("pageerror", (error) => browserErrors.push(error.message));
    await page.goto(url, { waitUntil: "networkidle" });
    await page.getByRole("heading", { name: "Combat visual catalog" }).waitFor();
    await page.getByRole("button", { name: "Pause" }).click();
    assert.equal(
      await page.locator(".visual-catalog").getAttribute("data-catalog-motion"),
      "paused",
    );
    await page.getByRole("button", { name: "Replay" }).click();
    await page.locator(".visual-catalog").evaluate((catalog) => {
      for (const animation of catalog.getAnimations({ subtree: true })) {
        animation.currentTime = 450;
        animation.pause();
      }
    });
    await page.getByRole("button", { name: "Pause" }).click();
    assert.equal((await page.locator("[data-aoc-asset]").count()) > 40, true);
    assert.equal(await page.locator('[data-aoc-asset="tower-crispr"]').count(), 4);
    assert.equal(await page.locator('[data-aoc-asset="transition-repair"]').count(), 1);
    const campaignWorlds = page.locator(".catalog-world-grid [data-catalog-level]");
    assert.equal(await campaignWorlds.count(), 10);
    assert.match(await campaignWorlds.first().innerText(), /Level 1: Skin Tissue/);
    assert.match(await campaignWorlds.last().innerText(), /Level 10: Metastatic Confluence/);
    for (const outcome of ["mismatch", "repair", "tumor_suppressed"]) {
      assert.equal(await page.locator(`[data-attack-outcome="${outcome}"]`).count(), 1);
    }
    const ids = await page
      .locator("[id]")
      .evaluateAll((elements) => elements.map((element) => element.id).filter(Boolean));
    assert.equal(new Set(ids).size, ids.length, "Visual catalog contains duplicate SVG IDs");
    assert.equal(browserErrors.length, 0, browserErrors.join("\n"));
    const outputPath = path.join(REPO_ROOT, "test-results/visual-assets/contact_sheet.png");
    await page.screenshot({ animations: "allow", fullPage: true, path: outputPath });
    process.stdout.write(`Captured ${outputPath}\n`);
  } finally {
    await browser.close();
  }
}

await main();
