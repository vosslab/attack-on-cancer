import type { DifficultyId, SettingsSave } from "./game_types";

export const SETTINGS_STORAGE_KEY = "attack-on-cancer.settings.v1";

export interface SettingsUpdate {
  soundEnabled?: boolean;
  preferredSpeed?: 1 | 2 | 4;
  bestResults?: Partial<Record<DifficultyId, number>>;
}

const DEFAULT_SOUND_ENABLED = false;
const DEFAULT_PREFERRED_SPEED = 1;

function createDefaultSettings(): SettingsSave {
  const settings: SettingsSave = {
    version: 1,
    soundEnabled: DEFAULT_SOUND_ENABLED,
    preferredSpeed: DEFAULT_PREFERRED_SPEED,
    bestResults: {},
  };
  return settings;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  const isObject = typeof value === "object" && value !== null;
  return isObject && !Array.isArray(value);
}

function isDifficultyId(value: string): value is DifficultyId {
  return value === "practice" || value === "standard" || value === "challenge";
}

function isBestResult(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function readBestResults(value: unknown): Partial<Record<DifficultyId, number>> {
  if (!isRecord(value)) {
    return {};
  }

  const bestResults: Partial<Record<DifficultyId, number>> = {};
  for (const [difficulty, result] of Object.entries(value)) {
    if (isDifficultyId(difficulty) && isBestResult(result)) {
      bestResults[difficulty] = result;
    }
  }
  return bestResults;
}

function validateSettings(value: unknown): SettingsSave {
  const defaults = createDefaultSettings();
  if (!isRecord(value) || value.version !== 1) {
    return defaults;
  }

  const soundEnabled =
    typeof value.soundEnabled === "boolean" ? value.soundEnabled : defaults.soundEnabled;
  const preferredSpeed =
    value.preferredSpeed === 1 || value.preferredSpeed === 2 || value.preferredSpeed === 4
      ? value.preferredSpeed
      : defaults.preferredSpeed;
  const bestResults = readBestResults(value.bestResults);
  const settings: SettingsSave = {
    version: 1,
    soundEnabled,
    preferredSpeed,
    bestResults,
  };
  return settings;
}

function getBrowserStorage(): Storage | undefined {
  try {
    if (typeof window === "undefined") {
      return undefined;
    }
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function readStoredValue(storage: Storage | undefined): unknown {
  if (storage === undefined) {
    return undefined;
  }

  try {
    const serialized = storage.getItem(SETTINGS_STORAGE_KEY);
    if (serialized === null) {
      return undefined;
    }
    const parsed: unknown = JSON.parse(serialized);
    return parsed;
  } catch {
    return undefined;
  }
}

export function loadSettings(storage: Storage | undefined = getBrowserStorage()): SettingsSave {
  const storedValue = readStoredValue(storage);
  const settings = validateSettings(storedValue);
  return settings;
}

export function saveSettings(
  settings: SettingsSave,
  storage: Storage | undefined = getBrowserStorage(),
): SettingsSave {
  const validatedSettings = validateSettings(settings);
  if (storage !== undefined) {
    try {
      storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(validatedSettings));
    } catch {
      // Storage can be disabled or full; the current session still uses these settings.
    }
  }
  return validatedSettings;
}

export function updateSettings(
  update: SettingsUpdate,
  storage: Storage | undefined = getBrowserStorage(),
): SettingsSave {
  const current = loadSettings(storage);
  const next: SettingsSave = {
    version: 1,
    soundEnabled: update.soundEnabled ?? current.soundEnabled,
    preferredSpeed: update.preferredSpeed ?? current.preferredSpeed,
    bestResults:
      update.bestResults === undefined
        ? current.bestResults
        : { ...current.bestResults, ...readBestResults(update.bestResults) },
  };
  const savedSettings = saveSettings(next, storage);
  return savedSettings;
}

export function recordBestResult(
  difficulty: DifficultyId,
  result: number,
  storage: Storage | undefined = getBrowserStorage(),
): SettingsSave {
  const current = loadSettings(storage);
  const existingResult = current.bestResults[difficulty];
  const bestResult =
    isBestResult(result) && (existingResult === undefined || result > existingResult)
      ? result
      : existingResult;
  const settings = updateSettings({ bestResults: { [difficulty]: bestResult } }, storage);
  return settings;
}
