// capture_docs_screenshots.mjs - capture three README gameplay states.
//
// Selector contract: player-visible controls and labels in src/app.tsx.
// The route click target is the SVG role and aria-label in src/app.tsx.

import assert from "node:assert/strict";
import path from "node:path";
import { mkdir } from "node:fs/promises";

import { chromium } from "playwright";

const SETTINGS_KEY = "attack-on-cancer.settings.v1";
const VIEWPORT = { width: 1600, height: 1000 };
const MAP_SIZE = { width: 960, height: 600 };

const SCENE_ONE_PLACEMENTS = [
  { name: /4\. Radiation Bot/, cost: 240, position: { x: 560, y: 300 } },
  { name: /3\. Cytotoxic T Cell/, cost: 125, position: { x: 350, y: 300 } },
  { name: /3\. Cytotoxic T Cell/, cost: 125, position: { x: 680, y: 430 } },
  { name: /1\. Doctor/, cost: 90, position: { x: 170, y: 210 } },
  { name: /2\. Chemotherapy/, cost: 150, position: { x: 450, y: 500 } },
  { name: /5\. Antibody Therapy/, cost: 145, position: { x: 780, y: 160 } },
  { name: /4\. Radiation Bot/, cost: 240, position: { x: 850, y: 290 } },
  { name: /3\. Cytotoxic T Cell/, cost: 125, position: { x: 530, y: 260 } },
  { name: /2\. Chemotherapy/, cost: 150, position: { x: 720, y: 330 } },
  { name: /1\. Doctor/, cost: 90, position: { x: 100, y: 240 } },
  { name: /4\. Radiation Bot/, cost: 240, position: { x: 290, y: 483 } },
  { name: /4\. Radiation Bot/, cost: 240, position: { x: 145, y: 435 } },
  { name: /4\. Radiation Bot/, cost: 240, position: { x: 435, y: 97 } },
  { name: /4\. Radiation Bot/, cost: 240, position: { x: 628, y: 532 } },
  { name: /4\. Radiation Bot/, cost: 240, position: { x: 870, y: 483 } },
  { name: /2\. Chemotherapy/, cost: 150, position: { x: 628, y: 242 } },
  { name: /3\. Cytotoxic T Cell/, cost: 125, position: { x: 242, y: 97 } },
  { name: /3\. Cytotoxic T Cell/, cost: 125, position: { x: 387, y: 435 } },
];

const CLUSTER_PLACEMENTS = [
  { name: /1\. Doctor/, cost: 90, position: { x: 270, y: 250 } },
  { name: /2\. Chemotherapy/, cost: 150, position: { x: 560, y: 300 } },
  { name: /3\. Cytotoxic T Cell/, cost: 125, position: { x: 720, y: 520 } },
  { name: /5\. Antibody Therapy/, cost: 145, position: { x: 560, y: 80 } },
  { name: /4\. Radiation Bot/, cost: 240, position: { x: 880, y: 90 } },
];

async function createCapturePage(browser, url, accelerated) {
  const context = await browser.newContext({
    reducedMotion: "reduce",
    viewport: VIEWPORT,
  });
  const page = await context.newPage();
  const browserErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });
  page.on("pageerror", (error) => browserErrors.push(error.message));
  await page.addInitScript(
    ({ useAcceleratedFrames, settingsKey }) => {
      globalThis.localStorage.clear();
      globalThis.localStorage.setItem(
        settingsKey,
        JSON.stringify({
          version: 1,
          soundEnabled: false,
          preferredSpeed: useAcceleratedFrames ? 1 : 4,
          bestResults: {},
        }),
      );
      if (useAcceleratedFrames) {
        let frameTime = 0;
        globalThis.requestAnimationFrame = (callback) => {
          frameTime += 25;
          return globalThis.setTimeout(() => callback(frameTime), 1);
        };
        globalThis.cancelAnimationFrame = (handle) => globalThis.clearTimeout(handle);
      }
    },
    { useAcceleratedFrames: accelerated, settingsKey: SETTINGS_KEY },
  );
  await page.goto(url, { waitUntil: "networkidle" });

  return { browserErrors, context, page };
}

function getPlayfield(page) {
  return page.getByRole("img", {
    name: "Skin tissue route from the primary tumor to a blood vessel exit",
  });
}

async function clickMapPosition(playfield, position) {
  const box = await playfield.boundingBox();
  assert.notEqual(box, null, "Playfield has no rendered bounds");
  await playfield.click({
    position: {
      x: (position.x * box.width) / MAP_SIZE.width,
      y: (position.y * box.height) / MAP_SIZE.height,
    },
  });
}

async function placeTreatment(page, playfield, name, position) {
  await page.getByRole("button", { name }).click();
  await clickMapPosition(playfield, position);
}

async function readTreatmentPoints(page) {
  const statusText = await page.getByLabel("Game status").textContent();
  const match = /TP\s+(\d+)/.exec(statusText ?? "");
  assert.notEqual(match, null, `Unable to read Treatment Points from: ${statusText}`);
  return Number(match[1]);
}

async function placeAffordableTreatments(page, playfield, placements) {
  while (placements.length > 0) {
    const placement = placements[0];
    assert.notEqual(placement, undefined);
    const pointsBefore = await readTreatmentPoints(page);
    if (pointsBefore < placement.cost) return;

    await placeTreatment(page, playfield, placement.name, placement.position);
    const pointsAfter = await readTreatmentPoints(page);
    assert.equal(pointsAfter, pointsBefore - placement.cost, "Treatment placement failed");
    placements.shift();
  }
}

async function waitForEnabledButton(page, name) {
  await page.waitForFunction(
    (buttonName) => {
      const buttons = [...globalThis.document.querySelectorAll("button")];
      const enabled = buttons.some(
        (button) => button.textContent?.trim() === buttonName && !button.disabled,
      );
      const terminal = globalThis.document.querySelector(".terminal-overlay");
      return enabled || terminal !== null;
    },
    name,
    { timeout: 30_000 },
  );
  const terminal = page.locator(".terminal-overlay");
  if (await terminal.isVisible()) {
    const status = await page.getByLabel("Game status").textContent();
    const result = await terminal.textContent();
    throw new Error(`Game ended while waiting for ${name}: ${status} ${result}`);
  }
  return page.getByRole("button", { name, exact: true });
}

function assertNoBrowserErrors(browserErrors) {
  assert.equal(browserErrors.length, 0, browserErrors.join("\n"));
}

async function captureSkinTissueBattle(browser, url, outputPath) {
  const session = await createCapturePage(browser, url, false);
  try {
    const playfield = getPlayfield(session.page);
    await placeTreatment(session.page, playfield, /1\. Doctor/, { x: 430, y: 120 });
    await placeTreatment(session.page, playfield, /3\. Cytotoxic T Cell/, { x: 600, y: 450 });
    await placeTreatment(session.page, playfield, /5\. Antibody Therapy/, { x: 780, y: 160 });

    await session.page.getByRole("button", { name: "Start Wave 1" }).click();
    await session.page.locator(".enemy").nth(3).waitFor({ state: "visible" });
    await session.page.getByRole("button", { name: "Pause" }).click();
    await session.page.getByRole("button", { name: "Resume" }).waitFor({ state: "visible" });

    assertNoBrowserErrors(session.browserErrors);
    await session.page.screenshot({ animations: "disabled", fullPage: false, path: outputPath });
  } finally {
    await session.context.close();
  }
}

async function captureAntibodyTargeting(browser, url, outputPath) {
  const session = await createCapturePage(browser, url, false);
  try {
    const playfield = getPlayfield(session.page);
    await placeTreatment(session.page, playfield, /5\. Antibody Therapy/, { x: 780, y: 160 });
    await session.page.getByRole("button", { name: "Start Wave 1" }).click();
    await session.page.locator(".marked-halo").first().waitFor({ state: "visible" });
    await session.page.getByRole("button", { name: "Pause" }).click();
    await clickMapPosition(playfield, { x: 780, y: 160 });

    assertNoBrowserErrors(session.browserErrors);
    await session.page.locator(".battle-area").screenshot({
      animations: "disabled",
      path: outputPath,
    });
  } finally {
    await session.context.close();
  }
}

async function advanceToClusterCorridor(page, playfield) {
  const placements = [...SCENE_ONE_PLACEMENTS];
  await placeAffordableTreatments(page, playfield, placements);
  for (let wave = 1; wave <= 15; wave += 1) {
    const startButton = await waitForEnabledButton(page, `Start Wave ${wave}`);
    await startButton.click();
    if (wave < 15) {
      await waitForEnabledButton(page, `Start Wave ${wave + 1}`);
      await placeAffordableTreatments(page, playfield, placements);
    }
  }
  await page.getByRole("button", { name: "Enter Cluster Corridor" }).waitFor({
    state: "visible",
    timeout: 30_000,
  });
}

async function captureClusterCorridor(browser, url, outputPath) {
  const session = await createCapturePage(browser, url, true);
  try {
    const playfield = getPlayfield(session.page);
    await advanceToClusterCorridor(session.page, playfield);
    await session.page.getByRole("button", { name: "Enter Cluster Corridor" }).click();

    const clusterPlacements = [...CLUSTER_PLACEMENTS];
    await placeAffordableTreatments(session.page, playfield, clusterPlacements);
    await session.page.getByRole("button", { name: "Start Wave 16" }).click();
    await session.page.locator(".enemy").nth(7).waitFor({ state: "visible" });
    await session.page.getByRole("button", { name: "Pause" }).click();
    await session.page.getByRole("button", { name: "Resume" }).waitFor({ state: "visible" });

    assertNoBrowserErrors(session.browserErrors);
    await session.page.screenshot({ animations: "disabled", fullPage: false, path: outputPath });
  } finally {
    await session.context.close();
  }
}

async function main() {
  const url = process.argv[2];
  const outputDirectory = process.argv[3];
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
    await captureClusterCorridor(browser, url, path.join(outputDirectory, "cluster_corridor.png"));
  } finally {
    await browser.close();
  }
  process.stdout.write(`Screenshots saved under: ${outputDirectory}\n`);
}

await main();
