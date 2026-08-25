export type DifficultyId = "practice" | "standard" | "challenge";
export type TowerId =
  "doctor" | "chemotherapy" | "t_cell" | "radiation" | "antibody" | "macrophage" | "crispr";
export type EnemyId = "basic" | "fast" | "tough" | "dividing" | "immune_evasive" | "tumor_mass";
export type GameStatus = "briefing" | "playing" | "paused" | "intermission" | "won" | "lost";
export type SceneId = 1 | 2;
export type RepairOutcome = "repair" | "mismatch" | "tumor_suppressed";

export interface Point {
  x: number;
  y: number;
}

export interface TowerConfig {
  name: string;
  shortName: string;
  cost: number;
  range: number;
  damage: number;
  cooldown: number;
  color: string;
  description: string;
  splashRadius?: number;
  markDuration?: number;
  slowFactor?: number;
  markedDamageMultiplier?: number;
  attackVisualDuration?: number;
  repairChanceByTier?: readonly [number, number, number, number];
  repairPityStep?: number;
  repairGuaranteeAfterMisses?: number;
  tumorEditDamage?: number;
  tumorShedDelay?: number;
}

export interface UpgradeConfig {
  name: string;
  cost: number;
  damageMultiplier: number;
  rangeBonus: number;
  cooldownMultiplier: number;
  description: string;
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
  health: number;
  pathDistance: number;
  markedUntil: number;
  nextShedDistance?: number;
}

export interface Tower {
  id: number;
  type: TowerId;
  position: Point;
  tier: number;
  cooldownRemaining: number;
  attackPoint?: Point;
  attackFlashUntil?: number;
  attackOutcome?: RepairOutcome;
  repairMisses?: number;
  attackSequence?: number;
}

export interface CellRepairEvent {
  towerId: number;
  attempt: number;
  enemyId: number;
  type: EnemyId;
  pathDistance: number;
}

export interface GameState {
  status: GameStatus;
  scene: SceneId;
  difficulty: DifficultyId;
  tp: number;
  metastases: number;
  wave: number;
  enemies: Enemy[];
  towers: Tower[];
  nextEnemyId: number;
  nextTowerId: number;
  pendingSpawns: Array<{ type: EnemyId; at: number }>;
  repairEvents: CellRepairEvent[];
  time: number;
}

export interface SettingsSave {
  version: 1;
  soundEnabled: boolean;
  preferredSpeed: 1 | 2 | 4;
  bestResults: Partial<Record<DifficultyId, number>>;
}
