import type {
  DifficultyConfig,
  DifficultyId,
  EnemyConfig,
  EnemyId,
  TowerConfig,
  TowerId,
  UpgradeConfig,
} from "./game_types";

export const PLAYFIELD_WIDTH = 960;
export const PLAYFIELD_HEIGHT = 600;
export const CHALLENGE_WAVE_MULTIPLIER = 1.4;
export const SELL_REFUND_RATE = 0.55;

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
