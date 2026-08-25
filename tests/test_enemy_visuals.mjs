import assert from "node:assert/strict";
import test from "node:test";

import {
  cellDeathKind,
  cellVariant,
  createCellDeathVisual,
  createCellRepairVisual,
  findDestroyedEnemies,
} from "../src/enemy_visuals.ts";
import { getEnemyVisualPosition } from "../src/simulation.ts";

function enemy(id, type, pathDistance, routeId = "skin_tissue_main") {
  return {
    id,
    type,
    routeId,
    health: 1,
    pathDistance,
    markedUntil: 0,
  };
}

test("visual lanes separate cells sharing the same route progress deterministically", () => {
  const first = getEnemyVisualPosition(1, 320, 2);
  const firstAgain = getEnemyVisualPosition(1, 320, 2);
  const neighbor = getEnemyVisualPosition(2, 320, 2);

  assert.deepEqual(first, firstAgain);
  assert.notDeepEqual(first, neighbor);
});

test("cell variants are deterministic and visibly diverse", () => {
  const firstPass = Array.from({ length: 8 }, (_, id) => cellVariant(id));
  const secondPass = Array.from({ length: 8 }, (_, id) => cellVariant(id));
  assert.deepEqual(firstPass, secondPass);
  assert.ok(new Set(firstPass).size > 1);
});

test("destroyed-cell detection excludes cells that metastasized", () => {
  const destroyed = enemy(1, "basic", 120);
  const escaped = enemy(2, "fast", 880);
  const result = findDestroyedEnemies([destroyed, escaped], [], 1, []);
  assert.deepEqual(
    result.map((cell) => cell.id),
    [destroyed.id],
  );
});

test("repaired cells do not emit a destruction transition", () => {
  const repaired = enemy(3, "tough", 240);
  const destroyed = enemy(4, "basic", 220);
  const result = findDestroyedEnemies([repaired, destroyed], [], 0, [repaired.id]);
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

test("repair and death effects inherit the parent route's canonical position", () => {
  const parent = enemy(11, "dividing", 120, "lower-capillary");
  const repair = createCellRepairVisual(
    {
      towerId: 4,
      attempt: 2,
      enemyId: 11,
      type: "dividing",
      routeId: parent.routeId,
      pathDistance: 120,
    },
    3,
    100,
  );
  const death = createCellDeathVisual(parent, 3, 100);

  assert.deepEqual(repair.position, getEnemyVisualPosition(11, 120, 3, "lower-capillary"));
  assert.deepEqual(death.position, getEnemyVisualPosition(11, 120, 3, "lower-capillary"));
  assert.notDeepEqual(death.position, getEnemyVisualPosition(11, 120, 3, "upper-capillary"));
});
