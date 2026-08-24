import assert from "node:assert/strict";
import test from "node:test";

import { cellDeathKind, cellVariant, findDestroyedEnemies } from "../src/enemy_visuals.ts";

function enemy(id, type, pathDistance) {
  return {
    id,
    type,
    health: 1,
    pathDistance,
    markedUntil: 0,
  };
}

test("cell variants are deterministic and visibly diverse", () => {
  const firstPass = Array.from({ length: 8 }, (_, id) => cellVariant(id));
  const secondPass = Array.from({ length: 8 }, (_, id) => cellVariant(id));
  assert.deepEqual(firstPass, secondPass);
  assert.ok(new Set(firstPass).size > 1);
});

test("destroyed-cell detection excludes cells that metastasized", () => {
  const destroyed = enemy(1, "basic", 120);
  const escaped = enemy(2, "fast", 880);
  const result = findDestroyedEnemies([destroyed, escaped], [], 1);
  assert.deepEqual(
    result.map((cell) => cell.id),
    [destroyed.id],
  );
});

test("ordinary cells include apoptosis while fragmenting enemies rupture", () => {
  const ordinaryKinds = [1, 2, 3, 4].map((id) => cellDeathKind(enemy(id, "basic", 100)));
  assert.ok(ordinaryKinds.includes("apoptosis"));
  assert.equal(cellDeathKind(enemy(7, "tumor_mass", 100)), "rupture");
});
