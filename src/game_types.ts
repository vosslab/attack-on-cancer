import type { TowerId } from "./tower_ids";

export type { TowerId } from "./tower_ids";
export type DifficultyId = "practice" | "standard" | "challenge";
export type EnemyId = "basic" | "fast" | "tough" | "dividing" | "immune_evasive" | "tumor_mass";
export type GameStatus = "briefing" | "playing" | "paused" | "intermission" | "won" | "lost";
export type LevelId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type RouteId = string;
export type RepairOutcome = "repair" | "mismatch" | "tumor_suppressed";
export type SignatureId =
  | "double_tap"
  | "lingering_cloud"
  | "clonal_surge"
  | "piercing_beam"
  | "bispecific_link"
  | "trogocytosis"
  | "base_editor";
export type TierValues = readonly [number, number, number, number];
export type TowerTier = 0 | 1 | 2 | 3;
export type UpgradeBurstTier = 1 | 2 | 3;

export function nextTowerTier(tier: TowerTier): TowerTier | undefined {
  const nextTiers: Readonly<Record<TowerTier, TowerTier | undefined>> = {
    0: 1,
    1: 2,
    2: 3,
    3: undefined,
  };
  return nextTiers[tier];
}

export function upgradeBurstTier(tier: TowerTier): UpgradeBurstTier | undefined {
  return tier === 0 ? undefined : tier;
}

export interface Point {
  x: number;
  y: number;
}

export interface TowerConfigBase {
  readonly name: string;
  readonly shortName: string;
  readonly cost: number;
  readonly range: number;
  readonly damage: number;
  readonly cooldown: number;
  readonly color: string;
  readonly description: string;
  readonly attackVisualDurationByTier: TierValues;
}

export interface ChemotherapyTowerConfig extends TowerConfigBase {
  readonly splashRadius: number;
  readonly splashRadiusByTier: TierValues;
}

export interface AntibodyTowerConfig extends TowerConfigBase {
  readonly markDuration: number;
  readonly slowFactor: number;
}

export interface MacrophageTowerConfig extends TowerConfigBase {
  readonly markedDamageMultiplier: number;
}

export interface CrisprTowerConfig extends TowerConfigBase {
  readonly repairChanceByTier: TierValues;
  readonly repairPityStep: number;
  readonly tumorEditDamage: number;
  readonly tumorShedDelay: number;
}

export type TowerConfigById = {
  readonly doctor: TowerConfigBase;
  readonly chemotherapy: ChemotherapyTowerConfig;
  readonly t_cell: TowerConfigBase;
  readonly radiation: TowerConfigBase;
  readonly antibody: AntibodyTowerConfig;
  readonly macrophage: MacrophageTowerConfig;
  readonly crispr: CrisprTowerConfig;
};

export type TowerConfig = TowerConfigById[TowerId];

export interface UpgradeConfig {
  readonly name: string;
  readonly cost: number;
  readonly damageMultiplier: number;
  readonly rangeBonus: number;
  readonly cooldownMultiplier: number;
  readonly description: string;
  readonly biologicalFact: string;
  readonly gameRole: string;
}

export interface SignatureUpgradeConfig extends UpgradeConfig {
  readonly signature: SignatureId;
  readonly signatureName: string;
}

export interface EnemyConfig {
  name: string;
  health: number;
  speed: number;
  reward: number;
  color: string;
  description: string;
}

export interface DifficultyConfig {
  label: string;
  startingTp: number;
  metastasisCapacity: number;
}

export interface WaveEntry {
  type: EnemyId;
  count: number;
  gap: number;
}

export interface Enemy {
  id: number;
  type: EnemyId;
  routeId: RouteId;
  health: number;
  pathDistance: number;
  markedUntil: number;
  nextShedDistance?: number;
}

export interface Tower {
  id: number;
  type: TowerId;
  position: Point;
  tier: TowerTier;
  cooldownRemaining: number;
  attackPoint?: Point;
  attackFlashUntil?: number;
  upgradeFlashUntil?: number;
  attackOutcome?: RepairOutcome;
  repairMisses?: number;
  attackSequence?: number;
  doubleTapShots?: 0 | 1 | 2;
  clonalTargetId?: number;
  clonalStacks?: number;
  cooldownResetPending?: boolean;
}

export interface CellRepairEvent {
  towerId: number;
  attempt: number;
  enemyId: number;
  type: EnemyId;
  routeId: RouteId;
  pathDistance: number;
}

export interface PendingSpawn {
  type: EnemyId;
  routeId: RouteId;
  at: number;
}

export interface GameState {
  status: GameStatus;
  level: LevelId;
  difficulty: DifficultyId;
  tp: number;
  metastases: number;
  wave: number;
  enemies: Enemy[];
  towers: Tower[];
  nextEnemyId: number;
  nextTowerId: number;
  pendingSpawns: PendingSpawn[];
  repairEvents: CellRepairEvent[];
  lingeringFields: LingeringField[];
  time: number;
}

export interface LingeringField {
  position: Point;
  radius: number;
  damagePerSecond: number;
  expiresAt: number;
  sourceTowerId: number;
}
