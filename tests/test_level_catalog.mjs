import assert from "node:assert/strict";
import test from "node:test";

import {
  CAMPAIGN_LEVELS,
  getCampaignLevel,
  getLevelRoutePoints,
  getLevelWaves,
  validateCampaignLevels,
} from "../src/levels/campaign.ts";
import { validateLevelDefinition } from "../src/levels/level_definition.ts";
import { getSceneLearningCopy } from "../src/scene_learning.ts";

function validLevel() {
  return {
    id: 3,
    title: "Validator fixture",
    briefing: "A compact topology fixture.",
    accessibleDescription: "One route crosses a compact tissue field.",
    theme: "fixture",
    routeClearance: 20,
    routeLearning: {
      biologicalFact: "Vessels form connected paths through tissue.",
      gameRole: "This route carries cells from the source to the exit.",
    },
    segments: [
      {
        id: "trunk",
        points: [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
        ],
      },
      {
        id: "exit",
        points: [
          { x: 100, y: 0 },
          { x: 200, y: 0 },
        ],
      },
    ],
    routes: [
      {
        id: "main",
        sourceLandmarkId: "source",
        exitLandmarkId: "blood_exit",
        segmentIds: ["trunk", "exit"],
      },
    ],
    landmarks: [
      {
        id: "source",
        kind: "source",
        position: { x: 0, y: 0 },
        label: "Tumor source",
        learning: {
          biologicalFact: "A tumor is a mass of abnormal cells.",
          gameRole: "Cells enter the route from this source.",
        },
      },
      {
        id: "blood_exit",
        kind: "exit",
        position: { x: 200, y: 0 },
        label: "Blood exit",
        learning: {
          biologicalFact: "Endothelial cells line blood vessels.",
          gameRole: "Cells reaching this exit leave the field.",
        },
      },
    ],
    obstacles: [
      {
        id: "scar",
        position: { x: 100, y: 100 },
        radius: 25,
        label: "Scar tissue",
        learning: {
          biologicalFact: "Fibrosis produces collagen-rich scar tissue.",
          gameRole: "This scar blocks treatment placement.",
        },
      },
    ],
    placementProbes: [
      { id: "legal", position: { x: 80, y: 60 }, expectation: "legal", label: "Open tissue" },
      {
        id: "route",
        position: { x: 50, y: 0 },
        expectation: "route_blocked",
        routeId: "main",
        label: "Route",
      },
      {
        id: "obstacle",
        position: { x: 100, y: 100 },
        expectation: "obstacle_blocked",
        obstacleId: "scar",
        label: "Scar",
      },
    ],
    economy: { entryTpMinimum: 100, entryTpMaximum: 300, reinforcementTp: 0, carryoverTpCap: 150 },
    waves: [{ entries: [{ type: "basic", count: 1, gap: 1, routeCycle: ["main"] }] }],
  };
}

function cloneLevel() {
  return structuredClone(validLevel());
}

function sampleLegacyRoute(start, curves) {
  const points = [{ ...start }];
  let segmentStart = start;
  for (const curve of curves) {
    for (let step = 1; step <= 8; step += 1) {
      const fraction = step / 8;
      const inverse = 1 - fraction;
      points.push({
        x:
          inverse ** 3 * segmentStart.x +
          3 * inverse ** 2 * fraction * curve.controlOne.x +
          3 * inverse * fraction ** 2 * curve.controlTwo.x +
          fraction ** 3 * curve.end.x,
        y:
          inverse ** 3 * segmentStart.y +
          3 * inverse ** 2 * fraction * curve.controlOne.y +
          3 * inverse * fraction ** 2 * curve.controlTwo.y +
          fraction ** 3 * curve.end.y,
      });
    }
    segmentStart = curve.end;
  }
  return points;
}

function legacyWaves(entriesByWave, routeId) {
  return entriesByWave.map((entries) => ({
    entries: entries.map((entry) => ({ ...entry, routeCycle: [routeId] })),
  }));
}

test("accepts a continuous route with declared legal and blocked placement probes", () => {
  assert.doesNotThrow(() => validateLevelDefinition(validLevel()));
});

test("rejects unknown route references from waves and landmarks", () => {
  const level = cloneLevel();
  level.landmarks[0].routeIds = ["missing"];
  assert.throws(() => validateLevelDefinition(level), /unknown route 'missing'/);

  const invalidWaveRoute = cloneLevel();
  invalidWaveRoute.waves[0].entries[0].routeCycle = ["missing"];
  assert.throws(() => validateLevelDefinition(invalidWaveRoute), /unknown route 'missing'/);
});

test("rejects discontinuous route segments and segment graph cycles", () => {
  const discontinuous = cloneLevel();
  discontinuous.segments[1].points[0] = { x: 101, y: 0 };
  assert.throws(() => validateLevelDefinition(discontinuous), /discontinuous/);

  const cyclic = cloneLevel();
  cyclic.segments.push({
    id: "return",
    points: [
      { x: 200, y: 0 },
      { x: 0, y: 0 },
    ],
  });
  cyclic.routes.push({
    id: "returning",
    sourceLandmarkId: "source",
    exitLandmarkId: "blood_exit",
    segmentIds: ["exit", "return", "trunk"],
  });
  assert.throws(() => validateLevelDefinition(cyclic), /cycle/);
});

test("rejects invalid landmark and obstacle references", () => {
  const missingSource = cloneLevel();
  missingSource.routes[0].sourceLandmarkId = "missing";
  assert.throws(() => validateLevelDefinition(missingSource), /invalid source landmark/);

  const missingObstacleLandmark = cloneLevel();
  missingObstacleLandmark.obstacles[0].landmarkId = "missing";
  assert.throws(() => validateLevelDefinition(missingObstacleLandmark), /unknown landmark/);
});

test("rejects incomplete scene-learning content", () => {
  const missingFact = cloneLevel();
  missingFact.landmarks[0].learning.biologicalFact = "";
  assert.throws(() => validateLevelDefinition(missingFact), /biological fact must not be empty/);

  const missingRole = cloneLevel();
  missingRole.obstacles[0].learning.gameRole = " ";
  assert.throws(() => validateLevelDefinition(missingRole), /game role must not be empty/);
});

test("rejects placement probes whose declared blocker does not contain the probe", () => {
  const level = cloneLevel();
  level.placementProbes[2].position = { x: 180, y: 180 };
  assert.throws(() => validateLevelDefinition(level), /not inside obstacle/);
});

test("orders and validates all ten authored campaign levels", () => {
  assert.deepEqual(
    CAMPAIGN_LEVELS.map((level) => level.id),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  );
  assert.doesNotThrow(() => validateCampaignLevels(CAMPAIGN_LEVELS));
  assert.throws(() => validateCampaignLevels(CAMPAIGN_LEVELS.slice(1)), /exactly 10 levels/);
});

test("composes authored biology and game roles for every scene object", () => {
  for (const level of CAMPAIGN_LEVELS) {
    const routeCopy = getSceneLearningCopy("route", level.routeLearning);
    assert.equal(
      routeCopy.description,
      `${level.routeLearning.biologicalFact} ${level.routeLearning.gameRole}`,
    );

    for (const landmark of level.landmarks) {
      const copy = getSceneLearningCopy(landmark.kind, landmark.learning);
      assert.equal(
        copy.description,
        `${landmark.learning.biologicalFact} ${landmark.learning.gameRole}`,
      );
    }
    for (const obstacle of level.obstacles) {
      const copy = getSceneLearningCopy("obstacle", obstacle.learning);
      assert.equal(
        copy.description,
        `${obstacle.learning.biologicalFact} ${obstacle.learning.gameRole}`,
      );
    }
  }

  const skinBend = getCampaignLevel(1).landmarks.find(
    (landmark) => landmark.id === "central_tissue_bend",
  );
  const tumorCluster = getCampaignLevel(2).obstacles.find(
    (obstacle) => obstacle.id === "central-tumor-cluster-obstacle",
  );
  assert.match(skinBend?.learning.biologicalFact ?? "", /extracellular matrix/);
  assert.match(tumorCluster?.learning.biologicalFact ?? "", /three-dimensional mass/);
});

test("preserves Skin Tissue and Cluster Corridor routes and waves", () => {
  const skinLevel = getCampaignLevel(1);
  const clusterLevel = getCampaignLevel(2);
  const skinRoute = skinLevel.routes[0];
  const clusterRoute = clusterLevel.routes[0];
  assert.ok(skinRoute);
  assert.ok(clusterRoute);

  for (const [level, route, expectedStart, expectedEnd] of [
    [skinLevel, skinRoute, { x: 52, y: 324 }, { x: 900, y: 245 }],
    [clusterLevel, clusterRoute, { x: 52, y: 318 }, { x: 900, y: 242 }],
  ]) {
    const routePoints = getLevelRoutePoints(level.id, route.id);
    assert.deepEqual(routePoints[0], expectedStart);
    assert.deepEqual(routePoints.at(-1), expectedEnd);

    const routeSegments = route.segmentIds.map((segmentId) =>
      level.segments.find((segment) => segment.id === segmentId),
    );
    for (let index = 1; index < routeSegments.length; index += 1) {
      assert.deepEqual(
        routeSegments[index - 1]?.points.at(-1),
        routeSegments[index]?.points[0],
        `${level.title} route should remain continuous at segment ${index + 1}`,
      );
    }
  }

  assert.equal(getLevelWaves(1).length, 15);
  assert.equal(getLevelWaves(2).length, 6);
  assert.equal(skinLevel.economy.reinforcementTp, 0);
  assert.equal(clusterLevel.economy.reinforcementTp, 200);
});

test("preserves Level 1 and Level 2 route, wave, and economy contracts", () => {
  const expectedLevels = [
    {
      levelId: 1,
      routeId: "skin_tissue_main",
      routePoints: sampleLegacyRoute({ x: 52, y: 324 }, [
        { controlOne: { x: 126, y: 332 }, controlTwo: { x: 178, y: 316 }, end: { x: 218, y: 252 } },
        { controlOne: { x: 258, y: 188 }, controlTwo: { x: 338, y: 177 }, end: { x: 388, y: 210 } },
        { controlOne: { x: 430, y: 238 }, controlTwo: { x: 448, y: 352 }, end: { x: 510, y: 374 } },
        { controlOne: { x: 558, y: 394 }, controlTwo: { x: 622, y: 400 }, end: { x: 658, y: 360 } },
        { controlOne: { x: 692, y: 322 }, controlTwo: { x: 700, y: 265 }, end: { x: 750, y: 242 } },
        { controlOne: { x: 792, y: 222 }, controlTwo: { x: 854, y: 250 }, end: { x: 900, y: 245 } },
      ]),
      economy: {
        entryTpMinimum: 200,
        entryTpMaximum: 500,
        reinforcementTp: 0,
        carryoverTpCap: 500,
      },
      waves: legacyWaves(
        [
          [{ type: "basic", count: 7, gap: 0.7 }],
          [{ type: "basic", count: 11, gap: 0.55 }],
          [{ type: "basic", count: 15, gap: 0.42 }],
          [
            { type: "basic", count: 10, gap: 0.45 },
            { type: "fast", count: 7, gap: 0.38 },
          ],
          [
            { type: "tough", count: 4, gap: 1 },
            { type: "basic", count: 12, gap: 0.35 },
          ],
          [
            { type: "fast", count: 16, gap: 0.28 },
            { type: "tough", count: 4, gap: 0.85 },
          ],
          [
            { type: "dividing", count: 7, gap: 0.72 },
            { type: "basic", count: 10, gap: 0.35 },
          ],
          [
            { type: "fast", count: 14, gap: 0.3 },
            { type: "dividing", count: 8, gap: 0.6 },
          ],
          [
            { type: "tough", count: 7, gap: 0.78 },
            { type: "fast", count: 12, gap: 0.28 },
          ],
          [
            { type: "immune_evasive", count: 8, gap: 0.62 },
            { type: "basic", count: 12, gap: 0.32 },
          ],
          [
            { type: "immune_evasive", count: 11, gap: 0.5 },
            { type: "dividing", count: 8, gap: 0.5 },
          ],
          [
            { type: "tough", count: 9, gap: 0.62 },
            { type: "fast", count: 18, gap: 0.24 },
          ],
          [
            { type: "immune_evasive", count: 12, gap: 0.42 },
            { type: "tough", count: 8, gap: 0.62 },
          ],
          [
            { type: "dividing", count: 13, gap: 0.43 },
            { type: "fast", count: 20, gap: 0.2 },
          ],
          [
            { type: "basic", count: 12, gap: 0.26 },
            { type: "fast", count: 14, gap: 0.24 },
            { type: "tough", count: 8, gap: 0.48 },
            { type: "dividing", count: 10, gap: 0.36 },
            { type: "immune_evasive", count: 12, gap: 0.34 },
            { type: "tumor_mass", count: 1, gap: 0.5 },
          ],
        ],
        "skin_tissue_main",
      ),
    },
    {
      levelId: 2,
      routeId: "cluster-corridor",
      routePoints: sampleLegacyRoute({ x: 52, y: 318 }, [
        { controlOne: { x: 108, y: 326 }, controlTwo: { x: 164, y: 310 }, end: { x: 190, y: 254 } },
        { controlOne: { x: 216, y: 194 }, controlTwo: { x: 218, y: 142 }, end: { x: 278, y: 116 } },
        { controlOne: { x: 326, y: 94 }, controlTwo: { x: 374, y: 100 }, end: { x: 416, y: 142 } },
        { controlOne: { x: 458, y: 184 }, controlTwo: { x: 478, y: 220 }, end: { x: 456, y: 278 } },
        { controlOne: { x: 438, y: 326 }, controlTwo: { x: 392, y: 358 }, end: { x: 418, y: 408 } },
        { controlOne: { x: 442, y: 454 }, controlTwo: { x: 490, y: 482 }, end: { x: 548, y: 474 } },
        { controlOne: { x: 604, y: 468 }, controlTwo: { x: 654, y: 450 }, end: { x: 686, y: 402 } },
        { controlOne: { x: 720, y: 352 }, controlTwo: { x: 742, y: 320 }, end: { x: 724, y: 278 } },
        { controlOne: { x: 708, y: 238 }, controlTwo: { x: 664, y: 210 }, end: { x: 674, y: 174 } },
        { controlOne: { x: 688, y: 126 }, controlTwo: { x: 766, y: 108 }, end: { x: 812, y: 132 } },
        { controlOne: { x: 856, y: 154 }, controlTwo: { x: 864, y: 220 }, end: { x: 900, y: 242 } },
      ]),
      economy: {
        entryTpMinimum: 200,
        entryTpMaximum: 900,
        reinforcementTp: 200,
        carryoverTpCap: 700,
      },
      waves: legacyWaves(
        [
          [{ type: "basic", count: 5, gap: 0.7 }],
          [
            { type: "tough", count: 16, gap: 0.38 },
            { type: "dividing", count: 20, gap: 0.25 },
          ],
          [
            { type: "immune_evasive", count: 22, gap: 0.24 },
            { type: "fast", count: 28, gap: 0.15 },
            { type: "basic", count: 18, gap: 0.18 },
          ],
          [
            { type: "dividing", count: 28, gap: 0.21 },
            { type: "tough", count: 18, gap: 0.31 },
            { type: "immune_evasive", count: 16, gap: 0.25 },
          ],
          [
            { type: "basic", count: 35, gap: 0.14 },
            { type: "fast", count: 35, gap: 0.13 },
            { type: "tough", count: 20, gap: 0.29 },
            { type: "dividing", count: 18, gap: 0.22 },
          ],
          [
            { type: "basic", count: 40, gap: 0.12 },
            { type: "fast", count: 40, gap: 0.12 },
            { type: "dividing", count: 30, gap: 0.17 },
            { type: "immune_evasive", count: 30, gap: 0.19 },
            { type: "tough", count: 24, gap: 0.26 },
            { type: "tumor_mass", count: 1, gap: 0.5 },
          ],
        ],
        "cluster-corridor",
      ),
    },
  ];

  for (const expected of expectedLevels) {
    const level = getCampaignLevel(expected.levelId);
    assert.deepEqual(
      {
        routePoints: getLevelRoutePoints(expected.levelId, expected.routeId),
        waves: getLevelWaves(expected.levelId),
        economy: level.economy,
      },
      {
        routePoints: expected.routePoints,
        waves: expected.waves,
        economy: expected.economy,
      },
      `Level ${expected.levelId} must retain its original gameplay contract`,
    );
  }
});

test("keeps Ductal Delta's two distinct early sources", () => {
  const level = getCampaignLevel(6);
  const sourceIds = new Set(level.routes.map((route) => route.sourceLandmarkId));
  assert.equal(sourceIds.size, 2);
  assert.deepEqual([...sourceIds].sort(), ["lower_duct_source", "upper_duct_source"]);
});

test("keeps Capillary Crossroads' central crossing as shared route identity", () => {
  const level = getCampaignLevel(3);
  const sharedSegmentId = "shared-central-crossing";
  assert.ok(level.segments.some((segment) => segment.id === sharedSegmentId));
  for (const routeId of ["upper-capillary", "lower-capillary"]) {
    assert.ok(
      level.routes.find((route) => route.id === routeId)?.segmentIds.includes(sharedSegmentId),
    );
  }
});

test("keeps Fibrotic Sieve's constrained legal pockets and blocked probes", () => {
  const level = getCampaignLevel(8);
  const probes = new Map(level.placementProbes.map((probe) => [probe.id, probe]));
  for (const pocketId of [
    "northwest_suture_pocket",
    "upper_sieve_window",
    "lower_sieve_window",
    "distal_escape_niche",
  ]) {
    assert.equal(probes.get(pocketId)?.expectation, "legal");
  }
  assert.equal(probes.get("upper_outer_route_probe")?.expectation, "route_blocked");
  assert.equal(probes.get("central_scar_probe")?.expectation, "obstacle_blocked");
});

test("keeps Marrow Lattice's repeated combat zones on every route", () => {
  const level = getCampaignLevel(9);
  const combatZones = level.landmarks.filter((landmark) => landmark.kind === "combat_zone");
  assert.equal(combatZones.length, 2);
  for (const route of level.routes) {
    for (const zone of combatZones) {
      const visits = route.segmentIds.filter((segmentId) => zone.segmentIds?.includes(segmentId));
      assert.ok(visits.length >= 2, `${route.id} should revisit ${zone.id}`);
    }
  }
});

test("keeps Metastatic Confluence's independent arrivals and staged merges", () => {
  const level = getCampaignLevel(10);
  const firstSegments = level.routes.map((route) => route.segmentIds[0]);
  assert.equal(new Set(firstSegments).size, 4);
  assert.equal(new Set(level.routes.map((route) => route.sourceLandmarkId)).size, 4);

  const routeSegments = new Map(level.routes.map((route) => [route.id, route.segmentIds]));
  assert.ok(routeSegments.get("north-arrival")?.includes("anterior-merged-channel"));
  assert.ok(routeSegments.get("west-arrival")?.includes("anterior-merged-channel"));
  assert.ok(routeSegments.get("east-arrival")?.includes("posterior-merged-channel"));
  assert.ok(routeSegments.get("south-arrival")?.includes("posterior-merged-channel"));
  for (const route of level.routes) {
    assert.ok(route.segmentIds.includes("confluence-to-blood-exit"));
  }
});
