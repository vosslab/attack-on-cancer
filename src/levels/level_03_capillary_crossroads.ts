import type { LevelDefinition } from "./level_definition";

const SCENE_LEARNING = {
  route: {
    biologicalFact:
      "Capillary beds form branching networks that exchange materials with nearby tissue.",
    gameRole:
      "Two cell routes split, share a central crossing, split again, and reunite at the exit.",
  },
  source: {
    biologicalFact: "Cancer cells can enter small vessels after invading nearby tissue.",
    gameRole: "Both capillary routes receive cancer cells from this tumor-side inlet.",
  },
  split: {
    biologicalFact: "Capillary networks branch into many small channels within a tissue.",
    gameRole: "This split divides each wave between upper and lower treatment lanes.",
  },
  merge: {
    biologicalFact: "Small vascular channels can reconnect as blood crosses a capillary bed.",
    gameRole: "Routes converge here, concentrating cells within overlapping treatment range.",
  },
  coverage: {
    biologicalFact: "Closely spaced capillaries can occupy the same small region of a tissue.",
    gameRole: "A treatment beside this shared segment can cover cells from both branches.",
  },
  pericyte: {
    biologicalFact:
      "Pericytes wrap small blood vessels and help regulate capillary stability and permeability.",
    gameRole: "This pericyte island blocks placement and separates the second route split.",
  },
  exit: {
    biologicalFact: "Venules collect blood leaving capillary networks.",
    gameRole: "Cells reaching this venous exit leave the field and increase metastasis.",
  },
} as const;

/**
 * The two routes reuse the inlet, crossing, and outlet segments verbatim.
 * This makes the shared capillary geometry authoritative for movement, rendering,
 * clearance, and the placement lesson rather than maintaining parallel copies.
 */
export const LEVEL_03_CAPILLARY_CROSSROADS: LevelDefinition = {
  id: 3,
  title: "Capillary Crossroads",
  briefing:
    "Cells split through upper and lower capillaries before rejoining twice. Place treatments " +
    "beside the shared crossings so one position can protect both branches.",
  accessibleDescription:
    "A capillary field with one tumor inlet on the left. The path splits into upper and lower " +
    "branches, rejoins at a central crossing, splits around a pericyte island, then rejoins at " +
    "the blood exit on the right. Open tissue above the central crossing is a legal shared-" +
    "coverage position; capillaries and the pericyte island are blocked.",
  theme: "capillary-crossroads",
  routeClearance: 36,
  routeLearning: SCENE_LEARNING.route,
  segments: [
    {
      id: "inlet-trunk",
      points: [
        { x: 52, y: 300 },
        { x: 112, y: 300 },
        { x: 170, y: 300 },
      ],
    },
    {
      id: "upper-first-branch",
      points: [
        { x: 170, y: 300 },
        { x: 236, y: 206 },
        { x: 320, y: 174 },
        { x: 402, y: 234 },
        { x: 480, y: 300 },
      ],
    },
    {
      id: "lower-first-branch",
      points: [
        { x: 170, y: 300 },
        { x: 236, y: 394 },
        { x: 320, y: 426 },
        { x: 402, y: 366 },
        { x: 480, y: 300 },
      ],
    },
    {
      id: "shared-central-crossing",
      points: [
        { x: 480, y: 300 },
        { x: 520, y: 300 },
        { x: 560, y: 300 },
      ],
    },
    {
      id: "upper-second-branch",
      points: [
        { x: 560, y: 300 },
        { x: 620, y: 218 },
        { x: 688, y: 192 },
        { x: 744, y: 258 },
        { x: 760, y: 300 },
      ],
    },
    {
      id: "lower-second-branch",
      points: [
        { x: 560, y: 300 },
        { x: 620, y: 382 },
        { x: 688, y: 408 },
        { x: 744, y: 342 },
        { x: 760, y: 300 },
      ],
    },
    {
      id: "outlet-trunk",
      points: [
        { x: 760, y: 300 },
        { x: 838, y: 300 },
        { x: 908, y: 300 },
      ],
    },
  ],
  routes: [
    {
      id: "upper-capillary",
      sourceLandmarkId: "tumor-inlet",
      exitLandmarkId: "venous-exit",
      segmentIds: [
        "inlet-trunk",
        "upper-first-branch",
        "shared-central-crossing",
        "upper-second-branch",
        "outlet-trunk",
      ],
    },
    {
      id: "lower-capillary",
      sourceLandmarkId: "tumor-inlet",
      exitLandmarkId: "venous-exit",
      segmentIds: [
        "inlet-trunk",
        "lower-first-branch",
        "shared-central-crossing",
        "lower-second-branch",
        "outlet-trunk",
      ],
    },
  ],
  landmarks: [
    {
      id: "tumor-inlet",
      kind: "source",
      position: { x: 52, y: 300 },
      routeIds: ["upper-capillary", "lower-capillary"],
      segmentIds: ["inlet-trunk"],
      label: "Tumor capillary inlet",
      learning: SCENE_LEARNING.source,
    },
    {
      id: "first-branch-split",
      kind: "landmark",
      position: { x: 170, y: 300 },
      routeIds: ["upper-capillary", "lower-capillary"],
      segmentIds: ["inlet-trunk", "upper-first-branch", "lower-first-branch"],
      label: "First capillary split",
      learning: SCENE_LEARNING.split,
    },
    {
      id: "central-crossing-merge",
      kind: "merge",
      position: { x: 480, y: 300 },
      routeIds: ["upper-capillary", "lower-capillary"],
      segmentIds: ["upper-first-branch", "lower-first-branch", "shared-central-crossing"],
      label: "Central capillary crossing",
      learning: SCENE_LEARNING.merge,
    },
    {
      id: "shared-coverage-zone",
      kind: "combat_zone",
      position: { x: 520, y: 300 },
      routeIds: ["upper-capillary", "lower-capillary"],
      segmentIds: ["shared-central-crossing"],
      label: "Shared crossing coverage zone",
      learning: SCENE_LEARNING.coverage,
    },
    {
      id: "second-branch-split",
      kind: "landmark",
      position: { x: 560, y: 300 },
      routeIds: ["upper-capillary", "lower-capillary"],
      segmentIds: ["shared-central-crossing", "upper-second-branch", "lower-second-branch"],
      label: "Pericyte island split",
      learning: SCENE_LEARNING.split,
    },
    {
      id: "venous-confluence",
      kind: "merge",
      position: { x: 760, y: 300 },
      routeIds: ["upper-capillary", "lower-capillary"],
      segmentIds: ["upper-second-branch", "lower-second-branch", "outlet-trunk"],
      label: "Venous capillary confluence",
      learning: SCENE_LEARNING.merge,
    },
    {
      id: "pericyte-island",
      kind: "landmark",
      position: { x: 660, y: 300 },
      label: "Pericyte island",
      learning: SCENE_LEARNING.pericyte,
    },
    {
      id: "venous-exit",
      kind: "exit",
      position: { x: 908, y: 300 },
      routeIds: ["upper-capillary", "lower-capillary"],
      segmentIds: ["outlet-trunk"],
      label: "Venous blood exit",
      learning: SCENE_LEARNING.exit,
    },
  ],
  obstacles: [
    {
      id: "pericyte-island-obstacle",
      position: { x: 660, y: 300 },
      radius: 52,
      label: "Pericyte island",
      landmarkId: "pericyte-island",
      learning: SCENE_LEARNING.pericyte,
    },
  ],
  placementProbes: [
    {
      id: "shared-crossing-placement",
      position: { x: 520, y: 240 },
      expectation: "legal",
      label: "Open tissue beside the shared crossing",
    },
    {
      id: "upper-crossing-flank",
      position: { x: 450, y: 220 },
      expectation: "legal",
      label: "Upper flank of the shared crossing",
    },
    {
      id: "lower-crossing-flank",
      position: { x: 450, y: 380 },
      expectation: "legal",
      label: "Lower flank of the shared crossing",
    },
    {
      id: "shared-crossing-route-blocked",
      position: { x: 520, y: 300 },
      expectation: "route_blocked",
      routeId: "upper-capillary",
      label: "Shared central capillary",
    },
    {
      id: "pericyte-island-blocked",
      position: { x: 660, y: 300 },
      expectation: "obstacle_blocked",
      obstacleId: "pericyte-island-obstacle",
      label: "Pericyte island",
    },
  ],
  economy: {
    entryTpMinimum: 360,
    entryTpMaximum: 460,
    reinforcementTp: 190,
    carryoverTpCap: 230,
  },
  waves: [
    {
      entries: [
        { type: "basic", count: 12, gap: 0.54, routeCycle: ["upper-capillary", "lower-capillary"] },
      ],
    },
    {
      entries: [
        { type: "fast", count: 16, gap: 0.34, routeCycle: ["lower-capillary", "upper-capillary"] },
      ],
    },
    {
      entries: [
        { type: "tough", count: 6, gap: 0.82, routeCycle: ["upper-capillary", "lower-capillary"] },
        { type: "basic", count: 14, gap: 0.36, routeCycle: ["lower-capillary", "upper-capillary"] },
      ],
    },
    {
      entries: [
        {
          type: "dividing",
          count: 8,
          gap: 0.64,
          routeCycle: ["upper-capillary", "lower-capillary"],
        },
        { type: "fast", count: 16, gap: 0.28, routeCycle: ["lower-capillary", "upper-capillary"] },
      ],
    },
    {
      entries: [
        {
          type: "immune_evasive",
          count: 10,
          gap: 0.46,
          routeCycle: ["upper-capillary", "lower-capillary"],
        },
        { type: "tough", count: 8, gap: 0.68, routeCycle: ["lower-capillary", "upper-capillary"] },
      ],
    },
    {
      entries: [
        { type: "basic", count: 18, gap: 0.26, routeCycle: ["upper-capillary", "lower-capillary"] },
        { type: "fast", count: 18, gap: 0.24, routeCycle: ["lower-capillary", "upper-capillary"] },
        {
          type: "dividing",
          count: 10,
          gap: 0.48,
          routeCycle: ["upper-capillary", "lower-capillary"],
        },
      ],
    },
  ],
};
