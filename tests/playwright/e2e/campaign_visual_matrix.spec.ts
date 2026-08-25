import { expect, test } from "@playwright/test";
import type { Page, TestInfo } from "@playwright/test";

import {
  installCampaignFrameCadence,
  playVisibleCampaign,
  playfield,
} from "./helper_campaign_browser_driver";

// Selector contract: campaign context and briefing come from src/app.tsx;
// route layers and authored world sheets come from src/world_landmarks.tsx.
// This proof advances only through the shared visible-control campaign driver.

const TARGET_LEVELS = new Set([3, 6, 8, 10]);
const TARGET_WORLD_ART: Readonly<Record<number, { art: string; theme: string }>> = {
  3: { art: "capillary_crossroads", theme: "capillary-crossroads" },
  6: { art: "ductal_delta", theme: "ductal_delta" },
  8: { art: "fibrotic_sieve", theme: "fibrotic_sieve" },
  10: { art: "metastatic_confluence", theme: "metastatic-confluence" },
};
const VIEWPORTS = [
  { width: 680, height: 900 },
  { width: 1280, height: 800 },
  { width: 1600, height: 1000 },
] as const;

type MotionMode = "normal" | "reduced";

interface LayoutMeasurement {
  viewport: { width: number; height: number };
  scroll: { width: number; height: number };
  playfield: {
    left: number;
    top: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
  };
  battlefield: { width: number; height: number };
  shellWidth: number;
  treatmentComesFirst: boolean;
  treatmentTrayTop: number;
  waveControlsTop: number;
  layers: string[];
  layerCounts: number[];
  duplicateIds: string[];
  bedFilter: string;
  pathFilter: string;
  flowDash: string;
  currentAnimation: string;
  theme: string | null;
}

async function inspectCampaignViewport(page: Page, mode: MotionMode): Promise<LayoutMeasurement> {
  const field = playfield(page);
  await expect(field).toBeVisible();
  await expect(page.getByRole("region", { name: "Campaign map context" })).toBeVisible();
  await expect(page.locator(".campaign-briefing")).toBeVisible();
  await expect(field.locator(".campaign-route-layer").first()).toBeVisible();
  await expect(field.locator(".world-landmarks")).toBeVisible();
  await expect(field.locator(".world-landmark-source").first()).toBeVisible();
  await expect(field.locator(".world-landmark-marker")).toHaveCount(0);

  const measurement = await page.evaluate((): LayoutMeasurement => {
    const fieldElement = document.querySelector<SVGSVGElement>("svg.playfield");
    const battlefield = document.querySelector<HTMLElement>(".battle-area");
    if (fieldElement === null) throw new Error("Missing svg.playfield.");
    if (battlefield === null) throw new Error("Missing .battle-area.");
    const routes = [...fieldElement.querySelectorAll<SVGGElement>(".campaign-route-layer")];
    const ids = [...document.querySelectorAll<HTMLElement | SVGElement>("[id]")]
      .map((element) => element.id)
      .filter((id) => id.length > 0);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    const rect = fieldElement.getBoundingClientRect();
    const bedLayer = fieldElement.querySelector<SVGGElement>(".campaign-route-beds");
    const bedPath = fieldElement.querySelector<SVGPathElement>(".route-bed");
    const flow = fieldElement.querySelector<SVGPathElement>(".route-flow");
    const current = fieldElement.querySelector<SVGPathElement>(".route-current");
    const treatmentTray = document.querySelector<HTMLElement>(".treatment-tray");
    const waveControls = document.querySelector<HTMLElement>(".wave-controls");
    const shell = document.querySelector<HTMLElement>(".game-shell");
    if (bedLayer === null || bedPath === null || flow === null || current === null)
      throw new Error("Campaign vessel paint layer is incomplete.");
    if (treatmentTray === null || waveControls === null || shell === null)
      throw new Error("Campaign planning controls are incomplete.");
    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      scroll: {
        width: document.documentElement.scrollWidth,
        height: document.documentElement.scrollHeight,
      },
      playfield: {
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
      },
      battlefield: {
        width: battlefield.getBoundingClientRect().width,
        height: battlefield.getBoundingClientRect().height,
      },
      shellWidth: shell.getBoundingClientRect().width,
      treatmentComesFirst:
        (treatmentTray.compareDocumentPosition(waveControls) & Node.DOCUMENT_POSITION_FOLLOWING) !==
        0,
      treatmentTrayTop: treatmentTray.getBoundingClientRect().top,
      waveControlsTop: waveControls.getBoundingClientRect().top,
      layers: routes.map((route) => route.dataset.routeLayer ?? ""),
      layerCounts: routes.map((route) => route.querySelectorAll("[data-route-segment]").length),
      duplicateIds: duplicates,
      bedFilter: getComputedStyle(bedLayer).filter,
      pathFilter: getComputedStyle(bedPath).filter,
      flowDash: getComputedStyle(flow).strokeDasharray,
      currentAnimation: getComputedStyle(current).animationName,
      theme: fieldElement.dataset.levelTheme ?? null,
    };
  });

  expect(measurement.scroll.width).toBeLessThanOrEqual(measurement.viewport.width + 1);
  if (measurement.viewport.width >= 900) {
    expect(measurement.scroll.height).toBeLessThanOrEqual(measurement.viewport.height + 1);
    expect(measurement.playfield.top).toBeGreaterThanOrEqual(-1);
    expect(measurement.playfield.bottom).toBeLessThanOrEqual(measurement.viewport.height + 1);
    expect(measurement.battlefield.width / measurement.battlefield.height).toBeCloseTo(9 / 5, 2);
    const minimumBattlefieldShare = measurement.viewport.width >= 1500 ? 0.82 : 0.73;
    expect(measurement.battlefield.width).toBeGreaterThan(
      measurement.shellWidth * minimumBattlefieldShare,
    );
  }
  expect(measurement.playfield.left).toBeGreaterThanOrEqual(-1);
  expect(measurement.playfield.right).toBeLessThanOrEqual(measurement.viewport.width + 1);
  expect(measurement.layers).toEqual(["bed", "membrane", "flow", "current"]);
  expect(new Set(measurement.layerCounts).size).toBe(1);
  expect(measurement.layerCounts[0]).toBeGreaterThan(0);
  expect(measurement.duplicateIds).toEqual([]);
  expect(measurement.bedFilter).not.toBe("none");
  expect(measurement.pathFilter).toBe("none");
  expect(measurement.flowDash).toBe("none");
  expect(measurement.treatmentComesFirst).toBe(true);
  expect(measurement.treatmentTrayTop).toBeLessThanOrEqual(measurement.waveControlsTop + 1);
  if (mode === "normal") expect(measurement.currentAnimation).not.toBe("none");
  else expect(measurement.currentAnimation).toBe("none");
  expect(measurement.theme).not.toBeNull();
  return measurement;
}

async function captureTargetLevel(
  page: Page,
  testInfo: TestInfo,
  levelNumber: number,
  mode: MotionMode,
): Promise<void> {
  const expectedWorld = TARGET_WORLD_ART[levelNumber];
  if (expectedWorld === undefined)
    throw new Error(`No authored-world expectation for Level ${levelNumber}.`);
  await expect(page.locator(".level-world-art")).toBeVisible();
  await expect(page.locator(".level-world-art")).toHaveAttribute(
    "data-world-art",
    expectedWorld.art,
  );
  await expect(playfield(page)).toHaveAttribute("data-level-theme", expectedWorld.theme);
  for (const viewport of VIEWPORTS) {
    await page.setViewportSize(viewport);
    const measurement = await inspectCampaignViewport(page, mode);
    expect(measurement.viewport).toEqual(viewport);
    const narrowFullPage = viewport.width === 680;
    const filename = narrowFullPage
      ? `campaign_level_${String(levelNumber).padStart(2, "0")}_${viewport.width}w_fullpage_${mode}.png`
      : `campaign_level_${String(levelNumber).padStart(2, "0")}_${viewport.width}x${viewport.height}_${mode}.png`;
    const output = testInfo.outputPath(filename);
    await page.screenshot({ fullPage: narrowFullPage, path: output });
  }
}

function matrixTest(mode: MotionMode): void {
  test(`campaign visual matrix: ${mode} motion`, async ({ page }, testInfo) => {
    test.setTimeout(40 * 60_000);
    await page.emulateMedia({ reducedMotion: mode === "reduced" ? "reduce" : "no-preference" });
    await installCampaignFrameCadence(page);
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Attack on Cancer" })).toBeVisible();
    await playVisibleCampaign(page, {
      onLevelEntry: async (activePage, levelNumber) => {
        if (TARGET_LEVELS.has(levelNumber)) {
          await captureTargetLevel(activePage, testInfo, levelNumber, mode);
        }
      },
    });
  });
}

matrixTest("normal");
matrixTest("reduced");
