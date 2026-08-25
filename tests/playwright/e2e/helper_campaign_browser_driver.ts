import { expect } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

// This is a player-visible campaign driver. It deliberately owns no simulation
// state: treatment buttons, map clicks, inspector upgrades, and continuation
// buttons are the only actions it performs.
const MAP_SIZE = { width: 960, height: 600 };
type Treatment = "doctor" | "chemotherapy" | "t_cell" | "radiation" | "antibody";
interface Placement {
  treatment: Treatment;
  position: { x: number; y: number };
}
export interface CampaignLevelProof {
  title: string;
  description: string;
  briefing: string;
  placements: Placement[];
}

const BUTTONS: Record<Treatment, RegExp> = {
  doctor: /1\. Doctor/,
  chemotherapy: /2\. Chemotherapy/,
  t_cell: /3\. Cytotoxic T Cell/,
  radiation: /4\. Radiation Bot/,
  antibody: /5\. Antibody Therapy/,
};
const COSTS: Record<Treatment, number> = {
  doctor: 90,
  chemotherapy: 150,
  t_cell: 125,
  radiation: 240,
  antibody: 145,
};
const p = (treatment: Treatment, x: number, y: number): Placement => ({
  treatment,
  position: { x, y },
});

// This authored placement sequence keeps the full-campaign proof on the same
// player-visible controls as ordinary play.
export const E2E_LEVELS: readonly CampaignLevelProof[] = [
  {
    title: "Skin Tissue",
    description: "single curved route",
    briefing: "open tissue",
    placements: [
      p("t_cell", 330, 100),
      p("t_cell", 500, 255),
      p("t_cell", 590, 490),
      p("t_cell", 800, 400),
      p("radiation", 560, 300),
      p("antibody", 780, 160),
      p("radiation", 850, 290),
      p("chemotherapy", 450, 500),
      p("t_cell", 350, 300),
      p("radiation", 290, 483),
      p("chemotherapy", 720, 330),
      p("radiation", 435, 97),
    ],
  },
  {
    title: "Cluster Corridor",
    description: "single long route begins",
    briefing: "long upper approach",
    placements: [
      p("chemotherapy", 326, 224),
      p("chemotherapy", 782, 350),
      p("chemotherapy", 650, 100),
      p("chemotherapy", 300, 450),
      p("chemotherapy", 600, 520),
      p("chemotherapy", 120, 220),
      p("t_cell", 370, 50),
      p("t_cell", 850, 330),
    ],
  },
  {
    title: "Capillary Crossroads",
    description: "splits into upper and lower branches",
    briefing: "shared crossings",
    placements: [
      p("t_cell", 520, 240),
      p("chemotherapy", 450, 220),
      p("doctor", 450, 380),
      p("radiation", 720, 300),
      p("radiation", 780, 240),
      p("radiation", 780, 360),
    ],
  },
  {
    title: "Lymph Node Loop",
    description: "counter-rotating cell routes",
    briefing: "cortical hub",
    placements: [
      p("t_cell", 770, 410),
      p("chemotherapy", 600, 220),
      p("doctor", 600, 380),
      p("radiation", 660, 300),
    ],
  },
  {
    title: "Alveolar Switchbacks",
    description: "splits into upper and lower hairpin routes",
    briefing: "parallel lanes",
    placements: [
      p("t_cell", 510, 300),
      p("chemotherapy", 708, 214),
      p("doctor", 708, 386),
      p("radiation", 600, 300),
    ],
  },
  {
    title: "Ductal Delta",
    description: "Three tumor routes begin",
    briefing: "delta neck",
    placements: [
      p("t_cell", 182, 70),
      p("t_cell", 164, 376),
      p("t_cell", 574, 248),
      p("radiation", 480, 360),
    ],
  },
  {
    title: "Vascular Bypass",
    description: "short upper bypass",
    briefing: "early split",
    placements: [p("chemotherapy", 245, 220), p("antibody", 430, 185), p("t_cell", 590, 245)],
  },
  {
    title: "Fibrotic Sieve",
    description: "Four tumor-cell lanes",
    briefing: "narrow tissue windows",
    placements: [
      p("radiation", 180, 112),
      p("radiation", 500, 82),
      p("radiation", 500, 518),
      p("radiation", 772, 470),
      p("radiation", 540, 300),
      p("radiation", 120, 240),
    ],
  },
  {
    title: "Marrow Lattice",
    description: "Three routes leave one tumor source",
    briefing: "marrow feeders",
    placements: [
      p("t_cell", 355, 150),
      p("chemotherapy", 640, 240),
      p("doctor", 840, 540),
      p("radiation", 900, 420),
      p("radiation", 420, 180),
      p("radiation", 60, 240),
      p("radiation", 60, 360),
      p("radiation", 120, 240),
    ],
  },
  {
    title: "Metastatic Confluence",
    description: "Four distinct tumor sources",
    briefing: "staged convergence zones",
    placements: [
      p("radiation", 156, 162),
      p("radiation", 152, 314),
      p("radiation", 760, 130),
      p("radiation", 360, 330),
      p("radiation", 452, 344),
      p("radiation", 686, 356),
      p("radiation", 540, 300),
      p("radiation", 840, 240),
      p("radiation", 900, 360),
      p("radiation", 420, 300),
      p("radiation", 480, 300),
    ],
  },
];

export function playfield(page: Page): Locator {
  return page.locator("svg.playfield");
}
export async function installCampaignFrameCadence(page: Page): Promise<void> {
  await page.addInitScript(() => {
    let time = 0;
    window.requestAnimationFrame = (callback): number => {
      time += 25;
      return window.setTimeout(() => callback(time), 1);
    };
    window.cancelAnimationFrame = (handle): void => window.clearTimeout(handle);
    window.localStorage.clear();
  });
}
async function points(page: Page): Promise<number> {
  const text = await page.getByLabel("Game status").textContent();
  const match = /TP\s+(\d+)/.exec(text ?? "");
  if (match === null) throw new Error(`Unable to read Treatment Points from: ${text}`);
  return Number(match[1]);
}
async function mapClick(field: Locator, position: Placement["position"]): Promise<void> {
  const box = await field.boundingBox();
  if (box === null) throw new Error("The campaign playfield has no rendered bounds.");
  await field.click({
    position: {
      x: (position.x * box.width) / MAP_SIZE.width,
      y: (position.y * box.height) / MAP_SIZE.height,
    },
  });
}
async function placeAffordable(page: Page, proof: CampaignLevelProof, start = 0): Promise<number> {
  const field = playfield(page);
  let next = start;
  while (next < proof.placements.length) {
    const placement = proof.placements[next];
    if (placement === undefined) break;
    const before = await points(page);
    if (before < COSTS[placement.treatment]) return next;
    await page.getByRole("button", { name: BUTTONS[placement.treatment] }).click();
    await mapClick(field, placement.position);
    const after = await points(page);
    if (after !== before - COSTS[placement.treatment])
      throw new Error(
        `Rejected ${placement.treatment} placement at ` +
          `(${placement.position.x}, ${placement.position.y}).`,
      );
    next += 1;
  }
  return next;
}
async function waitForAction(page: Page, nextWave: number): Promise<"wave" | "end"> {
  const next = page.getByRole("button", { name: `Start Wave ${nextWave}`, exact: true });
  const terminal = page.locator(".terminal-overlay");
  await expect
    .poll(async () => (await next.isEnabled()) || (await terminal.isVisible()), { timeout: 70_000 })
    .toBe(true);
  return (await terminal.isVisible()) ? "end" : "wave";
}
async function upgradeCoverage(page: Page): Promise<void> {
  const towers = page.getByRole("button", { name: / treatment, tier \d+, id \d+$/ });
  const inspector = page.getByRole("complementary", { name: "Selected treatment inspector" });
  for (let index = 0; index < (await towers.count()); index += 1) {
    const tower = towers.nth(index);
    await tower.focus();
    await expect(tower).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(inspector).toBeVisible();
    const upgrade = inspector.getByRole("button", { name: /^Upgrade:/ });
    if ((await upgrade.count()) > 0 && (await upgrade.isEnabled())) {
      const tier = await tower.getAttribute("data-visual-tier");
      const before = await points(page);
      await upgrade.click();
      await expect
        .poll(
          async () =>
            (await tower.getAttribute("data-visual-tier")) !== tier ||
            (await points(page)) < before,
        )
        .toBe(true);
    }
  }
}
export async function verifyCampaignLevelContext(
  page: Page,
  levelNumber: number,
  proof: CampaignLevelProof,
): Promise<void> {
  await expect(page.getByLabel("Game status")).toContainText(
    `Level ${levelNumber} of 10: ${proof.title}`,
  );
  await expect(page.getByRole("region", { name: "Campaign map context" })).toContainText(
    `Level ${levelNumber} of 10`,
  );
  await expect(page.locator(".campaign-briefing")).toContainText(proof.briefing);
  await expect(page.locator("#campaign-map-description")).toContainText(proof.description);
  await expect(playfield(page)).toHaveAttribute("aria-describedby", "campaign-map-description");
}

export async function verifySceneLearningAtLevel(page: Page): Promise<void> {
  const field = playfield(page);
  const objects = field.locator("[data-scene-object]");
  expect(await objects.count()).toBeGreaterThan(1);

  for (const object of await objects.all()) {
    const tooltip = object.locator(".scene-tooltip-card");
    await object.focus();
    await expect(object).toBeFocused();
    await expect(tooltip).toBeVisible();

    const content = await object.evaluate((element) => {
      const fact = element.querySelector(".scene-tooltip-biological-fact")?.textContent?.trim();
      const role = element.querySelector(".scene-tooltip-game-role")?.textContent?.trim();
      const label = element.getAttribute("aria-label");
      return { fact, role, label };
    });
    expect(content.fact).toBeTruthy();
    expect(content.role).toBeTruthy();
    expect(content.label).toContain(content.fact);
    expect(content.label).toContain(content.role);

    const bounds = await tooltip.evaluate((element) => {
      const card = element.getBoundingClientRect();
      const svg = element.closest("svg")?.getBoundingClientRect();
      if (svg === undefined) throw new Error("Scene tooltip is outside the SVG playfield.");
      return {
        bottom: card.bottom <= svg.bottom + 1,
        left: card.left >= svg.left - 1,
        right: card.right <= svg.right + 1,
        top: card.top >= svg.top - 1,
      };
    });
    expect(bounds).toEqual({ bottom: true, left: true, right: true, top: true });

    await page.keyboard.press("Escape");
    await expect(tooltip).toBeHidden();
  }
}
export interface CampaignRunOptions {
  onLevelEntry?: (page: Page, levelNumber: number, proof: CampaignLevelProof) => Promise<void>;
  stopAfterLevel?: number;
}
export async function playVisibleCampaign(
  page: Page,
  options: CampaignRunOptions = {},
): Promise<void> {
  for (const [index, proof] of E2E_LEVELS.entries()) {
    const levelNumber = index + 1;
    await verifyCampaignLevelContext(page, levelNumber, proof);
    await options.onLevelEntry?.(page, levelNumber, proof);
    if (options.stopAfterLevel === levelNumber) return;
    const count = await playfield(page).locator("[data-tower-id]").count();
    let nextPlacement = await placeAffordable(page, proof);
    expect(await playfield(page).locator("[data-tower-id]").count()).toBeGreaterThan(count);
    if (levelNumber === 2) {
      expect(nextPlacement).toBe(6);
      expect(await points(page)).toBe(0);
    }
    let wave = 1;
    while (true) {
      await page.getByRole("button", { name: `Start Wave ${wave}`, exact: true }).click();
      const action = await waitForAction(page, wave + 1);
      if (action === "end") break;
      nextPlacement = await placeAffordable(page, proof, nextPlacement);
      if (levelNumber === 2 && wave === 1) expect(nextPlacement).toBe(8);
      await upgradeCoverage(page);
      wave += 1;
    }
    if (levelNumber < E2E_LEVELS.length) {
      await expect(page.locator(".terminal-overlay")).toContainText(
        `LEVEL ${levelNumber} CONTAINED`,
      );
      await page
        .getByRole("button", { name: `Continue to Level ${levelNumber + 1}`, exact: true })
        .click();
      continue;
    }
    await expect(page.locator(".terminal-overlay")).toContainText("CANCER CONTAINED");
    await expect(page.locator(".terminal-overlay")).toContainText("All ten campaign levels");
    const terminalStatus = await page.getByLabel("Game status").textContent();
    const metastases = /Metastases\s+(\d+)\/(\d+)/.exec(terminalStatus ?? "");
    if (metastases === null)
      throw new Error(`Unable to read final metastases from: ${terminalStatus}`);
    expect(Number(metastases[1])).toBeLessThan(Number(metastases[2]));
  }
}
