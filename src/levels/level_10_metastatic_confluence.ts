import type { LevelDefinition } from "./level_definition";

const SCENE_LEARNING = {
  route: {
    biologicalFact:
      "Metastatic cancer cells can reach distant tissues through blood or lymphatic circulation.",
    gameRole: "Four arrival routes merge in two stages before sharing one circulation exit.",
  },
  source: {
    biologicalFact:
      "A metastatic tumor forms when cancer cells spread from an original tumor to another site.",
    gameRole: "This metastatic source feeds one independent arrival route into the field.",
  },
  firstMerge: {
    biologicalFact:
      "Vascular and tissue channels form connected networks that can combine local flows.",
    gameRole: "Two arrival routes first converge here and continue as one shared channel.",
  },
  centralMerge: {
    biologicalFact:
      "Multiple local channels can converge before joining a larger circulation pathway.",
    gameRole: "Both paired channels meet here, concentrating all four routes before the exit.",
  },
  exit: {
    biologicalFact: "Circulating blood connects local vascular beds throughout the body.",
    gameRole: "Cells reaching this final exit leave the field and increase metastasis.",
  },
  fibrosis: {
    biologicalFact:
      "Fibrosis creates collagen-rich extracellular matrix that can distort tissue structure.",
    gameRole: "This fibrotic island blocks treatment placement beside an arrival channel.",
  },
  lymphoid: {
    biologicalFact: "Lymphoid nodules are organized collections of immune cells within a tissue.",
    gameRole: "This nodule blocks central placement beside the final convergence zone.",
  },
} as const;

/**
 * The final campaign map keeps all four arrival lanes separate until paired
 * first-stage merges. The two paired channels then meet at the central
 * confluence before sharing the single blood exit.
 */
export const LEVEL_10_METASTATIC_CONFLUENCE: LevelDefinition = {
  id: 10,
  title: "Metastatic Confluence",
  briefing:
    "Four metastatic sources arrive on separate tissue lanes. Protect the early origins, then " +
    "hold the two staged convergence zones before their combined pressure reaches circulation.",
  accessibleDescription:
    "Four distinct tumor sources at the north, west, east, and south feed independent routes. " +
    "North and west join at the anterior merge, east and south join at the posterior merge, and " +
    "both channels meet at the central metastatic confluence before one blood-vessel exit.",
  theme: "metastatic-confluence",
  routeClearance: 30,
  routeLearning: SCENE_LEARNING.route,
  segments: [
    {
      id: "north-source-to-anterior-merge",
      points: [
        { x: 92, y: 72 },
        { x: 150, y: 96 },
        { x: 218, y: 142 },
        { x: 310, y: 172 },
      ],
    },
    {
      id: "west-source-to-anterior-merge",
      points: [
        { x: 66, y: 250 },
        { x: 126, y: 238 },
        { x: 216, y: 200 },
        { x: 310, y: 172 },
      ],
    },
    {
      id: "east-source-to-posterior-merge",
      points: [
        { x: 892, y: 168 },
        { x: 820, y: 176 },
        { x: 736, y: 208 },
        { x: 650, y: 230 },
      ],
    },
    {
      id: "south-source-to-posterior-merge",
      points: [
        { x: 806, y: 528 },
        { x: 772, y: 456 },
        { x: 704, y: 316 },
        { x: 650, y: 230 },
      ],
    },
    {
      id: "anterior-merged-channel",
      points: [
        { x: 310, y: 172 },
        { x: 350, y: 194 },
        { x: 394, y: 234 },
        { x: 440, y: 250 },
      ],
    },
    {
      id: "posterior-merged-channel",
      points: [
        { x: 650, y: 230 },
        { x: 588, y: 236 },
        { x: 514, y: 250 },
        { x: 440, y: 250 },
      ],
    },
    {
      id: "confluence-to-blood-exit",
      points: [
        { x: 440, y: 250 },
        { x: 566, y: 274 },
        { x: 714, y: 264 },
        { x: 826, y: 286 },
        { x: 906, y: 308 },
      ],
    },
  ],
  routes: [
    {
      id: "north-arrival",
      sourceLandmarkId: "north-metastasis",
      exitLandmarkId: "circulation-exit",
      segmentIds: [
        "north-source-to-anterior-merge",
        "anterior-merged-channel",
        "confluence-to-blood-exit",
      ],
    },
    {
      id: "west-arrival",
      sourceLandmarkId: "west-metastasis",
      exitLandmarkId: "circulation-exit",
      segmentIds: [
        "west-source-to-anterior-merge",
        "anterior-merged-channel",
        "confluence-to-blood-exit",
      ],
    },
    {
      id: "east-arrival",
      sourceLandmarkId: "east-metastasis",
      exitLandmarkId: "circulation-exit",
      segmentIds: [
        "east-source-to-posterior-merge",
        "posterior-merged-channel",
        "confluence-to-blood-exit",
      ],
    },
    {
      id: "south-arrival",
      sourceLandmarkId: "south-metastasis",
      exitLandmarkId: "circulation-exit",
      segmentIds: [
        "south-source-to-posterior-merge",
        "posterior-merged-channel",
        "confluence-to-blood-exit",
      ],
    },
  ],
  landmarks: [
    {
      id: "north-metastasis",
      kind: "source",
      position: { x: 92, y: 72 },
      routeIds: ["north-arrival"],
      segmentIds: ["north-source-to-anterior-merge"],
      label: "North metastatic source",
      learning: SCENE_LEARNING.source,
    },
    {
      id: "west-metastasis",
      kind: "source",
      position: { x: 66, y: 250 },
      routeIds: ["west-arrival"],
      segmentIds: ["west-source-to-anterior-merge"],
      label: "West metastatic source",
      learning: SCENE_LEARNING.source,
    },
    {
      id: "east-metastasis",
      kind: "source",
      position: { x: 892, y: 168 },
      routeIds: ["east-arrival"],
      segmentIds: ["east-source-to-posterior-merge"],
      label: "East metastatic source",
      learning: SCENE_LEARNING.source,
    },
    {
      id: "south-metastasis",
      kind: "source",
      position: { x: 806, y: 528 },
      routeIds: ["south-arrival"],
      segmentIds: ["south-source-to-posterior-merge"],
      label: "South metastatic source",
      learning: SCENE_LEARNING.source,
    },
    {
      id: "anterior-first-merge",
      kind: "merge",
      position: { x: 310, y: 172 },
      routeIds: ["north-arrival", "west-arrival"],
      segmentIds: [
        "north-source-to-anterior-merge",
        "west-source-to-anterior-merge",
        "anterior-merged-channel",
      ],
      label: "Anterior first-stage merge",
      learning: SCENE_LEARNING.firstMerge,
    },
    {
      id: "posterior-first-merge",
      kind: "merge",
      position: { x: 650, y: 230 },
      routeIds: ["east-arrival", "south-arrival"],
      segmentIds: [
        "east-source-to-posterior-merge",
        "south-source-to-posterior-merge",
        "posterior-merged-channel",
      ],
      label: "Posterior first-stage merge",
      learning: SCENE_LEARNING.firstMerge,
    },
    {
      id: "central-second-merge",
      kind: "merge",
      position: { x: 440, y: 250 },
      routeIds: ["north-arrival", "west-arrival", "east-arrival", "south-arrival"],
      segmentIds: [
        "anterior-merged-channel",
        "posterior-merged-channel",
        "confluence-to-blood-exit",
      ],
      label: "Central second-stage metastatic confluence",
      learning: SCENE_LEARNING.centralMerge,
    },
    {
      id: "circulation-exit",
      kind: "exit",
      position: { x: 906, y: 308 },
      routeIds: ["north-arrival", "west-arrival", "east-arrival", "south-arrival"],
      segmentIds: ["confluence-to-blood-exit"],
      label: "Circulation exit",
      learning: SCENE_LEARNING.exit,
    },
  ],
  obstacles: [
    {
      id: "anterior-fibrotic-island",
      position: { x: 226, y: 334 },
      radius: 52,
      label: "Anterior fibrotic island",
      learning: SCENE_LEARNING.fibrosis,
    },
    {
      id: "posterior-fibrotic-island",
      position: { x: 744, y: 408 },
      radius: 58,
      label: "Posterior fibrotic island",
      learning: SCENE_LEARNING.fibrosis,
    },
    {
      id: "confluence-lymphoid-nodule",
      position: { x: 492, y: 442 },
      radius: 46,
      landmarkId: "central-second-merge",
      label: "Confluence lymphoid nodule",
      learning: SCENE_LEARNING.lymphoid,
    },
  ],
  placementProbes: [
    {
      id: "north-early-watch",
      position: { x: 156, y: 162 },
      expectation: "legal",
      label: "North early-interception tissue",
    },
    {
      id: "west-early-watch",
      position: { x: 152, y: 314 },
      expectation: "legal",
      label: "West early-interception tissue",
    },
    {
      id: "east-early-watch",
      position: { x: 760, y: 130 },
      expectation: "legal",
      label: "East early-interception tissue",
    },
    {
      id: "anterior-channel-watch",
      position: { x: 360, y: 330 },
      expectation: "legal",
      label: "Anterior channel coverage tissue",
    },
    {
      id: "confluence-coverage-pocket",
      position: { x: 452, y: 344 },
      expectation: "legal",
      label: "Central convergence coverage pocket",
    },
    {
      id: "late-circulation-watch",
      position: { x: 686, y: 356 },
      expectation: "legal",
      label: "Late circulation coverage tissue",
    },
    {
      id: "north-route-probe",
      position: { x: 150, y: 96 },
      expectation: "route_blocked",
      routeId: "north-arrival",
      label: "North route",
    },
    {
      id: "posterior-route-probe",
      position: { x: 704, y: 316 },
      expectation: "route_blocked",
      routeId: "south-arrival",
      label: "Posterior route",
    },
    {
      id: "confluence-route-probe",
      position: { x: 566, y: 274 },
      expectation: "route_blocked",
      routeId: "east-arrival",
      label: "Shared confluence route",
    },
    {
      id: "anterior-scar-probe",
      position: { x: 226, y: 334 },
      expectation: "obstacle_blocked",
      obstacleId: "anterior-fibrotic-island",
      label: "Anterior fibrotic island",
    },
    {
      id: "posterior-scar-probe",
      position: { x: 744, y: 408 },
      expectation: "obstacle_blocked",
      obstacleId: "posterior-fibrotic-island",
      label: "Posterior fibrotic island",
    },
  ],
  economy: {
    entryTpMinimum: 1450,
    entryTpMaximum: 1550,
    reinforcementTp: 1280,
    carryoverTpCap: 220,
  },
  waves: [
    {
      entries: [
        {
          type: "basic",
          count: 10,
          gap: 0.46,
          routeCycle: ["north-arrival", "west-arrival", "east-arrival", "south-arrival"],
        },
      ],
    },
    {
      entries: [
        {
          type: "fast",
          count: 12,
          gap: 0.34,
          routeCycle: ["east-arrival", "south-arrival", "north-arrival", "west-arrival"],
        },
        {
          type: "tough",
          count: 4,
          gap: 0.76,
          routeCycle: ["north-arrival", "west-arrival"],
        },
      ],
    },
    {
      entries: [
        {
          type: "immune_evasive",
          count: 8,
          gap: 0.42,
          routeCycle: ["west-arrival", "south-arrival", "east-arrival", "north-arrival"],
        },
        {
          type: "dividing",
          count: 6,
          gap: 0.6,
          routeCycle: ["north-arrival", "east-arrival", "west-arrival", "south-arrival"],
        },
      ],
    },
    {
      entries: [
        {
          type: "fast",
          count: 14,
          gap: 0.3,
          routeCycle: ["north-arrival", "south-arrival", "west-arrival", "east-arrival"],
        },
        {
          type: "tough",
          count: 6,
          gap: 0.62,
          routeCycle: ["west-arrival", "east-arrival"],
        },
      ],
    },
    {
      entries: [
        {
          type: "tumor_mass",
          count: 1,
          gap: 5,
          routeCycle: ["north-arrival", "south-arrival"],
        },
        {
          type: "basic",
          count: 16,
          gap: 0.27,
          routeCycle: ["west-arrival", "east-arrival", "north-arrival", "south-arrival"],
        },
      ],
    },
    {
      entries: [
        {
          type: "immune_evasive",
          count: 12,
          gap: 0.34,
          routeCycle: ["east-arrival", "north-arrival", "south-arrival", "west-arrival"],
        },
        {
          type: "dividing",
          count: 10,
          gap: 0.42,
          routeCycle: ["south-arrival", "west-arrival", "north-arrival", "east-arrival"],
        },
      ],
    },
    {
      entries: [
        {
          type: "tumor_mass",
          count: 2,
          gap: 4,
          routeCycle: ["north-arrival", "east-arrival", "west-arrival", "south-arrival"],
        },
        {
          type: "fast",
          count: 18,
          gap: 0.25,
          routeCycle: ["south-arrival", "west-arrival", "east-arrival", "north-arrival"],
        },
      ],
    },
  ],
};
