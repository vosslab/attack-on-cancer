import assert from "node:assert/strict";
import test from "node:test";

import {
  DIFFICULTIES,
  ENEMIES,
  SCENE_ONE_WAVE_COUNT,
  TOWERS,
  UPGRADES,
  WAVES,
} from "../src/config.ts";
import {
  canStartWave,
  createGameState,
  getPathLength,
  getPathPosition,
  getRepairChance,
  getSellValue,
  placeTower,
  startClusterScene,
  startWave,
  tickGame,
  upgradeTower,
  sellTower,
} from "../src/simulation.ts";

test("path endpoints and first wave scheduling are deterministic", () => {
  const pathLength = getPathLength();
  const clusterPathLength = getPathLength(2);
  const state = createGameState("practice");
  const started = startWave(state);
  const firstWaveCells = WAVES[0].reduce((total, entry) => total + entry.count, 0);

  assert.equal(getPathPosition(0).x, 52);
  assert.ok(Math.abs(getPathPosition(pathLength).x - 900) < 0.000001);
  assert.ok(clusterPathLength > pathLength);
  assert.equal(started.status, "playing");
  assert.equal(started.wave, 1);
  assert.equal(started.pendingSpawns.length, firstWaveCells);
  assert.equal(canStartWave(started), false);

  const advanced = tickGame(started, 0.01);
  assert.equal(advanced.enemies.length, 1);
  assert.equal(advanced.pendingSpawns.length, firstWaveCells - 1);
  assert.ok(advanced.enemies[0].pathDistance > 0);
});

test("placement, upgrades, and selling update treatment points only for legal actions", () => {
  const initial = createGameState("practice");
  const invalid = placeTower(initial, "doctor", { x: 52, y: 324 });
  assert.equal(invalid, initial);

  const placed = placeTower(initial, "doctor", { x: 100, y: 120 });
  const tower = placed.towers[0];
  assert.ok(tower !== undefined);
  assert.equal(placed.tp, initial.tp - TOWERS.doctor.cost);

  const upgraded = upgradeTower(placed, tower.id);
  assert.equal(upgraded.towers[0].tier, 1);
  assert.equal(upgraded.tp, placed.tp - UPGRADES[0].cost);

  const sold = sellTower(upgraded, tower.id);
  assert.equal(sold.towers.length, 0);
  assert.equal(sold.tp, upgraded.tp + getSellValue(upgraded.towers[0]));
});

test("dividing cells reward treatment points and produce two basic children", () => {
  const initial = createGameState("practice");
  const state = {
    ...initial,
    status: "playing",
    towers: [{ id: 1, type: "doctor", position: { x: 80, y: 280 }, tier: 0, cooldownRemaining: 0 }],
    nextTowerId: 2,
    enemies: [{ id: 1, type: "dividing", health: 1, pathDistance: 0, markedUntil: 0 }],
    nextEnemyId: 2,
  };

  const advanced = tickGame(state, 0.01);
  assert.equal(advanced.tp, initial.tp + ENEMIES.dividing.reward);
  assert.equal(advanced.enemies.length, 2);
  assert.deepEqual(
    advanced.enemies.map((enemy) => enemy.type),
    ["basic", "basic"],
  );
  assert.equal(advanced.nextEnemyId, 4);
});

test("antibody marks remove immune-evasion resistance for a following T Cell attack", () => {
  const initial = createGameState("practice");
  const state = {
    ...initial,
    status: "playing",
    towers: [
      { id: 1, type: "antibody", position: { x: 80, y: 280 }, tier: 0, cooldownRemaining: 0 },
      { id: 2, type: "t_cell", position: { x: 80, y: 280 }, tier: 0, cooldownRemaining: 0 },
    ],
    nextTowerId: 3,
    enemies: [
      {
        id: 1,
        type: "immune_evasive",
        health: ENEMIES.immune_evasive.health,
        pathDistance: 0,
        markedUntil: 0,
      },
    ],
  };

  const advanced = tickGame(state, 0.01);
  const enemy = advanced.enemies[0];
  const expectedDamage = (TOWERS.antibody.damage + TOWERS.t_cell.damage) * 1.35;
  assert.ok(enemy !== undefined);
  assert.ok(enemy.markedUntil > advanced.time);
  assert.equal(enemy.health, ENEMIES.immune_evasive.health - expectedDamage);
});

function damageFromSingleTower(type, markedUntil) {
  const initial = createGameState("practice");
  const state = {
    ...initial,
    status: "playing",
    towers: [{ id: 1, type, position: { x: 80, y: 280 }, tier: 0, cooldownRemaining: 0 }],
    nextTowerId: 2,
    enemies: [
      {
        id: 1,
        type: "tough",
        health: ENEMIES.tough.health,
        pathDistance: 0,
        markedUntil,
      },
    ],
  };
  const advanced = tickGame(state, 0.01);
  const enemy = advanced.enemies[0];
  assert.ok(enemy !== undefined);
  return ENEMIES.tough.health - enemy.health;
}

test("CAR Macrophage gets a larger antibody-marked damage boost than ordinary treatments", () => {
  const macrophageUnmarked = damageFromSingleTower("macrophage", 0);
  const macrophageMarked = damageFromSingleTower("macrophage", 10);
  const doctorUnmarked = damageFromSingleTower("doctor", 0);
  const doctorMarked = damageFromSingleTower("doctor", 10);

  assert.ok(macrophageUnmarked > doctorUnmarked);
  assert.ok(macrophageMarked / macrophageUnmarked > doctorMarked / doctorUnmarked);
});

test("CRISPR upgrades and sequence confidence increase repair likelihood", () => {
  const baseTower = {
    id: 1,
    type: "crispr",
    position: { x: 80, y: 280 },
    tier: 0,
    cooldownRemaining: 0,
    repairMisses: 0,
    attackSequence: 0,
  };
  const tierChances = [0, 1, 2, 3].map((tier) => getRepairChance({ ...baseTower, tier }));
  const afterMismatch = getRepairChance({ ...baseTower, repairMisses: 1 });
  const guaranteed = getRepairChance({ ...baseTower, repairMisses: 7 });

  assert.ok(tierChances.every((chance, index) => index === 0 || chance > tierChances[index - 1]));
  assert.ok(afterMismatch > tierChances[0]);
  assert.equal(guaranteed, 1);
});

test("CRISPR repair is deterministic, rewards containment, and does not trigger death logic", () => {
  const initial = createGameState("practice");
  const state = {
    ...initial,
    status: "playing",
    towers: [
      {
        id: 1,
        type: "crispr",
        position: { x: 80, y: 280 },
        tier: 0,
        cooldownRemaining: 0,
        repairMisses: 7,
        attackSequence: 0,
      },
    ],
    enemies: [
      {
        id: 8,
        type: "dividing",
        health: ENEMIES.dividing.health,
        pathDistance: 0,
        markedUntil: 0,
      },
    ],
  };

  const first = tickGame(state, 0.01);
  const repeated = tickGame(state, 0.01);
  assert.deepEqual(first, repeated);
  assert.equal(first.enemies.length, 0);
  assert.equal(first.tp, initial.tp + ENEMIES.dividing.reward);
  assert.equal(first.repairEvents.length, 1);
  assert.equal(first.repairEvents[0].type, "dividing");
  assert.equal(first.towers[0].attackOutcome, "repair");
  assert.equal(first.towers[0].repairMisses, 0);
});

test("a deterministic CRISPR mismatch leaves the target intact and builds confidence", () => {
  const initial = createGameState("practice");
  const state = {
    ...initial,
    status: "playing",
    towers: [
      {
        id: 1,
        type: "crispr",
        position: { x: 80, y: 280 },
        tier: 0,
        cooldownRemaining: 0,
        repairMisses: 0,
        attackSequence: 0,
      },
    ],
    enemies: [
      {
        id: 1,
        type: "basic",
        health: ENEMIES.basic.health,
        pathDistance: 0,
        markedUntil: 0,
      },
    ],
  };

  const advanced = tickGame(state, 0.01);
  assert.equal(advanced.towers[0].attackOutcome, "mismatch");
  assert.equal(advanced.towers[0].repairMisses, 1);
  assert.equal(advanced.enemies[0].health, ENEMIES.basic.health);
  assert.equal(advanced.repairEvents.length, 0);
});

test("CRISPR prioritizes repairable cells over a Tumor Mass in the same range", () => {
  const initial = createGameState("practice");
  const state = {
    ...initial,
    status: "playing",
    towers: [
      {
        id: 1,
        type: "crispr",
        position: { x: 80, y: 280 },
        tier: 0,
        cooldownRemaining: 0,
        repairMisses: 7,
        attackSequence: 0,
      },
    ],
    enemies: [
      {
        id: 2,
        type: "basic",
        health: ENEMIES.basic.health,
        pathDistance: 0,
        markedUntil: 0,
      },
      {
        id: 3,
        type: "tumor_mass",
        health: ENEMIES.tumor_mass.health,
        pathDistance: 12,
        markedUntil: 0,
        nextShedDistance: 200,
      },
    ],
  };

  const advanced = tickGame(state, 0.01);
  assert.equal(advanced.repairEvents[0].type, "basic");
  assert.equal(advanced.enemies.length, 1);
  assert.equal(advanced.enemies[0].type, "tumor_mass");
  assert.equal(advanced.enemies[0].health, ENEMIES.tumor_mass.health);
});

test("a successful Tumor Mass edit suppresses shedding without converting the boss", () => {
  const initial = createGameState("practice");
  const state = {
    ...initial,
    status: "playing",
    towers: [
      {
        id: 1,
        type: "crispr",
        position: { x: 80, y: 280 },
        tier: 0,
        cooldownRemaining: 0,
        repairMisses: 7,
        attackSequence: 0,
      },
    ],
    enemies: [
      {
        id: 9,
        type: "tumor_mass",
        health: ENEMIES.tumor_mass.health,
        pathDistance: 0,
        markedUntil: 0,
        nextShedDistance: 200,
      },
    ],
  };

  const advanced = tickGame(state, 0.01);
  const tumor = advanced.enemies[0];
  assert.equal(tumor.type, "tumor_mass");
  assert.ok(tumor.health < ENEMIES.tumor_mass.health && tumor.health > 0);
  assert.ok(tumor.nextShedDistance > 200);
  assert.equal(advanced.repairEvents.length, 0);
  assert.equal(advanced.towers[0].attackOutcome, "tumor_suppressed");
});

test("escapes cause immediate defeat at capacity and an empty final scene wave is victory", () => {
  const initial = createGameState("practice");
  const losingState = {
    ...initial,
    status: "playing",
    metastases: DIFFICULTIES.practice.metastasisCapacity - 1,
    enemies: [
      {
        id: 1,
        type: "basic",
        health: ENEMIES.basic.health,
        pathDistance: getPathLength(),
        markedUntil: 0,
      },
    ],
  };
  const lost = tickGame(losingState, 0.01);
  assert.equal(lost.status, "lost");
  assert.equal(lost.metastases, DIFFICULTIES.practice.metastasisCapacity);
  assert.equal(lost.enemies.length, 0);

  const winningState = { ...initial, status: "playing", scene: 2, wave: WAVES.length };
  const won = tickGame(winningState, 0.01);
  assert.equal(won.status, "won");
});

test("clearing Skin Tissue opens Cluster Corridor with a fresh build field", () => {
  const initial = createGameState("practice");
  const clearedSkinTissue = {
    ...initial,
    status: "playing",
    wave: SCENE_ONE_WAVE_COUNT,
    tp: 700,
    metastases: 3,
  };

  const intermission = tickGame(clearedSkinTissue, 0.01);
  const cluster = startClusterScene(intermission);
  assert.equal(intermission.status, "intermission");
  assert.equal(cluster.scene, 2);
  assert.equal(cluster.status, "briefing");
  assert.equal(cluster.tp, 900);
  assert.equal(cluster.metastases, 3);
  assert.equal(cluster.towers.length, 0);
  assert.equal(canStartWave(cluster), true);
});
