import assert from "node:assert/strict";
import test from "node:test";

import {
  loadSettings,
  recordBestResult,
  SETTINGS_STORAGE_KEY,
  updateSettings,
} from "../src/persistence.ts";

function createStorage(initialValue) {
  let storedValue = initialValue;
  return {
    getItem(key) {
      return key === SETTINGS_STORAGE_KEY ? storedValue : null;
    },
    setItem(key, value) {
      if (key === SETTINGS_STORAGE_KEY) {
        storedValue = value;
      }
    },
    read() {
      return storedValue;
    },
  };
}

test("settings loading accepts only the versioned save boundary", () => {
  const missing = createStorage(null);
  assert.deepEqual(loadSettings(missing), {
    version: 1,
    soundEnabled: false,
    preferredSpeed: 1,
    bestResults: {},
  });

  const malformed = createStorage("not json");
  assert.deepEqual(loadSettings(malformed).bestResults, {});

  const mixed = createStorage(
    JSON.stringify({
      version: 1,
      soundEnabled: true,
      preferredSpeed: 2,
      bestResults: { practice: 14, invalid: 99, challenge: -1 },
    }),
  );
  assert.deepEqual(loadSettings(mixed), {
    version: 1,
    soundEnabled: true,
    preferredSpeed: 2,
    bestResults: { practice: 14 },
  });
});

test("settings updates persist supported preferences and retain the best result", () => {
  const storage = createStorage(null);
  const updated = updateSettings({ soundEnabled: true, preferredSpeed: 2 }, storage);
  assert.equal(updated.soundEnabled, true);
  assert.equal(updated.preferredSpeed, 2);
  assert.ok(typeof storage.read() === "string");

  const recorded = recordBestResult("standard", 12, storage);
  assert.equal(recorded.bestResults.standard, 12);
  const lowerResult = recordBestResult("standard", 7, storage);
  assert.equal(lowerResult.bestResults.standard, 12);
  const invalidResult = recordBestResult("standard", -1, storage);
  assert.equal(invalidResult.bestResults.standard, 12);
});
