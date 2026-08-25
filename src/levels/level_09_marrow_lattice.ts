import type { LevelDefinition } from "./level_definition";

const SCENE_LEARNING = {
  route: {
    biologicalFact:
      "Bone marrow contains vascular sinusoids through which newly formed blood cells enter blood.",
    gameRole: "Three routes revisit two shared nodes before converging on one venous exit.",
  },
  source: {
    biologicalFact: "Bone marrow is a major tissue environment for blood-cell production.",
    gameRole: "Cancer cells enter all three marrow feeder routes from this source.",
  },
  alphaNode: {
    biologicalFact:
      "Marrow blood-forming cells develop near supporting stromal cells and vascular sinusoids.",
    gameRole: "Every route passes this node twice, rewarding durable overlapping coverage.",
  },
  betaNode: {
    biologicalFact:
      "Marrow sinusoids collect newly produced blood cells before they enter circulation.",
    gameRole: "Every route also visits this second node twice during its lattice loop.",
  },
  exit: {
    biologicalFact: "Venous vessels carry blood away from marrow vascular spaces.",
    gameRole: "Cells reaching this shared exit leave the field and increase metastasis.",
  },
  boneSpicule: {
    biologicalFact:
      "Trabecular bone forms a branching framework that supports spaces containing marrow.",
    gameRole: "This bone spicule blocks placement beside a repeated marrow node.",
  },
  ridge: {
    biologicalFact: "Trabecular ridges help form the internal framework of spongy bone.",
    gameRole: "This ridge blocks one lower placement area within the lattice.",
  },
} as const;

/**
 * Three marrow feeders pass through both named nodes twice.  The two visits to
 * a node use separate segments, so route assembly is acyclic while towers at a
 * node keep seeing the same feeder later in its journey.
 */
export const LEVEL_09_MARROW_LATTICE: LevelDefinition = {
  id: 9,
  title: "Marrow Lattice",
  briefing:
    "Three marrow feeders return to the same nodes after their long lattice loops. Place lasting " +
    "coverage at the nodes, not just where lanes happen to overlap.",
  accessibleDescription:
    "Three routes leave one tumor source, each visit the upper marrow node and lower marrow " +
    "node, loop through a separate lattice arm, then revisit both nodes before a shared blood-" +
    "vessel exit.",
  theme: "marrow-lattice",
  routeClearance: 28,
  routeLearning: SCENE_LEARNING.route,
  segments: [
    {
      id: "source-trunk",
      points: [
        { x: 36, y: 300 },
        { x: 150, y: 300 },
      ],
    },
    {
      id: "upper-feeder-to-alpha",
      points: [
        { x: 150, y: 300 },
        { x: 244, y: 108 },
        { x: 400, y: 246 },
      ],
    },
    {
      id: "middle-feeder-to-alpha",
      points: [
        { x: 150, y: 300 },
        { x: 272, y: 300 },
        { x: 400, y: 246 },
      ],
    },
    {
      id: "lower-feeder-to-alpha",
      points: [
        { x: 150, y: 300 },
        { x: 250, y: 496 },
        { x: 400, y: 246 },
      ],
    },
    {
      id: "upper-alpha-to-beta",
      points: [
        { x: 400, y: 246 },
        { x: 526, y: 142 },
        { x: 640, y: 350 },
      ],
    },
    {
      id: "middle-alpha-to-beta",
      points: [
        { x: 400, y: 246 },
        { x: 518, y: 438 },
        { x: 640, y: 350 },
      ],
    },
    {
      id: "lower-alpha-to-beta",
      points: [
        { x: 400, y: 246 },
        { x: 430, y: 496 },
        { x: 640, y: 350 },
      ],
    },
    {
      id: "upper-lattice-return",
      points: [
        { x: 640, y: 350 },
        { x: 790, y: 110 },
        { x: 860, y: 320 },
        { x: 640, y: 382 },
      ],
    },
    {
      id: "middle-lattice-return",
      points: [
        { x: 640, y: 350 },
        { x: 800, y: 500 },
        { x: 776, y: 234 },
        { x: 640, y: 382 },
      ],
    },
    {
      id: "lower-lattice-return",
      points: [
        { x: 640, y: 350 },
        { x: 718, y: 544 },
        { x: 530, y: 532 },
        { x: 640, y: 382 },
      ],
    },
    {
      id: "upper-beta-to-alpha-return",
      points: [
        { x: 640, y: 382 },
        { x: 502, y: 468 },
        { x: 400, y: 282 },
      ],
    },
    {
      id: "middle-beta-to-alpha-return",
      points: [
        { x: 640, y: 382 },
        { x: 512, y: 320 },
        { x: 400, y: 282 },
      ],
    },
    {
      id: "lower-beta-to-alpha-return",
      points: [
        { x: 640, y: 382 },
        { x: 470, y: 170 },
        { x: 400, y: 282 },
      ],
    },
    {
      id: "shared-exit-vessel",
      points: [
        { x: 400, y: 282 },
        { x: 628, y: 506 },
        { x: 928, y: 450 },
      ],
    },
  ],
  routes: [
    {
      id: "upper-feeder",
      sourceLandmarkId: "tumor-source",
      exitLandmarkId: "venous-exit",
      segmentIds: [
        "source-trunk",
        "upper-feeder-to-alpha",
        "upper-alpha-to-beta",
        "upper-lattice-return",
        "upper-beta-to-alpha-return",
        "shared-exit-vessel",
      ],
    },
    {
      id: "middle-feeder",
      sourceLandmarkId: "tumor-source",
      exitLandmarkId: "venous-exit",
      segmentIds: [
        "source-trunk",
        "middle-feeder-to-alpha",
        "middle-alpha-to-beta",
        "middle-lattice-return",
        "middle-beta-to-alpha-return",
        "shared-exit-vessel",
      ],
    },
    {
      id: "lower-feeder",
      sourceLandmarkId: "tumor-source",
      exitLandmarkId: "venous-exit",
      segmentIds: [
        "source-trunk",
        "lower-feeder-to-alpha",
        "lower-alpha-to-beta",
        "lower-lattice-return",
        "lower-beta-to-alpha-return",
        "shared-exit-vessel",
      ],
    },
  ],
  landmarks: [
    {
      id: "tumor-source",
      kind: "source",
      position: { x: 36, y: 300 },
      routeIds: ["upper-feeder", "middle-feeder", "lower-feeder"],
      segmentIds: ["source-trunk"],
      label: "Marrow tumor source",
      learning: SCENE_LEARNING.source,
    },
    {
      id: "marrow-node-alpha",
      kind: "combat_zone",
      position: { x: 400, y: 264 },
      routeIds: ["upper-feeder", "middle-feeder", "lower-feeder"],
      segmentIds: [
        "upper-feeder-to-alpha",
        "middle-feeder-to-alpha",
        "lower-feeder-to-alpha",
        "upper-beta-to-alpha-return",
        "middle-beta-to-alpha-return",
        "lower-beta-to-alpha-return",
      ],
      label: "Alpha marrow node: first and return exposure",
      learning: SCENE_LEARNING.alphaNode,
    },
    {
      id: "marrow-node-beta",
      kind: "combat_zone",
      position: { x: 640, y: 366 },
      routeIds: ["upper-feeder", "middle-feeder", "lower-feeder"],
      segmentIds: [
        "upper-alpha-to-beta",
        "middle-alpha-to-beta",
        "lower-alpha-to-beta",
        "upper-lattice-return",
        "middle-lattice-return",
        "lower-lattice-return",
      ],
      label: "Beta marrow node: first and return exposure",
      learning: SCENE_LEARNING.betaNode,
    },
    {
      id: "venous-exit",
      kind: "exit",
      position: { x: 928, y: 450 },
      routeIds: ["upper-feeder", "middle-feeder", "lower-feeder"],
      segmentIds: ["shared-exit-vessel"],
      label: "Venous exit",
      learning: SCENE_LEARNING.exit,
    },
  ],
  obstacles: [
    {
      id: "alpha-bone-spicule",
      position: { x: 474, y: 260 },
      radius: 42,
      landmarkId: "marrow-node-alpha",
      label: "Alpha node bone spicule",
      learning: SCENE_LEARNING.boneSpicule,
    },
    {
      id: "beta-bone-spicule",
      position: { x: 708, y: 350 },
      radius: 44,
      landmarkId: "marrow-node-beta",
      label: "Beta node bone spicule",
      learning: SCENE_LEARNING.boneSpicule,
    },
    {
      id: "trabecular-ridge",
      position: { x: 304, y: 452 },
      radius: 36,
      label: "Trabecular ridge",
      learning: SCENE_LEARNING.ridge,
    },
  ],
  placementProbes: [
    {
      id: "alpha-coverage-pocket",
      position: { x: 355, y: 150 },
      expectation: "legal",
      label: "Open pocket covering Alpha marrow node",
    },
    {
      id: "beta-coverage-pocket",
      position: { x: 640, y: 240 },
      expectation: "legal",
      label: "Open pocket covering Beta marrow node",
    },
    {
      id: "late-vessel-pocket",
      position: { x: 840, y: 540 },
      expectation: "legal",
      label: "Open pocket beside the shared exit vessel",
    },
    {
      id: "middle-route-probe",
      position: { x: 272, y: 300 },
      expectation: "route_blocked",
      routeId: "middle-feeder",
      label: "Middle feeder route",
    },
    {
      id: "shared-exit-probe",
      position: { x: 760, y: 481 },
      expectation: "route_blocked",
      routeId: "upper-feeder",
      label: "Shared exit vessel route",
    },
    {
      id: "alpha-spicule-probe",
      position: { x: 474, y: 260 },
      expectation: "obstacle_blocked",
      obstacleId: "alpha-bone-spicule",
      label: "Alpha bone spicule",
    },
    {
      id: "beta-spicule-probe",
      position: { x: 708, y: 350 },
      expectation: "obstacle_blocked",
      obstacleId: "beta-bone-spicule",
      label: "Beta bone spicule",
    },
  ],
  economy: {
    entryTpMinimum: 220,
    entryTpMaximum: 370,
    reinforcementTp: 65,
    carryoverTpCap: 220,
  },
  waves: [
    {
      entries: [
        {
          type: "basic",
          count: 12,
          gap: 0.42,
          routeCycle: ["upper-feeder", "middle-feeder", "lower-feeder"],
        },
      ],
    },
    {
      entries: [
        {
          type: "fast",
          count: 15,
          gap: 0.33,
          routeCycle: ["middle-feeder", "upper-feeder", "lower-feeder"],
        },
      ],
    },
    {
      entries: [
        {
          type: "tough",
          count: 8,
          gap: 0.68,
          routeCycle: ["lower-feeder", "middle-feeder", "upper-feeder"],
        },
      ],
    },
    {
      entries: [
        { type: "basic", count: 10, gap: 0.3, routeCycle: ["upper-feeder", "lower-feeder"] },
        { type: "fast", count: 10, gap: 0.4, routeCycle: ["middle-feeder"] },
      ],
    },
    {
      entries: [
        {
          type: "dividing",
          count: 9,
          gap: 0.62,
          routeCycle: ["upper-feeder", "middle-feeder", "lower-feeder"],
        },
      ],
    },
    {
      entries: [
        {
          type: "immune_evasive",
          count: 9,
          gap: 0.54,
          routeCycle: ["lower-feeder", "upper-feeder"],
        },
        { type: "tough", count: 7, gap: 0.72, routeCycle: ["middle-feeder"] },
      ],
    },
    {
      entries: [
        {
          type: "fast",
          count: 22,
          gap: 0.26,
          routeCycle: ["upper-feeder", "middle-feeder", "lower-feeder", "middle-feeder"],
        },
      ],
    },
    {
      entries: [
        {
          type: "tumor_mass",
          count: 3,
          gap: 2.2,
          routeCycle: ["upper-feeder", "lower-feeder", "middle-feeder"],
        },
      ],
    },
    {
      entries: [
        {
          type: "dividing",
          count: 12,
          gap: 0.46,
          routeCycle: ["middle-feeder", "upper-feeder", "lower-feeder"],
        },
        {
          type: "immune_evasive",
          count: 10,
          gap: 0.5,
          routeCycle: ["lower-feeder", "upper-feeder"],
        },
      ],
    },
    {
      entries: [
        {
          type: "tumor_mass",
          count: 4,
          gap: 1.85,
          routeCycle: ["upper-feeder", "middle-feeder", "lower-feeder"],
        },
        {
          type: "fast",
          count: 18,
          gap: 0.25,
          routeCycle: ["lower-feeder", "middle-feeder", "upper-feeder"],
        },
      ],
    },
  ],
};
