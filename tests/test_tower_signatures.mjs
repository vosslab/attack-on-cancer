import assert from "node:assert/strict";
import test from "node:test";

import { ENEMIES } from "../src/config.ts";
import {
  advanceClonalSurge,
  advanceDoubleTap,
  getBispecificTarget,
  getClonalSurgeMultiplier,
  getPiercingTarget,
  getRepairGuaranteeAfterMisses,
  getTrogocytosisRefund,
  getTumorEditMultiplier,
  shouldDoubleTap,
} from "../src/tower_signatures.ts";

const TIER_FOUR_DOCTOR = {
  id: 1,
  type: "doctor",
  position: { x: 0, y: 0 },
  tier: 3,
  cooldownRemaining: 0,
};
const TIER_FOUR_T_CELL = {
  id: 2,
  type: "t_cell",
  position: { x: 0, y: 0 },
  tier: 3,
  cooldownRemaining: 0,
};
const TIER_FOUR_CRISPR = {
  id: 3,
  type: "crispr",
  position: { x: 0, y: 0 },
  tier: 3,
  cooldownRemaining: 0,
};
const BASIC = {
  id: 11,
  type: "basic",
  routeId: "route",
  health: 10,
  pathDistance: 80,
  markedUntil: 0,
};

test("DOUBLE TAP triggers every third Doctor shot", () => {
  const first = advanceDoubleTap(TIER_FOUR_DOCTOR);
  const second = advanceDoubleTap(first);
  assert.equal(shouldDoubleTap(second), true);
  assert.equal(advanceDoubleTap(second).signatureCharge, 0);
});

test("CLONAL SURGE caps same-target pressure and resets on a new cell", () => {
  let tower = TIER_FOUR_T_CELL;
  for (let index = 0; index < 8; index += 1) tower = advanceClonalSurge(tower, BASIC.id);
  assert.equal(getClonalSurgeMultiplier(tower, BASIC.id), 1.6);
  assert.equal(getClonalSurgeMultiplier(tower, BASIC.id + 1), 1);
});

test("PIERCING BEAM selects one further cell only on the same route", () => {
  const next = { ...BASIC, id: 12, pathDistance: 40 };
  const otherRoute = { ...BASIC, id: 13, routeId: "other", pathDistance: 30 };
  assert.equal(getPiercingTarget(BASIC, [BASIC, next, otherRoute])?.id, next.id);
});

test("BISPECIFIC LINK chooses a nearby unmarked cell", () => {
  const nearby = { ...BASIC, id: 12, pathDistance: 90 };
  const distant = { ...BASIC, id: 13, pathDistance: 400 };
  const selected = getBispecificTarget(BASIC, [BASIC, nearby, distant], (enemy) => ({
    x: enemy.pathDistance,
    y: 0,
  }));
  assert.equal(selected?.id, nearby.id);
});

test("TROGOCYTOSIS returns part of a killed cell reward", () => {
  assert.equal(getTrogocytosisRefund(BASIC), Math.floor(ENEMIES.basic.reward * 0.15));
});

test("BASE EDITOR shortens the repair guarantee and strengthens tumor editing", () => {
  assert.equal(getRepairGuaranteeAfterMisses(TIER_FOUR_CRISPR), 4);
  assert.equal(getTumorEditMultiplier(TIER_FOUR_CRISPR), 1.5);
});

test("LINGERING CLOUD is represented by the signature catalog entry", async () => {
  const { UPGRADE_PATHS } = await import("../src/upgrade_paths.ts");
  assert.equal(UPGRADE_PATHS.chemotherapy[2].signature, "lingering_cloud");
});
