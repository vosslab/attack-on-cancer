import assert from "node:assert/strict";
import test from "node:test";

import { DIFFICULTIES, ENEMIES, TOWERS, UPGRADES } from "../src/config.ts";
import { getCampaignLevel, getLevelRoutePoints, getLevelWaves } from "../src/levels/campaign.ts";
import {
  canStartWave,
  createGameState,
  advanceLevel,
  getPathLength,
  getPathPosition,
  getRepairChance,
  getSellValue,
  isPathClear,
  placeTower,
  startWave,
  tickGame,
  upgradeTower,
  sellTower,
} from "../src/simulation.ts";
import { playLevelToIntermission } from "./helpers/campaign_debug_harness.mjs";

function routeDistanceToPoint(level, routeId, target) {
  const points = getLevelRoutePoints(level, routeId);
  let distance = 0;
  for (let index = 0; index < points.length; index += 1) {
    const point = points[index];
    const previous = points[index - 1];
    if (previous !== undefined) distance += Math.hypot(point.x - previous.x, point.y - previous.y);
    if (point.x === target.x && point.y === target.y) return distance;
  }
  throw new Error(`Route ${routeId} does not include ${target.x},${target.y}.`);
}

test("path endpoints and first wave scheduling are deterministic", () => {
  const pathLength = getPathLength();
  const clusterPathLength = getPathLength(2);
  const state = createGameState("practice");
  const started = startWave(state);
  const firstWaveCells = getLevelWaves(1)[0].entries.reduce(
    (total, entry) => total + entry.count,
    0,
  );

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
    enemies: [
      {
        id: 1,
        type: "dividing",
        routeId: "skin_tissue_main",
        health: 1,
        pathDistance: 0,
        markedUntil: 0,
      },
    ],
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
        routeId: "skin_tissue_main",
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
        routeId: "skin_tissue_main",
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
        routeId: "skin_tissue_main",
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
        routeId: "skin_tissue_main",
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
        routeId: "skin_tissue_main",
        health: ENEMIES.basic.health,
        pathDistance: 0,
        markedUntil: 0,
      },
      {
        id: 3,
        type: "tumor_mass",
        routeId: "skin_tissue_main",
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
        routeId: "skin_tissue_main",
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

test("escapes cause immediate defeat at capacity and an empty Level 10 wave is victory", () => {
  const initial = createGameState("practice");
  const losingState = {
    ...initial,
    status: "playing",
    metastases: DIFFICULTIES.practice.metastasisCapacity - 1,
    enemies: [
      {
        id: 1,
        type: "basic",
        routeId: "skin_tissue_main",
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

  const winningState = {
    ...initial,
    status: "playing",
    level: 10,
    wave: getLevelWaves(10).length,
  };
  const won = tickGame(winningState, 0.01);
  assert.equal(won.status, "won");
});

test("advanceLevel opens every campaign boundary with capped carryover and preserved metastases", () => {
  for (let level = 1; level < 10; level += 1) {
    const nextLevelId = level + 1;
    const source = {
      ...createGameState("practice"),
      status: "intermission",
      level,
      wave: getLevelWaves(level).length,
      tp: getCampaignLevel(nextLevelId).economy.carryoverTpCap + 99,
      metastases: 3,
      towers: [
        { id: 1, type: "doctor", position: { x: 90, y: 100 }, tier: 0, cooldownRemaining: 0 },
      ],
      enemies: [],
      pendingSpawns: [],
      repairEvents: [],
    };
    const nextLevel = advanceLevel(source);

    assert.equal(nextLevel.level, nextLevelId, `Level ${level} advances to ${nextLevelId}`);
    assert.equal(nextLevel.status, "briefing");
    assert.equal(
      nextLevel.tp,
      getCampaignLevel(nextLevelId).economy.carryoverTpCap +
        getCampaignLevel(nextLevelId).economy.reinforcementTp,
    );
    assert.equal(nextLevel.metastases, 3);
    assert.deepEqual(nextLevel.towers, []);
    assert.deepEqual(nextLevel.enemies, []);
    assert.deepEqual(nextLevel.pendingSpawns, []);
    assert.deepEqual(nextLevel.repairEvents, []);
    assert.equal(canStartWave(nextLevel), true);
  }
});

function createCappedTransitionSource(nextLevelId) {
  const previousLevelId = nextLevelId - 1;
  const economy = getCampaignLevel(nextLevelId).economy;
  return {
    ...createGameState("practice"),
    status: "intermission",
    level: previousLevelId,
    wave: getLevelWaves(previousLevelId).length,
    tp: economy.carryoverTpCap,
    towers: [],
    enemies: [],
    pendingSpawns: [],
    repairEvents: [],
  };
}

function placeCoverageProbeLayout(initialState, reverseProbes) {
  const level = getCampaignLevel(initialState.level);
  const probes = level.placementProbes.filter((probe) => probe.expectation === "legal");
  const positions = reverseProbes ? [...probes].reverse() : probes;
  const treatments =
    level.id === 10
      ? ["radiation", "radiation", "radiation", "radiation", "radiation", "radiation"]
      : level.id === 8
        ? ["radiation", "radiation", "radiation", "radiation"]
        : ["t_cell", "chemotherapy", "doctor", "antibody"];
  let state = initialState;
  for (const [index, position] of positions.entries()) {
    const treatment = treatments[index];
    if (treatment === undefined || state.tp < TOWERS[treatment].cost) continue;
    const placed = placeTower(state, treatment, position.position);
    assert.notEqual(placed, state, `${level.title} ${position.label} must accept coverage`);
    state = placed;
  }
  return state;
}

function reinforceCoverageLayout(readyState) {
  let state = readyState;
  for (const tower of readyState.towers) {
    const upgraded = upgradeTower(state, tower.id);
    if (upgraded !== state) state = upgraded;
  }
  return state;
}

function playCampaignFieldToResolution(initialState) {
  let state = initialState;
  for (let tick = 0; tick < 400_000; tick += 1) {
    if (canStartWave(state)) state = startWave(reinforceCoverageLayout(state));
    if (state.status === "playing") state = tickGame(state, 0.025);
    if (state.status === "intermission" || state.status === "won") return state;
    assert.notEqual(state.status, "lost", `level ${state.level} lost before resolution`);
  }
  throw new Error(`Level ${state.level} did not resolve after deterministic real ticks.`);
}

function placeNamedMixedCoverageLayout(initialState, placements) {
  const level = getCampaignLevel(initialState.level);
  let state = initialState;
  for (const { probeId, treatment } of placements) {
    const probe = level.placementProbes.find((candidate) => candidate.id === probeId);
    assert.equal(
      probe?.expectation,
      "legal",
      `${level.title} ${probeId} is a legal coverage pocket`,
    );
    const placed = placeTower(state, treatment, probe.position);
    assert.notEqual(placed, state, `${level.title} accepts ${treatment} at ${probe.label}`);
    state = placed;
  }
  return state;
}

test("campaign balance keeps authored entry envelopes and supports varied legal coverage layouts", () => {
  for (let levelId = 3; levelId <= 10; levelId += 1) {
    const economy = getCampaignLevel(levelId).economy;
    const entryState = advanceLevel(createCappedTransitionSource(levelId));
    assert.ok(
      entryState.tp >= economy.entryTpMinimum && entryState.tp <= economy.entryTpMaximum,
      `${getCampaignLevel(levelId).title} entry TP must remain inside its authored envelope`,
    );

    for (const reverseProbes of [false, true]) {
      const layout = placeCoverageProbeLayout(entryState, reverseProbes);
      assert.ok(
        layout.towers.length > 0,
        `${getCampaignLevel(levelId).title} has legal route coverage`,
      );
      const resolution = playCampaignFieldToResolution(layout);
      assert.equal(resolution.status, levelId === 10 ? "won" : "intermission");
    }
  }
});

test("Fibrotic Sieve resolves an illustrative mixed defense from constrained legal pockets", () => {
  const entryState = advanceLevel(createCappedTransitionSource(8));
  const economy = getCampaignLevel(8).economy;
  assert.ok(entryState.tp >= economy.entryTpMinimum && entryState.tp <= economy.entryTpMaximum);

  const layout = placeNamedMixedCoverageLayout(entryState, [
    { probeId: "northwest_suture_pocket", treatment: "radiation" },
    { probeId: "upper_sieve_window", treatment: "radiation" },
    { probeId: "lower_sieve_window", treatment: "t_cell" },
    { probeId: "distal_escape_niche", treatment: "doctor" },
  ]);
  const resolution = playCampaignFieldToResolution(layout);
  assert.equal(resolution.status, "intermission");
});

test("Metastatic Confluence resolves an illustrative mixed convergence defense", () => {
  const entryState = advanceLevel(createCappedTransitionSource(10));
  const economy = getCampaignLevel(10).economy;
  assert.ok(entryState.tp >= economy.entryTpMinimum && entryState.tp <= economy.entryTpMaximum);

  const layout = placeNamedMixedCoverageLayout(entryState, [
    { probeId: "north-early-watch", treatment: "radiation" },
    { probeId: "west-early-watch", treatment: "radiation" },
    { probeId: "east-early-watch", treatment: "radiation" },
    { probeId: "anterior-channel-watch", treatment: "t_cell" },
    { probeId: "confluence-coverage-pocket", treatment: "chemotherapy" },
    { probeId: "late-circulation-watch", treatment: "doctor" },
  ]);
  const resolution = playCampaignFieldToResolution(layout);
  assert.equal(resolution.status, "won");
});

test("a publicly deployed practice defense reaches normal intermission through real waves", () => {
  let state = createGameState("practice");
  for (const position of [
    { x: 330, y: 100 },
    { x: 500, y: 255 },
    { x: 590, y: 490 },
    { x: 800, y: 400 },
  ]) {
    state = placeTower(state, "t_cell", position);
  }
  assert.equal(state.towers.length, 4);

  const intermission = playLevelToIntermission(state, {
    onWaveReady: (readyState) => {
      let reinforced = readyState;
      for (const tower of readyState.towers) reinforced = upgradeTower(reinforced, tower.id);
      return reinforced;
    },
  });
  assert.equal(intermission.status, "intermission");
  assert.equal(intermission.wave, getLevelWaves(1).length);
  assert.ok(intermission.time > 0);
});

test("Level 10 victory does not offer another transition", () => {
  const initial = createGameState("practice");
  const finalWave = {
    ...initial,
    status: "playing",
    level: 10,
    wave: getLevelWaves(10).length,
  };

  const won = tickGame(finalWave, 0.01);
  assert.equal(won.status, "won");
  assert.equal(advanceLevel(won), won);
});

test("descendants and tumor shedding retain their parent branch", () => {
  const initial = createGameState("practice");
  const dividingState = {
    ...initial,
    status: "playing",
    level: 3,
    enemies: [
      {
        id: 1,
        type: "dividing",
        routeId: "lower-capillary",
        health: 0,
        pathDistance: 90,
        markedUntil: 0,
      },
    ],
    nextEnemyId: 2,
  };
  const divided = tickGame(dividingState, 0.01);
  assert.deepEqual(
    divided.enemies.map((enemy) => enemy.routeId),
    ["lower-capillary", "lower-capillary"],
  );

  const ruptured = tickGame(
    {
      ...initial,
      status: "playing",
      level: 3,
      enemies: [
        {
          id: 4,
          type: "tumor_mass",
          routeId: "lower-capillary",
          health: 0,
          pathDistance: 90,
          markedUntil: 0,
        },
      ],
      nextEnemyId: 5,
    },
    0.01,
  );
  assert.ok(ruptured.enemies.length > 2);
  assert.ok(ruptured.enemies.every((enemy) => enemy.routeId === "lower-capillary"));

  const sheddingState = {
    ...initial,
    status: "playing",
    level: 3,
    enemies: [
      {
        id: 8,
        type: "tumor_mass",
        routeId: "upper-capillary",
        health: ENEMIES.tumor_mass.health,
        pathDistance: 105,
        markedUntil: 0,
        nextShedDistance: 105,
      },
    ],
    nextEnemyId: 9,
  };
  const shed = tickGame(sheddingState, 0.01);
  assert.equal(shed.enemies.find((enemy) => enemy.id === 9)?.routeId, "upper-capillary");
});

test("shared route segments sample exactly the same canonical geometry", () => {
  const upperDistance = routeDistanceToPoint(3, "upper-capillary", { x: 520, y: 300 });
  const lowerDistance = routeDistanceToPoint(3, "lower-capillary", { x: 520, y: 300 });

  assert.deepEqual(getPathPosition(upperDistance, 3, "upper-capillary"), { x: 520, y: 300 });
  assert.deepEqual(getPathPosition(lowerDistance, 3, "lower-capillary"), { x: 520, y: 300 });
});

test("frontmost targeting uses least remaining route distance before stable enemy IDs", () => {
  const initial = createGameState("practice");
  const bypassLength = getPathLength(7, "fast_bypass");
  const armoredLength = getPathLength(7, "armored_vascular");
  const state = {
    ...initial,
    status: "playing",
    level: 7,
    towers: [
      { id: 1, type: "doctor", position: { x: 880, y: 330 }, tier: 0, cooldownRemaining: 0 },
    ],
    enemies: [
      {
        id: 9,
        type: "basic",
        routeId: "fast_bypass",
        health: ENEMIES.basic.health,
        pathDistance: bypassLength - 20,
        markedUntil: 0,
      },
      {
        id: 2,
        type: "basic",
        routeId: "armored_vascular",
        health: ENEMIES.basic.health,
        pathDistance: armoredLength - 40,
        markedUntil: 0,
      },
    ],
  };

  const advanced = tickGame(state, 0.01);
  assert.ok(advanced.enemies.find((enemy) => enemy.id === 9).health < ENEMIES.basic.health);
  assert.equal(advanced.enemies.find((enemy) => enemy.id === 2).health, ENEMIES.basic.health);
});

test("frontmost targeting breaks equal remaining-distance ties with the lower stable enemy ID", () => {
  const initial = createGameState("practice");
  const remainingDistance = 20;
  const state = {
    ...initial,
    status: "playing",
    level: 7,
    towers: [
      { id: 1, type: "doctor", position: { x: 880, y: 330 }, tier: 0, cooldownRemaining: 0 },
    ],
    enemies: [
      {
        id: 9,
        type: "basic",
        routeId: "fast_bypass",
        health: ENEMIES.basic.health,
        pathDistance: getPathLength(7, "fast_bypass") - remainingDistance,
        markedUntil: 0,
      },
      {
        id: 2,
        type: "basic",
        routeId: "armored_vascular",
        health: ENEMIES.basic.health,
        pathDistance: getPathLength(7, "armored_vascular") - remainingDistance,
        markedUntil: 0,
      },
    ],
  };

  const advanced = tickGame(state, 0.01);
  assert.equal(advanced.enemies.find((enemy) => enemy.id === 9)?.health, ENEMIES.basic.health);
  assert.ok(
    (advanced.enemies.find((enemy) => enemy.id === 2)?.health ?? Infinity) < ENEMIES.basic.health,
  );
});

test("range and splash use coordinates across routes", () => {
  const initial = createGameState("practice");
  const upperDistance = routeDistanceToPoint(3, "upper-capillary", { x: 520, y: 300 });
  const lowerDistance = routeDistanceToPoint(3, "lower-capillary", { x: 520, y: 300 });
  const state = {
    ...initial,
    status: "playing",
    level: 3,
    towers: [
      { id: 1, type: "chemotherapy", position: { x: 520, y: 240 }, tier: 0, cooldownRemaining: 0 },
    ],
    enemies: [
      {
        id: 1,
        type: "basic",
        routeId: "upper-capillary",
        health: ENEMIES.basic.health,
        pathDistance: upperDistance,
        markedUntil: 0,
      },
      {
        id: 2,
        type: "basic",
        routeId: "lower-capillary",
        health: ENEMIES.basic.health,
        pathDistance: lowerDistance,
        markedUntil: 0,
      },
    ],
  };

  const advanced = tickGame(state, 0.01);
  assert.ok(advanced.enemies.every((enemy) => enemy.health < ENEMIES.basic.health));
});

test("placement clearance checks every route and each level obstacle", () => {
  const initial = { ...createGameState("practice"), level: 3 };

  assert.equal(isPathClear({ x: 320, y: 426 }, 3), false);
  assert.equal(placeTower(initial, "doctor", { x: 320, y: 426 }), initial);
  assert.equal(placeTower(initial, "doctor", { x: 660, y: 300 }), initial);
});

test("wave route cycles distribute spawns deterministically", () => {
  const state = { ...createGameState("practice"), level: 3 };
  const started = startWave(state);

  assert.deepEqual(
    started.pendingSpawns.slice(0, 6).map((spawn) => spawn.routeId),
    [
      "upper-capillary",
      "lower-capillary",
      "upper-capillary",
      "lower-capillary",
      "upper-capillary",
      "lower-capillary",
    ],
  );
});
