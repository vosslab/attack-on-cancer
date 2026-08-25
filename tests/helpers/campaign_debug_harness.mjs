import assert from "node:assert/strict";

import { getLevelWaves } from "../../src/levels/campaign.ts";
import { canStartWave, startWave, tickGame } from "../../src/simulation.ts";

export const CAMPAIGN_TICK_SECONDS = 0.025;

/** Drives public simulation actions until the current field reaches intermission. */
export function playLevelToIntermission(initialState, options = {}) {
  const tickSeconds = options.tickSeconds ?? CAMPAIGN_TICK_SECONDS;
  const maxTicks = options.maxTicks ?? 200_000;
  const onWaveReady = options.onWaveReady ?? ((state) => state);
  const waveCount = getLevelWaves(initialState.level).length;
  let state = initialState;

  for (let tick = 0; tick < maxTicks; tick += 1) {
    if (canStartWave(state)) state = startWave(onWaveReady(state));
    if (state.status === "playing") state = tickGame(state, tickSeconds);
    if (state.status === "intermission") {
      assert.equal(state.wave, waveCount, "intermission follows the final real wave");
      return state;
    }
    assert.notEqual(state.status, "lost", `level ${state.level} lost before intermission`);
  }

  throw new Error(`Level ${state.level} did not reach intermission after ${maxTicks} real ticks.`);
}

/** Starts one real wave, then advances real ticks until the wave settles. */
export function playWaveToSettlement(initialState, options = {}) {
  const tickSeconds = options.tickSeconds ?? CAMPAIGN_TICK_SECONDS;
  const maxTicks = options.maxTicks ?? 40_000;
  let state = startWave(initialState);
  assert.notEqual(state, initialState, "a real wave must start from a ready field");

  for (let tick = 0; tick < maxTicks; tick += 1) {
    state = tickGame(state, tickSeconds);
    if (state.status !== "playing" || canStartWave(state)) return state;
  }

  throw new Error(
    `Level ${state.level} wave ${state.wave} did not settle after ${maxTicks} ticks.`,
  );
}
