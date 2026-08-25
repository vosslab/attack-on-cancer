import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

// Selector contract: player-visible controls and map labels live in src/app.tsx:350;
// semantic actor state hooks live in src/enemy_actor.tsx:69 and src/tower_actor.tsx:26.

const MAP_SIZE = { width: 960, height: 600 };

interface Placement {
  name: RegExp;
  cost: number;
  position: { x: number; y: number };
}

const TOWER_CASES = [
  { name: /1\. Doctor/, type: "doctor", cost: 90 },
  { name: /2\. Chemotherapy/, type: "chemotherapy", cost: 150 },
  { name: /3\. Cytotoxic T Cell/, type: "t_cell", cost: 125 },
  { name: /4\. Radiation Bot/, type: "radiation", cost: 240 },
  { name: /5\. Antibody Therapy/, type: "antibody", cost: 145 },
  { name: /6\. CAR Macrophage/, type: "macrophage", cost: 210 },
  { name: /7\. CRISPR Repair Editor/, type: "crispr", cost: 180 },
] as const;

const SCENE_ONE_PLACEMENTS: Placement[] = [
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

const CLUSTER_PLACEMENTS: Placement[] = [
  { name: /1\. Doctor/, cost: 90, position: { x: 270, y: 250 } },
  { name: /2\. Chemotherapy/, cost: 150, position: { x: 560, y: 300 } },
  { name: /3\. Cytotoxic T Cell/, cost: 125, position: { x: 720, y: 520 } },
  { name: /5\. Antibody Therapy/, cost: 145, position: { x: 560, y: 80 } },
  { name: /4\. Radiation Bot/, cost: 240, position: { x: 880, y: 90 } },
];

const GRID_TOWERS = [
  { name: /4\. Radiation Bot/, cost: 240 },
  { name: /2\. Chemotherapy/, cost: 150 },
  { name: /3\. Cytotoxic T Cell/, cost: 125 },
  { name: /5\. Antibody Therapy/, cost: 145 },
  { name: /1\. Doctor/, cost: 90 },
] as const;

function getPlayfield(page: Page): Locator {
  return page.getByRole("img", {
    name: "Skin tissue route from the primary tumor to a blood vessel exit",
  });
}

async function readTreatmentPoints(page: Page): Promise<number> {
  const status = await page.getByLabel("Game status").textContent();
  const match = /TP\s+(\d+)/.exec(status ?? "");
  if (match === null) throw new Error(`Unable to read Treatment Points from: ${status}`);
  return Number(match[1]);
}

async function clickMapPosition(
  playfield: Locator,
  position: Placement["position"],
): Promise<void> {
  const box = await playfield.boundingBox();
  if (box === null) throw new Error("Playfield has no rendered bounds.");
  await playfield.click({
    position: {
      x: (position.x * box.width) / MAP_SIZE.width,
      y: (position.y * box.height) / MAP_SIZE.height,
    },
  });
}

async function placeTreatment(
  page: Page,
  playfield: Locator,
  placement: Placement,
): Promise<boolean> {
  const pointsBefore = await readTreatmentPoints(page);
  if (pointsBefore < placement.cost) return false;
  await page.getByRole("button", { name: placement.name }).click();
  await clickMapPosition(playfield, placement.position);
  return (await readTreatmentPoints(page)) === pointsBefore - placement.cost;
}

async function placeAffordableTreatments(
  page: Page,
  playfield: Locator,
  placements: Placement[],
): Promise<void> {
  while (placements.length > 0) {
    const placement = placements[0];
    if (placement === undefined || (await readTreatmentPoints(page)) < placement.cost) return;
    placements.shift();
    await placeTreatment(page, playfield, placement);
  }
}

function makeClusterGrid(): Placement[] {
  const placements: Placement[] = [];
  let candidateIndex = 0;
  for (let y = 65; y <= 545; y += 80) {
    for (let x = 90; x <= 890; x += 80) {
      const tower = GRID_TOWERS[candidateIndex % GRID_TOWERS.length];
      if (tower === undefined) throw new Error("Tower placement cycle is empty.");
      placements.push({ ...tower, position: { x, y } });
      candidateIndex += 1;
    }
  }
  return placements;
}

async function waitForEnabledButton(page: Page, name: string): Promise<Locator> {
  await page.waitForFunction(
    (buttonName) => {
      const enabled = [...document.querySelectorAll("button")].some(
        (button) => button.textContent?.trim() === buttonName && !button.disabled,
      );
      return enabled || document.querySelector(".terminal-overlay") !== null;
    },
    name,
    { timeout: 30_000 },
  );
  const terminal = page.locator(".terminal-overlay");
  if (await terminal.isVisible()) {
    const result = await terminal.textContent();
    if (!result?.includes("SKIN TISSUE CONTAINED")) {
      throw new Error(`Game ended while waiting for ${name}: ${result}`);
    }
  }
  return page.getByRole("button", { name, exact: true });
}

async function buyAffordableUpgrades(page: Page): Promise<void> {
  const pause = page.getByRole("button", { name: "Pause", exact: true });
  const resumeAfterUpgrades = (await pause.isVisible()) && (await pause.isEnabled());
  if (resumeAfterUpgrades) await pause.click();

  let upgraded = true;
  while (upgraded) {
    upgraded = false;
    const towerIds = await page
      .locator(".tower[data-tower-id]")
      .evaluateAll((towers) => towers.map((tower) => tower.getAttribute("data-tower-id")));
    for (const towerId of towerIds) {
      if (towerId === null) continue;
      await page.locator(`.tower[data-tower-id="${towerId}"] .tower-hit-target`).click();
      const upgrade = page.getByRole("button", { name: /^Upgrade:/ });
      if ((await upgrade.isVisible()) && (await upgrade.isEnabled())) {
        await upgrade.click();
        upgraded = true;
      }
    }
  }
  if (resumeAfterUpgrades) await page.getByRole("button", { name: "Resume" }).click();
}

async function advanceThroughWave(page: Page, wave: number): Promise<void> {
  await (await waitForEnabledButton(page, `Start Wave ${wave}`)).click();
  await waitForEnabledButton(page, `Start Wave ${wave + 1}`);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear());
});

test("every treatment renders its generated tier and visibly evolves after an upgrade", async ({
  page,
}) => {
  for (const towerCase of TOWER_CASES) {
    await page.goto("/");
    const playfield = getPlayfield(page);
    const placed = await placeTreatment(page, playfield, {
      name: towerCase.name,
      cost: towerCase.cost,
      position: { x: 470, y: 120 },
    });
    expect(placed).toBe(true);

    const tower = page.locator(`[data-tower-type="${towerCase.type}"]`).first();
    await expect(tower).toHaveAttribute("data-visual-tier", "0");
    await expect(tower.locator('[data-aoc-panel="tier-0"]')).toBeVisible();
    await tower.click();
    await page.getByRole("button", { name: /^Upgrade:/ }).click();
    await expect(tower).toHaveAttribute("data-visual-tier", "1");
    await expect(tower.locator('[data-aoc-panel="tier-1"]')).toBeVisible();
  }
});

test("enemy variants stay deterministic while gameplay moves the actor", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Start Wave 1" }).click();
  const enemy = page.locator(".enemy").first();
  await expect(enemy).toBeVisible();
  const enemyId = await enemy.getAttribute("data-enemy-id");
  const variant = await enemy.getAttribute("data-visual-variant");
  const firstTransform = await enemy.getAttribute("transform");
  await expect.poll(() => enemy.getAttribute("transform")).not.toBe(firstTransform);
  expect(await enemy.getAttribute("data-enemy-id")).toBe(enemyId);
  expect(await enemy.getAttribute("data-visual-variant")).toBe(variant);
});

test("destroyed cells present both apoptosis and rupture", async ({ page }) => {
  await page.goto("/");
  const playfield = getPlayfield(page);
  expect(
    await placeTreatment(page, playfield, {
      name: /4\. Radiation Bot/,
      cost: 240,
      position: { x: 170, y: 210 },
    }),
  ).toBe(true);
  await page.getByRole("button", { name: "Start Wave 1" }).click();
  await expect(page.locator('[data-death-kind="apoptosis"]')).toBeVisible();
  await expect(page.locator('[data-death-kind="rupture"]')).toBeVisible({ timeout: 15_000 });
});

test("CRISPR shows a sequence mismatch before a repaired cell leaves smiling", async ({ page }) => {
  await page.goto("/");
  const playfield = getPlayfield(page);
  expect(
    await placeTreatment(page, playfield, {
      name: /7\. CRISPR Repair Editor/,
      cost: 180,
      position: { x: 170, y: 210 },
    }),
  ).toBe(true);
  await page.getByRole("button", { name: "Start Wave 1" }).click();
  await expect(
    page.locator('[data-attack-type="crispr"][data-attack-outcome="mismatch"]'),
  ).toBeVisible({ timeout: 10_000 });

  await page.getByRole("button", { name: "4x" }).click();
  const repairedCell = page.locator('[data-visual-state="repair"]').first();
  await expect(repairedCell).toBeVisible({ timeout: 15_000 });
  await expect(repairedCell.locator('[data-aoc-asset="transition-repair"]')).toBeVisible();
});

test("reduced motion removes ambient cell motion without hiding the cell", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await page.getByRole("button", { name: "Start Wave 1" }).click();
  const enemy = page.locator(".enemy").first();
  const breathingPart = enemy.locator(".aoc-motion--breathe").first();
  await expect(breathingPart).toBeVisible();
  expect(await breathingPart.evaluate((part) => getComputedStyle(part).animationName)).not.toBe(
    "none",
  );

  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(enemy).toBeVisible();
  await expect
    .poll(() => breathingPart.evaluate((part) => getComputedStyle(part).animationName))
    .toBe("none");
});

test("the generated combat scene remains usable at narrow, standard, and wide layouts", async ({
  page,
}) => {
  for (const width of [680, 1280, 1600]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(getPlayfield(page)).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
});

test("the densest Cluster Corridor wave keeps every live SVG id unique", async ({ page }) => {
  test.setTimeout(120_000);
  await page.addInitScript(() => {
    let frameTime = 0;
    window.requestAnimationFrame = (callback): number => {
      frameTime += 25;
      return window.setTimeout(() => callback(frameTime), 1);
    };
    window.cancelAnimationFrame = (handle): void => window.clearTimeout(handle);
  });
  await page.goto("/");
  const playfield = getPlayfield(page);
  const scenePlacements = [...SCENE_ONE_PLACEMENTS];
  await placeAffordableTreatments(page, playfield, scenePlacements);
  for (let wave = 1; wave <= 15; wave += 1) {
    await (await waitForEnabledButton(page, `Start Wave ${wave}`)).click();
    if (wave < 15) {
      await waitForEnabledButton(page, `Start Wave ${wave + 1}`);
      await placeAffordableTreatments(page, playfield, scenePlacements);
    }
  }
  await page.getByRole("button", { name: "Enter Cluster Corridor" }).click();

  const clusterPlacements = [...CLUSTER_PLACEMENTS, ...makeClusterGrid()];
  await placeAffordableTreatments(page, playfield, clusterPlacements);
  await buyAffordableUpgrades(page);
  for (let wave = 16; wave <= 20; wave += 1) {
    await advanceThroughWave(page, wave);
    await placeAffordableTreatments(page, playfield, clusterPlacements);
    await buyAffordableUpgrades(page);
  }

  await page.getByRole("button", { name: "Start Wave 21" }).click();
  await expect(page.locator('[data-enemy-type="tumor_mass"]')).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: "Pause" }).click();
  const ids = await playfield
    .locator("[id]")
    .evaluateAll((elements) => elements.map((element) => element.id));
  expect(new Set(ids).size).toBe(ids.length);
});
