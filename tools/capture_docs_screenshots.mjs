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

async function captureChemotherapyProgression(browser, url, outputPath) {
  const session = await createCapturePage(browser, url);
  try {
    const field = playfield(session.page);
    await placeTreatment(session.page, field, /2\. Chemotherapy/, { x: 470, y: 120 });
    const tower = session.page.getByRole("button", {
      name: "Chemotherapy treatment, tier 1, id 1",
      exact: true,
    });
    await tower.click();
    const inspector = session.page.getByRole("complementary", {
      name: "Selected treatment inspector",
    });
    await inspector.getByRole("button", { name: /^Upgrade:/ }).click();
    await inspector.getByRole("button", { name: /^Upgrade:/ }).click();
    await session.page
      .getByRole("button", { name: "Chemotherapy treatment, tier 3, id 1" })
      .waitFor();
    assertNoBrowserErrors(session.browserErrors);
    await session.page.screenshot({ animations: "disabled", path: outputPath });
  } finally {
    await session.context.close();
  }
}

async function captureSignatureReview(browser, url, outputPath) {
  const session = await createCapturePage(browser, url);
  try {
    const field = playfield(session.page);
    await placeTreatment(session.page, field, /1\. Doctor/, { x: 430, y: 120 });
    const tower = session.page.getByRole("button", {
      name: "Doctor treatment, tier 1, id 1",
      exact: true,
    });
    await tower.click();
    const inspector = session.page.getByRole("complementary", {
      name: "Selected treatment inspector",
    });
    await inspector.getByRole("button", { name: /^Upgrade:/ }).click();
    await inspector.getByRole("button", { name: /^Upgrade:/ }).click();
    await inspector.getByRole("button", { name: /^Review signature:/ }).click();
    await inspector
      .getByRole("region", { name: "Confirm signature upgrade" })
      .waitFor({ state: "visible" });
    assertNoBrowserErrors(session.browserErrors);
    await session.page.screenshot({ animations: "disabled", path: outputPath });
  } finally {
    await session.context.close();
  }
}

async function captureMapLearningTooltip(browser, url, outputPath) {
  const session = await createCapturePage(browser, url);
  try {
    const hotspot = playfield(session.page).locator('[data-scene-object="landmark:primary_tumor"]');
    await hotspot.focus();
    await hotspot.locator(".scene-tooltip-card").waitFor({ state: "visible" });
    assertNoBrowserErrors(session.browserErrors);
    await session.page.screenshot({ animations: "disabled", path: outputPath });
  } finally {
    await session.context.close();
  }
}

async function captureTowerTierPalette(browser, url, outputPath) {
  const context = await browser.newContext({ reducedMotion: "reduce", viewport: VIEWPORT });
  const page = await context.newPage();
  const browserErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });
  page.on("pageerror", (error) => browserErrors.push(error.message));
  try {
    await page.goto(url, { waitUntil: "networkidle" });
    const title = page.getByRole("heading", { name: "Treatment tiers and attack states" });
    await title.waitFor({ state: "visible" });
    const section = title.locator("..");
    assertNoBrowserErrors(browserErrors);
    await section.screenshot({ animations: "disabled", path: outputPath });
  } finally {
    await context.close();
  }
}

async function main() {
  const [gameUrl, catalogUrl, outputDirectory] = process.argv.slice(2);
  if (gameUrl === undefined || catalogUrl === undefined || outputDirectory === undefined) {
    throw new Error(
      "Usage: node tools/capture_docs_screenshots.mjs <game_url> <catalog_url> <output_directory>",
    );
  }
  await mkdir(outputDirectory, { recursive: true });
  const browser = await chromium.launch();
  try {
    await captureSkinTissueBattle(
      browser,
      gameUrl,
      path.join(outputDirectory, "skin_tissue_battle.png"),
    );
    await captureAntibodyTargeting(
      browser,
      gameUrl,
      path.join(outputDirectory, "antibody_targeting.png"),
    );
    await captureChemotherapyProgression(
      browser,
      gameUrl,
      path.join(outputDirectory, "chemotherapy_tier_three.png"),
    );
    await captureSignatureReview(
      browser,
      gameUrl,
      path.join(outputDirectory, "doctor_signature_review.png"),
    );
    await captureMapLearningTooltip(
      browser,
      gameUrl,
      path.join(outputDirectory, "primary_tumor_tooltip.png"),
    );
    await captureTowerTierPalette(
      browser,
      catalogUrl,
      path.join(outputDirectory, "tower_tier_palette.png"),
    );
  } finally {
    await browser.close();
  }
  process.stdout.write(`Screenshots saved under: ${outputDirectory}\n`);
}

await main();
