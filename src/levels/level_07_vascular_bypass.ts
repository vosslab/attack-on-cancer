import type { LevelDefinition } from "./level_definition";

const SCENE_LEARNING = {
  route: {
    biologicalFact:
      "Arterioles branch into smaller vessels that feed tissue and reconnect with venous flow.",
    gameRole: "A short bypass and a long loop create different escape times for cancer cells.",
  },
  source: {
    biologicalFact: "An arteriole is a small artery that delivers blood toward capillary beds.",
    gameRole: "This tumor-fed inlet supplies both the fast bypass and the longer loop.",
  },
  split: {
    biologicalFact: "Vascular networks branch so blood can reach different tissue regions.",
    gameRole: "Cells divide here between the immediate bypass and the longer lower route.",
  },
  fastWindow: {
    biologicalFact: "Short vascular connections can move blood rapidly between nearby regions.",
    gameRole: "This early window is the best interception point on the shortest escape route.",
  },
  loop: {
    biologicalFact: "Vessels can follow long curved paths through surrounding tissue.",
    gameRole: "This loop delays durable cells but requires coverage far from the bypass.",
  },
  merge: {
    biologicalFact: "Venous channels collect blood returning from smaller vascular branches.",
    gameRole: "Both routes rejoin here before sharing the final circulation segment.",
  },
  exit: {
    biologicalFact: "Veins return blood from tissues toward the heart.",
    gameRole: "Cells reaching this exit leave the field and increase metastasis.",
  },
  endothelialNucleus: {
    biologicalFact:
      "Endothelial cells line blood vessels, and each cell contains a nucleus with its DNA.",
    gameRole: "This enlarged nucleus blocks placement beside the long vascular loop.",
  },
  matrix: {
    biologicalFact:
      "Perivascular extracellular matrix forms a protein-rich scaffold around blood vessels.",
    gameRole: "This matrix island blocks placement near the fast bypass approach.",
  },
} as const;

/**
 * The bypass reaches circulation quickly, while the lower vascular route gives
 * durable cells much more travel time.  The shared inlet and outlet segments
 * deliberately use the same point sequences in both routes.
 */
export const LEVEL_07_VASCULAR_BYPASS = {
  id: 7,
  title: "Vascular Bypass",
  briefing:
    "Fast cells take the short bypass toward circulation. Armored cells survive longer on the " +
    "vascular loop, so protect the early split and the late merge.",
  accessibleDescription:
    "One tumor source splits into a short upper bypass and a long lower vascular loop before " +
    "both routes join at a blood exit on the right. The upper bypass is the immediate escape " +
    "lower loop gives armored cells a longer approach.",
  theme: "vascular-bypass",
  routeClearance: 30,
  routeLearning: SCENE_LEARNING.route,
  segments: [
    {
      id: "arteriole_inlet",
      points: [
        { x: 52, y: 320 },
        { x: 150, y: 320 },
        { x: 260, y: 320 },
      ],
    },
    {
      id: "short_bypass",
      points: [
        { x: 260, y: 320 },
        { x: 420, y: 262 },
        { x: 570, y: 330 },
      ],
    },
    {
      id: "vascular_descent",
      points: [
        { x: 260, y: 320 },
        { x: 302, y: 440 },
        { x: 388, y: 500 },
      ],
    },
    {
      id: "vascular_loop",
      points: [
        { x: 388, y: 500 },
        { x: 530, y: 514 },
        { x: 686, y: 452 },
      ],
    },
    {
      id: "venous_return",
      points: [
        { x: 686, y: 452 },
        { x: 660, y: 386 },
        { x: 570, y: 330 },
      ],
    },
    {
      id: "circulation_exit",
      points: [
        { x: 570, y: 330 },
        { x: 740, y: 330 },
        { x: 908, y: 330 },
      ],
    },
  ],
  routes: [
    {
      id: "fast_bypass",
      sourceLandmarkId: "tumor_inlet",
      exitLandmarkId: "blood_exit",
      segmentIds: ["arteriole_inlet", "short_bypass", "circulation_exit"],
    },
    {
      id: "armored_vascular",
      sourceLandmarkId: "tumor_inlet",
      exitLandmarkId: "blood_exit",
      segmentIds: [
        "arteriole_inlet",
        "vascular_descent",
        "vascular_loop",
        "venous_return",
        "circulation_exit",
      ],
    },
  ],
  landmarks: [
    {
      id: "tumor_inlet",
      kind: "source",
      position: { x: 52, y: 320 },
      routeIds: ["fast_bypass", "armored_vascular"],
      segmentIds: ["arteriole_inlet"],
      label: "Tumor-fed arteriole",
      learning: SCENE_LEARNING.source,
    },
    {
      id: "bypass_split",
      kind: "landmark",
      position: { x: 260, y: 320 },
      routeIds: ["fast_bypass", "armored_vascular"],
      segmentIds: ["arteriole_inlet", "short_bypass", "vascular_descent"],
      label: "Bypass split",
      learning: SCENE_LEARNING.split,
    },
    {
      id: "fast_bypass_window",
      kind: "combat_zone",
      position: { x: 420, y: 262 },
      routeIds: ["fast_bypass"],
      segmentIds: ["short_bypass"],
      label: "Fast bypass window",
      learning: SCENE_LEARNING.fastWindow,
    },
    {
      id: "armored_loop",
      kind: "combat_zone",
      position: { x: 530, y: 514 },
      routeIds: ["armored_vascular"],
      segmentIds: ["vascular_loop"],
      label: "Armored vascular loop",
      learning: SCENE_LEARNING.loop,
    },
    {
      id: "venous_merge",
      kind: "merge",
      position: { x: 570, y: 330 },
      routeIds: ["fast_bypass", "armored_vascular"],
      segmentIds: ["short_bypass", "venous_return", "circulation_exit"],
      label: "Venous merge",
      learning: SCENE_LEARNING.merge,
    },
    {
      id: "blood_exit",
      kind: "exit",
      position: { x: 908, y: 330 },
      routeIds: ["fast_bypass", "armored_vascular"],
      segmentIds: ["circulation_exit"],
      label: "Blood circulation exit",
      learning: SCENE_LEARNING.exit,
    },
  ],
  obstacles: [
    {
      id: "endothelial_nucleus",
      position: { x: 438, y: 385 },
      radius: 42,
      label: "Endothelial nucleus",
      landmarkId: "armored_loop",
      learning: SCENE_LEARNING.endothelialNucleus,
    },
    {
      id: "perivascular_matrix",
      position: { x: 675, y: 205 },
      radius: 46,
      label: "Perivascular matrix",
      landmarkId: "fast_bypass_window",
      learning: SCENE_LEARNING.matrix,
    },
  ],
  placementProbes: [
    {
      id: "early_split_coverage",
      position: { x: 245, y: 220 },
      expectation: "legal",
      label: "Open tissue above the bypass split",
    },
    {
      id: "bypass_intercept",
      position: { x: 430, y: 185 },
      expectation: "legal",
      label: "Open tissue beside the fast bypass",
    },
    {
      id: "merge_coverage",
      position: { x: 590, y: 245 },
      expectation: "legal",
      label: "Open tissue above the venous merge",
    },
    {
      id: "fast_bypass_blocked",
      position: { x: 420, y: 262 },
      expectation: "route_blocked",
      routeId: "fast_bypass",
      label: "Fast bypass vessel",
    },
    {
      id: "armored_loop_blocked",
      position: { x: 530, y: 514 },
      expectation: "route_blocked",
      routeId: "armored_vascular",
      label: "Armored vascular loop",
    },
    {
      id: "endothelial_nucleus_blocked",
      position: { x: 438, y: 385 },
      expectation: "obstacle_blocked",
      obstacleId: "endothelial_nucleus",
      label: "Endothelial nucleus",
    },
    {
      id: "perivascular_matrix_blocked",
      position: { x: 675, y: 205 },
      expectation: "obstacle_blocked",
      obstacleId: "perivascular_matrix",
      label: "Perivascular matrix",
    },
  ],
  economy: {
    entryTpMinimum: 390,
    entryTpMaximum: 460,
    reinforcementTp: 225,
    carryoverTpCap: 210,
  },
  waves: [
    { entries: [{ type: "fast", count: 6, gap: 0.5, routeCycle: ["fast_bypass"] }] },
    { entries: [{ type: "tough", count: 4, gap: 0.94, routeCycle: ["armored_vascular"] }] },
    {
      entries: [
        { type: "fast", count: 8, gap: 0.4, routeCycle: ["fast_bypass"] },
        { type: "basic", count: 6, gap: 0.52, routeCycle: ["armored_vascular", "fast_bypass"] },
      ],
    },
    {
      entries: [
        { type: "tough", count: 5, gap: 0.8, routeCycle: ["armored_vascular"] },
        { type: "fast", count: 8, gap: 0.34, routeCycle: ["fast_bypass"] },
      ],
    },
    {
      entries: [
        {
          type: "immune_evasive",
          count: 6,
          gap: 0.64,
          routeCycle: ["armored_vascular", "fast_bypass", "armored_vascular"],
        },
        { type: "fast", count: 10, gap: 0.3, routeCycle: ["fast_bypass"] },
      ],
    },
    {
      entries: [
        { type: "dividing", count: 5, gap: 0.64, routeCycle: ["armored_vascular"] },
        { type: "tough", count: 4, gap: 0.8, routeCycle: ["armored_vascular", "fast_bypass"] },
        { type: "fast", count: 10, gap: 0.3, routeCycle: ["fast_bypass"] },
      ],
    },
  ],
} as const satisfies LevelDefinition;
