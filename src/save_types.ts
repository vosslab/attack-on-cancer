import type { DifficultyId } from "./game_types";

/** Persisted boundary shape for the versioned local settings record. */
export interface SettingsSave {
  readonly version: 1;
  readonly soundEnabled: boolean;
  readonly preferredSpeed: 1 | 2 | 4;
  readonly bestResults: Partial<Record<DifficultyId, number>>;
}
