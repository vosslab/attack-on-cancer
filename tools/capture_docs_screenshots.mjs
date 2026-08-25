// capture_docs_screenshots.mjs - capture current README campaign gameplay states.
//
// The capture uses only player-visible controls: treatment tray, playfield, wave controls,
// and the accessible selected-treatment inspector. It never edits game state or calls the
// simulation outside the built browser UI.

import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import path from "node:path";

import { chromium } from "playwright";

const MAP_SIZE = { width: 960, height: 600 };
const VIEWPORT = { width: 1600, height: 1000 };

async function createCapturePage(browser, url) {
  const context = await browser.newContext({ reducedMotion: "reduce", viewport: VIEWPORT });
  const page = await context.newPage();
  const browserErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });
  page.on("pageerror", (error) => browserErrors.push(error.message));
  await page.addInitScript(() => globalThis.localStorage.clear());
  await page.goto(url, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Attack on Cancer" }).waitFor({ state: "visible" });
  return { browserErrors, context, page };
}

function playfield(page) {
  return page.locator("svg.playfield");
}

async function clickMapPosition(field, position) {
  const box = await field.boundingBox();
  assert.notEqual(box, null, "Playfield has no rendered bounds");
  await field.click({
    position: {
      x: (position.x * box.width) / MAP_SIZE.width,
      y: (position.y * box.height) / MAP_SIZE.height,
    },
  });
}

async function placeTreatment(page, field, name, position) {
  await page.getByRole("button", { name }).click();
  await clickMapPosition(field, position);
}

function assertNoBrowserErrors(browserErrors) {
  assert.equal(browserErrors.length, 0, browserErrors.join("\n"));
}

async function captureSkinTissueBattle(browser, url, outputPath) {
  const session = await createCapturePage(browser, url);
  try {
    const field = playfield(session.page);
    await placeTreatment(session.page, field, /1\. Doctor/, { x: 430, y: 120 });
    await placeTreatment(session.page, field, /3\. Cytotoxic T Cell/, { x: 600, y: 450 });
    await placeTreatment(session.page, field, /5\. Antibody Therapy/, { x: 780, y: 160 });
    await session.page.getByRole("button", { name: "Start Wave 1" }).click();
    await session.page.locator(".enemy").first().waitFor({ state: "visible" });
    await session.page.getByRole("button", { name: "Pause" }).click();
    assertNoBrowserErrors(session.browserErrors);
    await session.page.screenshot({ animations: "disabled", path: outputPath });
  } finally {
    await session.context.close();
  }
}

async function captureAntibodyTargeting(browser, url, outputPath) {
  const session = await createCapturePage(browser, url);
  try {
    const field = playfield(session.page);
    const position = { x: 780, y: 160 };
    await placeTreatment(session.page, field, /5\. Antibody Therapy/, position);
    await clickMapPosition(field, position);
    await session.page
      .getByRole("complementary", { name: "Selected treatment inspector" })
      .waitFor({ state: "visible" });
    assertNoBrowserErrors(session.browserErrors);
    await session.page.screenshot({ animations: "disabled", path: outputPath });
  } finally {
    await session.context.close();
  }
}

async function main() {
  const [url, outputDirectory] = process.argv.slice(2);
  if (url === undefined || outputDirectory === undefined) {
    throw new Error("Usage: node tools/capture_docs_screenshots.mjs <url> <output_directory>");
  }
  await mkdir(outputDirectory, { recursive: true });
  const browser = await chromium.launch();
  try {
    await captureSkinTissueBattle(
      browser,
      url,
      path.join(outputDirectory, "skin_tissue_battle.png"),
    );
    await captureAntibodyTargeting(
      browser,
      url,
      path.join(outputDirectory, "antibody_targeting.png"),
    );
  } finally {
    await browser.close();
  }
  process.stdout.write(`Screenshots saved under: ${outputDirectory}\n`);
}

await main();
