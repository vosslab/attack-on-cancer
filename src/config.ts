import type {
  DifficultyConfig,
  DifficultyId,
  EnemyConfig,
  EnemyId,
  Point,
  SceneId,
  TowerConfig,
  TowerId,
  UpgradeConfig,
  WaveEntry,
} from "./game_types";

export const PLAYFIELD_WIDTH = 960;
export const PLAYFIELD_HEIGHT = 600;
export const CHALLENGE_WAVE_MULTIPLIER = 1.4;
export const SCENE_ONE_WAVE_COUNT = 15;
export const CLUSTER_SCENE_BUILD_GRANT = 200;
export const SELL_REFUND_RATE = 0.55;

interface CubicRouteSegment {
  controlOne: Point;
  controlTwo: Point;
  end: Point;
}

const ROUTE_STEPS_PER_CURVE = 8;

function sampleCubicRoute(start: Point, segments: readonly CubicRouteSegment[]): readonly Point[] {
  const points: Point[] = [{ ...start }];
  let segmentStart = start;
  for (const segment of segments) {
    for (let step = 1; step <= ROUTE_STEPS_PER_CURVE; step += 1) {
      const fraction = step / ROUTE_STEPS_PER_CURVE;
      const inverse = 1 - fraction;
      points.push({
        x:
          inverse ** 3 * segmentStart.x +
          3 * inverse ** 2 * fraction * segment.controlOne.x +
          3 * inverse * fraction ** 2 * segment.controlTwo.x +
          fraction ** 3 * segment.end.x,
        y:
          inverse ** 3 * segmentStart.y +
          3 * inverse ** 2 * fraction * segment.controlOne.y +
          3 * inverse * fraction ** 2 * segment.controlTwo.y +
          fraction ** 3 * segment.end.y,
      });
    }
    segmentStart = segment.end;
  }
  return points;
}

export const PATH: readonly Point[] = sampleCubicRoute({ x: 52, y: 324 }, [
  {
    controlOne: { x: 126, y: 332 },
    controlTwo: { x: 178, y: 316 },
    end: { x: 218, y: 252 },
  },
  {
    controlOne: { x: 258, y: 188 },
    controlTwo: { x: 338, y: 177 },
    end: { x: 388, y: 210 },
  },
  {
    controlOne: { x: 430, y: 238 },
    controlTwo: { x: 448, y: 352 },
    end: { x: 510, y: 374 },
  },
  {
    controlOne: { x: 558, y: 394 },
    controlTwo: { x: 622, y: 400 },
    end: { x: 658, y: 360 },
  },
  {
    controlOne: { x: 692, y: 322 },
    controlTwo: { x: 700, y: 265 },
    end: { x: 750, y: 242 },
  },
  {
    controlOne: { x: 792, y: 222 },
    controlTwo: { x: 854, y: 250 },
    end: { x: 900, y: 245 },
  },
]);

const CLUSTER_PATH: readonly Point[] = sampleCubicRoute({ x: 52, y: 318 }, [
  {
    controlOne: { x: 108, y: 326 },
    controlTwo: { x: 164, y: 310 },
    end: { x: 190, y: 254 },
  },
  {
    controlOne: { x: 216, y: 194 },
    controlTwo: { x: 218, y: 142 },
    end: { x: 278, y: 116 },
  },
  {
    controlOne: { x: 326, y: 94 },
    controlTwo: { x: 374, y: 100 },
    end: { x: 416, y: 142 },
  },
  {
    controlOne: { x: 458, y: 184 },
    controlTwo: { x: 478, y: 220 },
    end: { x: 456, y: 278 },
  },
  {
    controlOne: { x: 438, y: 326 },
    controlTwo: { x: 392, y: 358 },
    end: { x: 418, y: 408 },
  },
  {
    controlOne: { x: 442, y: 454 },
    controlTwo: { x: 490, y: 482 },
    end: { x: 548, y: 474 },
  },
  {
    controlOne: { x: 604, y: 468 },
    controlTwo: { x: 654, y: 450 },
    end: { x: 686, y: 402 },
  },
  {
    controlOne: { x: 720, y: 352 },
    controlTwo: { x: 742, y: 320 },
    end: { x: 724, y: 278 },
  },
  {
    controlOne: { x: 708, y: 238 },
    controlTwo: { x: 664, y: 210 },
    end: { x: 674, y: 174 },
  },
  {
    controlOne: { x: 688, y: 126 },
    controlTwo: { x: 766, y: 108 },
    end: { x: 812, y: 132 },
  },
  {
    controlOne: { x: 856, y: 154 },
    controlTwo: { x: 864, y: 220 },
    end: { x: 900, y: 242 },
  },
]);

export function getScenePath(scene: SceneId): readonly Point[] {
  return scene === 1 ? PATH : CLUSTER_PATH;
}

export const DIFFICULTIES: Record<DifficultyId, DifficultyConfig> = {
  practice: { label: "Practice", startingTp: 500, metastasisCapacity: 20 },
  standard: { label: "Standard", startingTp: 380, metastasisCapacity: 15 },
  challenge: { label: "Challenge", startingTp: 200, metastasisCapacity: 7 },
};

export const TOWERS: Record<TowerId, TowerConfig> = {
  doctor: {
    name: "Doctor",
    shortName: "Dr",
    cost: 90,
    range: 118,
    damage: 13,
    cooldown: 0.68,
    color: "#3178c6",
    description: "A reliable syringe for nearby cells.",
  },
  chemotherapy: {
    name: "Chemotherapy",
    shortName: "Chemo",
    cost: 150,
    range: 104,
    damage: 18,
    cooldown: 1.12,
    splashRadius: 48,
    color: "#9b45c6",
    description: "A treatment cloud that damages tight groups.",
  },
  t_cell: {
    name: "Cytotoxic T Cell",
    shortName: "T Cell",
    cost: 125,
    range: 130,
    damage: 10,
    cooldown: 0.29,
    color: "#e5534b",
    description: "Rapid immune strikes. Immune-evasive cells resist it.",
  },
  radiation: {
    name: "Radiation Bot",
    shortName: "Rad Bot",
    cost: 240,
    range: 205,
    damage: 62,
    cooldown: 1.7,
    color: "#ec9c27",
    description: "Long-range, high-energy precision damage.",
  },
  antibody: {
    name: "Antibody Therapy",
    shortName: "Antibody",
    cost: 145,
    range: 145,
    damage: 5,
    cooldown: 0.58,
    markDuration: 2.7,
    slowFactor: 0.76,
    color: "#18a890",
    description: "Marks a cell: it slows, takes more damage, and loses immune evasion.",
  },
  macrophage: {
    name: "CAR Macrophage",
    shortName: "CAR-M",
    cost: 210,
    range: 76,
    damage: 78,
    cooldown: 1.55,
    markedDamageMultiplier: 1.85,
    attackVisualDuration: 0.38,
    color: "#287f85",
    description:
      "An experimental engineered phagocyte: slow, close-range engulfing with extra damage " +
      "to antibody-marked cells.",
  },
  crispr: {
    name: "CRISPR Repair Editor",
    shortName: "CRISPR",
    cost: 180,
    range: 155,
    damage: 0,
    cooldown: 1.2,
    attackVisualDuration: 0.48,
    repairChanceByTier: [0.12, 0.16, 0.22, 0.3],
    repairPityStep: 0.03,
    repairGuaranteeAfterMisses: 7,
    tumorEditDamage: 72,
    tumorShedDelay: 82,
    color: "#5968d8",
    description:
      "A speculative genome editor: low-chance cell repair, with sequence confidence after " +
      "mismatches. Tumor Mass edits only suppress shedding and remove one segment.",
  },
};

export const UPGRADES: readonly UpgradeConfig[] = [
  {
    name: "Calibrated",
    cost: 65,
    damageMultiplier: 1.28,
    rangeBonus: 10,
    cooldownMultiplier: 0.94,
    description: "Sharper delivery and a little more reach.",
  },
  {
    name: "Focused",
    cost: 115,
    damageMultiplier: 1.35,
    rangeBonus: 14,
    cooldownMultiplier: 0.9,
    description: "More concentrated treatment.",
  },
  {
    name: "Breakthrough",
    cost: 190,
    damageMultiplier: 1.5,
    rangeBonus: 20,
    cooldownMultiplier: 0.84,
    description: "Maximum v1 treatment potency.",
  },
] as const;

export const ENEMIES: Record<EnemyId, EnemyConfig> = {
  basic: {
    name: "Basic cell",
    health: 48,
    speed: 48,
    reward: 8,
    color: "#f05d75",
    description: "A standard cancer cell.",
  },
  fast: {
    name: "Fast cell",
    health: 34,
    speed: 79,
    reward: 9,
    color: "#f28b42",
    description: "Fragile, but quick to reach circulation.",
  },
  tough: {
    name: "Tough cell",
    health: 190,
    speed: 30,
    reward: 20,
    color: "#9c4f78",
    description: "Slow, dense, and hard to remove.",
  },
  dividing: {
    name: "Dividing cell",
    health: 82,
    speed: 39,
    reward: 14,
    color: "#ca4aa3",
    description: "Splits into two basic cells when destroyed.",
  },
  immune_evasive: {
    name: "Immune-evasive cell",
    health: 104,
    speed: 43,
    reward: 18,
    color: "#5666d9",
    description: "Resists T Cell damage until antibody-marked.",
  },
  tumor_mass: {
    name: "Tumor Mass",
    health: 1050,
    speed: 20,
    reward: 150,
    color: "#74254f",
    description:
      "A MOAB-inspired tumor mass. It sheds cells as it pulses, then ruptures into six Basic and four Tough cells.",
  },
};

export const WAVES: readonly (readonly WaveEntry[])[] = [
  [{ type: "basic", count: 7, gap: 0.7 }],
  [{ type: "basic", count: 11, gap: 0.55 }],
  [{ type: "basic", count: 15, gap: 0.42 }],
  [
    { type: "basic", count: 10, gap: 0.45 },
    { type: "fast", count: 7, gap: 0.38 },
  ],
  [
    { type: "tough", count: 4, gap: 1 },
    { type: "basic", count: 12, gap: 0.35 },
  ],
  [
    { type: "fast", count: 16, gap: 0.28 },
    { type: "tough", count: 4, gap: 0.85 },
  ],
  [
    { type: "dividing", count: 7, gap: 0.72 },
    { type: "basic", count: 10, gap: 0.35 },
  ],
  [
    { type: "fast", count: 14, gap: 0.3 },
    { type: "dividing", count: 8, gap: 0.6 },
  ],
  [
    { type: "tough", count: 7, gap: 0.78 },
    { type: "fast", count: 12, gap: 0.28 },
  ],
  [
    { type: "immune_evasive", count: 8, gap: 0.62 },
    { type: "basic", count: 12, gap: 0.32 },
  ],
  [
    { type: "immune_evasive", count: 11, gap: 0.5 },
    { type: "dividing", count: 8, gap: 0.5 },
  ],
  [
    { type: "tough", count: 9, gap: 0.62 },
    { type: "fast", count: 18, gap: 0.24 },
  ],
  [
    { type: "immune_evasive", count: 12, gap: 0.42 },
    { type: "tough", count: 8, gap: 0.62 },
  ],
  [
    { type: "dividing", count: 13, gap: 0.43 },
    { type: "fast", count: 20, gap: 0.2 },
  ],
  [
    { type: "basic", count: 12, gap: 0.26 },
    { type: "fast", count: 14, gap: 0.24 },
    { type: "tough", count: 8, gap: 0.48 },
    { type: "dividing", count: 10, gap: 0.36 },
    { type: "immune_evasive", count: 12, gap: 0.34 },
    { type: "tumor_mass", count: 1, gap: 0.5 },
  ],
  [
    { type: "basic", count: 30, gap: 0.19 },
    { type: "fast", count: 22, gap: 0.17 },
  ],
  [
    { type: "tough", count: 16, gap: 0.38 },
    { type: "dividing", count: 20, gap: 0.25 },
  ],
  [
    { type: "immune_evasive", count: 22, gap: 0.24 },
    { type: "fast", count: 28, gap: 0.15 },
    { type: "basic", count: 18, gap: 0.18 },
  ],
  [
    { type: "dividing", count: 28, gap: 0.21 },
    { type: "tough", count: 18, gap: 0.31 },
    { type: "immune_evasive", count: 16, gap: 0.25 },
  ],
  [
    { type: "basic", count: 35, gap: 0.14 },
    { type: "fast", count: 35, gap: 0.13 },
    { type: "tough", count: 20, gap: 0.29 },
    { type: "dividing", count: 18, gap: 0.22 },
  ],
  [
    { type: "basic", count: 40, gap: 0.12 },
    { type: "fast", count: 40, gap: 0.12 },
    { type: "dividing", count: 30, gap: 0.17 },
    { type: "immune_evasive", count: 30, gap: 0.19 },
    { type: "tough", count: 24, gap: 0.26 },
    { type: "tumor_mass", count: 1, gap: 0.5 },
  ],
] as const;
