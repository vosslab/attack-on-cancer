import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

// Selector contract: player-visible controls and map labels are rendered by
// src/app.tsx; semantic actor state hooks are rendered by src/enemy_actor.tsx
// src/tower_actor.tsx, and src/world_landmarks.tsx. Keep this proof on those
// public DOM contracts.

const MAP_SIZE = { width: 960, height: 600 };

interface Placement {
  name: RegExp;
  cost: number;
  position: { x: number; y: number };
}

type MaterialPaint = "fill" | "stroke";

interface TowerCase {
  readonly name: RegExp;
  readonly type: string;
  readonly cost: number;
  readonly materialSelector: string;
  readonly materialPaint: MaterialPaint;
}

const TOWER_CASES: readonly TowerCase[] = [
  {
    name: /1\. Doctor/,
    type: "doctor",
    cost: 90,
    materialSelector: ".doctor-fluid",
    materialPaint: "fill",
  },
  {
    name: /2\. Chemotherapy/,
    type: "chemotherapy",
    cost: 150,
    materialSelector: ".chemo-fluid",
    materialPaint: "fill",
  },
  {
    name: /3\. Cytotoxic T Cell/,
    type: "t_cell",
    cost: 125,
    materialSelector: ".t-cell-granule",
    materialPaint: "fill",
  },
  {
    name: /4\. Radiation Bot/,
    type: "radiation",
    cost: 240,
    materialSelector: ".radiation-core-lens",
    materialPaint: "fill",
  },
  {
    name: /5\. Antibody Therapy/,
    type: "antibody",
    cost: 145,
    materialSelector: ".antibody-binding",
    materialPaint: "fill",
  },
  {
    name: /6\. CAR Macrophage/,
    type: "macrophage",
    cost: 210,
    materialSelector: ".macrophage-lysosomes circle",
    materialPaint: "fill",
  },
  {
    name: /7\. CRISPR Repair Editor/,
    type: "crispr",
    cost: 180,
    materialSelector: ".crispr-guide",
    materialPaint: "stroke",
  },
];

const SKIN_TISSUE_CAMPAIGN_PLACEMENTS: Placement[] = [
  { name: /3\. Cytotoxic T Cell/, cost: 125, position: { x: 330, y: 100 } },
  { name: /3\. Cytotoxic T Cell/, cost: 125, position: { x: 500, y: 255 } },
  { name: /3\. Cytotoxic T Cell/, cost: 125, position: { x: 590, y: 490 } },
  { name: /3\. Cytotoxic T Cell/, cost: 125, position: { x: 800, y: 400 } },
];

// After the foundational coverage has been upgraded, this queue gives the
// player-visible walkthrough a mixed, deliberately redundant final defense.
const SKIN_TISSUE_REINFORCEMENTS: Placement[] = [
  { name: /4\. Radiation Bot/, cost: 240, position: { x: 560, y: 300 } },
  { name: /5\. Antibody Therapy/, cost: 145, position: { x: 780, y: 160 } },
  { name: /4\. Radiation Bot/, cost: 240, position: { x: 850, y: 290 } },
  { name: /2\. Chemotherapy/, cost: 150, position: { x: 450, y: 500 } },
  { name: /3\. Cytotoxic T Cell/, cost: 125, position: { x: 350, y: 300 } },
  { name: /4\. Radiation Bot/, cost: 240, position: { x: 290, y: 483 } },
  { name: /2\. Chemotherapy/, cost: 150, position: { x: 720, y: 330 } },
  { name: /4\. Radiation Bot/, cost: 240, position: { x: 435, y: 97 } },
];

function getPlayfield(page: Page): Locator {
  return page.locator("svg.playfield");
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
  const pointsAfter = await readTreatmentPoints(page);
  const expected = pointsBefore - placement.cost;
  if (pointsAfter !== expected) {
    throw new Error(
      `Rejected treatment placement at (${placement.position.x}, ${placement.position.y}): ` +
        `TP changed from ${pointsBefore} to ${pointsAfter}; expected ${expected} after ` +
        `selecting ${placement.name}.`,
    );
  }
  return true;
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

async function waitForWaveControl(page: Page, wave: number): Promise<void> {
  const startWave = page.getByRole("button", { name: `Start Wave ${wave}`, exact: true });
  const levelContained = page.getByRole("button", { name: "Continue to Level 2", exact: true });
  await expect
    .poll(async () => (await startWave.isEnabled()) || (await levelContained.isVisible()), {
      timeout: 30_000,
    })
    .toBe(true);
  if (await levelContained.isVisible()) {
    throw new Error(`Level 1 ended before wave ${wave} became ready.`);
  }
}

async function upgradeVisibleTreatmentCoverage(page: Page, playfield: Locator): Promise<void> {
  const towers = playfield.locator("[data-tower-id]");
  const inspector = page.getByRole("complementary", { name: "Selected treatment inspector" });
  const towerCount = await towers.count();

  for (let index = 0; index < towerCount; index += 1) {
    const tower = towers.nth(index);
    await tower.focus();
    await page.keyboard.press("Enter");
    await expect(inspector).toBeVisible();
    const upgrade = inspector.getByRole("button", { name: /^Upgrade:/ });
    if ((await upgrade.count()) > 0 && (await upgrade.isEnabled())) await upgrade.click();
  }
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
    const tierOneMaterial = tower
      .locator(`[data-aoc-panel="tier-1"] ${towerCase.materialSelector}`)
      .first();
    const initialMaterial = tower
      .locator(`[data-aoc-panel="tier-0"] ${towerCase.materialSelector}`)
      .first();
    const initialPaint = await initialMaterial.evaluate(
      (element, paint) => getComputedStyle(element)[paint],
      towerCase.materialPaint,
    );
    await tower.click();
    await page.getByRole("button", { name: /^Upgrade:/ }).click();
    await expect(tower).toHaveAttribute("data-visual-tier", "1");
    await expect(
      tower.locator(
        `[data-aoc-asset="tower-${towerCase.type.replace("_", "-")}"][data-aoc-panel="tier-1"]`,
      ),
    ).toBeVisible();
    await expect(tower.locator('[data-aoc-asset="effect-upgrade-burst"]')).toBeVisible();
    await expect
      .poll(() =>
        tierOneMaterial.evaluate(
          (element, paint) => getComputedStyle(element)[paint],
          towerCase.materialPaint,
        ),
      )
      .not.toBe(initialPaint);
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
  for (const viewport of [
    { width: 680, height: 900 },
    { width: 1280, height: 800 },
    { width: 1600, height: 1000 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const playfield = getPlayfield(page);
    await expect(playfield).toBeVisible();
    if (viewport.width >= 900) {
      await page
        .locator(".hud span")
        .nth(2)
        .evaluate((status) => {
          status.textContent = "Level 10 of 10: Metastatic Confluence";
          status.setAttribute("data-level", "10");
        });
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);

    const layout = await page.evaluate(() => {
      const rect = (selector: string): DOMRect => {
        const element = document.querySelector(selector);
        if (element === null) throw new Error(`Missing ${selector}.`);
        return element.getBoundingClientRect();
      };
      const battle = rect(".battle-area");
      const shell = rect(".game-shell");
      const controls = rect(".controls-panel");
      const treatmentTray = document.querySelector(".treatment-tray");
      const waveControls = document.querySelector(".wave-controls");
      if (treatmentTray === null || waveControls === null) {
        throw new Error("Missing treatment or wave controls.");
      }
      return {
        battleHeight: battle.height,
        battleWidth: battle.width,
        controlsTop: controls.top,
        battleBottom: battle.bottom,
        treatmentTop: rect(".treatment-tray").top,
        waveTop: rect(".wave-controls").top,
        pageHeight: document.documentElement.scrollHeight,
        shellHeight: shell.height,
        shellWidth: shell.width,
        treatmentComesFirst:
          (treatmentTray.compareDocumentPosition(waveControls) &
            Node.DOCUMENT_POSITION_FOLLOWING) !==
          0,
      };
    });
    expect(layout.treatmentComesFirst).toBe(true);
    expect(layout.treatmentTop).toBeLessThanOrEqual(layout.waveTop);
    if (viewport.width >= 900) {
      expect(layout.battleWidth / layout.battleHeight).toBeCloseTo(9 / 5, 2);
      expect(layout.shellWidth / layout.shellHeight).toBeCloseTo(16 / 10, 2);
      expect(layout.pageHeight).toBeLessThanOrEqual(viewport.height);
      expect(layout.controlsTop).toBeGreaterThanOrEqual(layout.battleBottom);
      const minimumBattlefieldShare = viewport.width >= 1500 ? 0.82 : 0.73;
      expect(layout.battleWidth).toBeGreaterThan(layout.shellWidth * minimumBattlefieldShare);
      for (const control of await page.locator(".controls-panel button").all()) {
        await expect(control).toBeVisible();
        expect((await control.boundingBox())?.width ?? 0).toBeLessThan(layout.battleWidth);
      }
    }
  }
});

test("scene learning supports pointer and keyboard exploration without blocking play", async ({
  page,
}) => {
  await page.goto("/");
  const playfield = getPlayfield(page);
  await expect(page.getByText("Point, tap, or Tab to explore objects")).toBeVisible();

  const route = page.getByRole("img", { name: /^Cancer-cell route\./ });
  const routeTooltip = page.locator('[data-scene-tooltip="Cancer-cell route"]');
  await route.locator(".scene-route-hit").first().hover();
  await expect(routeTooltip).toBeVisible();
  await expect(routeTooltip).toContainText("Cancer-cell pathway");
  await expect(routeTooltip.locator(".scene-tooltip-biological-fact")).toContainText(
    "Skin contains blood-vessel networks",
  );
  await expect(routeTooltip.locator(".scene-tooltip-game-role")).toContainText(
    "single curved route",
  );
  await expect(routeTooltip.locator(".scene-tooltip-biological-fact")).toHaveCSS(
    "text-transform",
    "none",
  );

  const source = page.locator('[data-scene-object="landmark:primary_tumor"]');
  const sourceTooltip = page.locator('[data-scene-tooltip="Primary tumor"]');
  await source.locator(".scene-object-hit").click();
  await expect(source).toBeFocused();
  await expect(sourceTooltip).toBeVisible();

  await route.focus();
  await page.keyboard.press("Tab");
  await expect(source).toBeFocused();
  await expect(sourceTooltip).toBeVisible();
  await expect(sourceTooltip).toContainText("mass of abnormal cells");

  const doctor = page.getByRole("button", { name: /1\. Doctor/ });
  await doctor.click();
  await source.focus();
  await page.keyboard.press("Enter");
  await expect(playfield.locator("[data-tower-id]")).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(sourceTooltip).toBeHidden();
  await expect(doctor).toHaveClass(/active/);

  await clickMapPosition(playfield, { x: 470, y: 120 });
  await expect(playfield.locator("[data-tower-id]")).toHaveCount(1);
});

test("campaign world paint remains visible, themed, placeable, and motion-safe", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const playfield = getPlayfield(page);
  const routeFlow = playfield.locator(".route-flow").first();
  const routeCurrent = playfield.locator(".route-current").first();
  await expect(routeFlow).toBeVisible();
  await expect(routeCurrent).toBeVisible();
  await expect(playfield.locator(".world-landmark-source")).toBeVisible();
  await expect(playfield.locator(".world-landmark-marker")).toHaveCount(0);
  const routeLayers = playfield.locator(".campaign-route-layer");
  await expect(routeLayers).toHaveCount(4);
  expect(
    await routeLayers.evaluateAll((layers) =>
      layers.map((layer) => layer.getAttribute("data-route-layer")),
    ),
  ).toEqual(["bed", "membrane", "flow", "current"]);
  const routeLayerCounts = await routeLayers.evaluateAll((layers) =>
    layers.map((layer) => layer.querySelectorAll("[data-route-segment]").length),
  );
  expect(new Set(routeLayerCounts).size).toBe(1);
  expect(
    await playfield
      .locator(".campaign-route-beds")
      .evaluate((layer) => getComputedStyle(layer).filter),
  ).not.toBe("none");
  expect(
    await playfield
      .locator(".route-bed")
      .first()
      .evaluate((path) => getComputedStyle(path).filter),
  ).toBe("none");
  expect(await routeFlow.evaluate((route) => getComputedStyle(route).strokeDasharray)).toBe("none");
  expect(await routeCurrent.evaluate((route) => getComputedStyle(route).animationName)).not.toBe(
    "none",
  );

  // Each campaign theme resolves the world token contract on the shipped playfield.
  const themeTokens = await playfield.evaluate((element) => {
    const themes = [
      "capillary-crossroads",
      "lymph_node_loop",
      "alveolar_switchbacks",
      "ductal_delta",
      "vascular-bypass",
      "fibrotic_sieve",
      "marrow-lattice",
      "metastatic-confluence",
    ];
    return themes.map((theme) => {
      element.setAttribute("data-level-theme", theme);
      const style = getComputedStyle(element);
      return {
        theme,
        bed: style.getPropertyValue("--world-route-bed").trim(),
        flow: style.getPropertyValue("--world-route-flow").trim(),
        obstacle: style.getPropertyValue("--world-obstacle").trim(),
      };
    });
  });
  expect(themeTokens).toHaveLength(8);
  for (const token of themeTokens) {
    expect(token.bed).not.toBe("");
    expect(token.flow).not.toBe("");
    expect(token.obstacle).not.toBe("");
  }
  expect(new Set(themeTokens.map((token) => token.bed)).size).toBe(8);

  // The Level 1 authored probes exercise the same visible pointer placement interaction.
  const pointsBefore = await readTreatmentPoints(page);
  await page.getByRole("button", { name: /1\. Doctor/ }).click();
  await clickMapPosition(playfield, { x: 330, y: 100 });
  expect(await readTreatmentPoints(page)).toBe(pointsBefore - 90);
  await page.getByRole("button", { name: /1\. Doctor/ }).click();
  await clickMapPosition(playfield, { x: 510, y: 374 });
  expect(await readTreatmentPoints(page)).toBe(pointsBefore - 90);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect
    .poll(() => routeCurrent.evaluate((route) => getComputedStyle(route).animationName))
    .toBe("none");

  for (const width of [680, 1280, 1600]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(playfield).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
});

test("visible campaign transition switches the world route and landmark contract", async ({
  page,
}) => {
  test.setTimeout(3 * 60_000);
  await page.addInitScript(() => {
    let frameTime = 0;
    window.requestAnimationFrame = (callback): number => {
      frameTime += 25;
      return window.setTimeout(() => callback(frameTime), 1);
    };
    window.cancelAnimationFrame = (handle): void => window.clearTimeout(handle);
  });
  await page.goto("/");
  await page.setViewportSize({ width: 1280, height: 800 });
  const playfield = getPlayfield(page);
  const reinforcements = [...SKIN_TISSUE_REINFORCEMENTS];
  await placeAffordableTreatments(page, playfield, [...SKIN_TISSUE_CAMPAIGN_PLACEMENTS]);
  for (let wave = 1; wave <= 15; wave += 1) {
    await waitForWaveControl(page, wave);
    if (wave === 15) {
      const tower = playfield.locator("[data-tower-id]").first();
      await tower.focus();
      await page.keyboard.press("Enter");
      await expect(
        page.getByRole("complementary", { name: "Selected treatment inspector" }),
      ).toBeVisible();
    }
    await page.getByRole("button", { name: `Start Wave ${wave}`, exact: true }).click();
    if (wave < 15) {
      await waitForWaveControl(page, wave + 1);
      await upgradeVisibleTreatmentCoverage(page, playfield);
      await placeAffordableTreatments(page, playfield, reinforcements);
    }
  }

  const terminal = page.getByRole("alert");
  const terminalHeading = terminal.getByRole("heading");
  await expect
    .poll(async () => (await terminal.textContent())?.includes("LEVEL 1 CONTAINED") ?? false, {
      timeout: 45_000,
    })
    .toBe(true);
  await expect(terminalHeading).toBeVisible();
  expect(
    await terminalHeading.evaluate((heading) => {
      const overlay = heading.closest(".terminal-overlay");
      if (overlay === null) return false;
      const headingBounds = heading.getBoundingClientRect();
      const overlayBounds = overlay.getBoundingClientRect();
      return headingBounds.top >= overlayBounds.top && headingBounds.bottom <= overlayBounds.bottom;
    }),
  ).toBe(true);
  await page.getByRole("button", { name: "Continue to Level 2", exact: true }).click();
  await expect(page.getByLabel("Game status")).toContainText("Level 2 of 10: Cluster Corridor");
  await expect(playfield).toHaveAttribute("data-level-theme", "cluster-corridor");
  await expect(playfield.locator('.world-landmarks[data-level="2"]')).toBeVisible();
  await expect(playfield.locator(".campaign-route-segment").first()).toBeVisible();
  await expect(playfield.locator(".world-landmark-source")).toBeVisible();
  await expect(playfield.locator(".world-landmark-exit")).toBeVisible();
});

test("a live campaign wave keeps generated SVG ids unique", async ({ page }) => {
  await page.goto("/");
  const playfield = getPlayfield(page);
  await page.getByRole("button", { name: "Start Wave 1" }).click();
  await expect(playfield.locator("[data-enemy-id]").first()).toBeVisible();
  const ids = await playfield
    .locator("[id]")
    .evaluateAll((elements) => elements.map((element) => element.id));
  expect(new Set(ids).size).toBe(ids.length);
});
