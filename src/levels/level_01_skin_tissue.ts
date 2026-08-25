import type { LevelDefinition, RouteSegmentDefinition } from "./level_definition";

const SKIN_TISSUE_SEGMENTS = [
  {
    id: "skin_tissue_entry_curve",
    points: [
      { x: 52, y: 324 },
      { x: 78.73828125, y: 325.828125 },
      { x: 103.53125, y: 325.125 },
      { x: 126.49609375, y: 321.609375 },
      { x: 147.75, y: 315 },
      { x: 167.41015625, y: 305.015625 },
      { x: 185.59375, y: 291.375 },
      { x: 202.41796875, y: 273.796875 },
      { x: 218, y: 252 },
    ],
  },
  {
    id: "skin_tissue_upper_arc",
    points: [
      { x: 218, y: 252 },
      { x: 234.73828125, y: 230.466796875 },
      { x: 254.40625, y: 213.796875 },
      { x: 276.18359375, y: 201.884765625 },
      { x: 299.25, y: 194.625 },
      { x: 322.78515625, y: 191.912109375 },
      { x: 345.96875, y: 193.640625 },
      { x: 367.98046875, y: 199.705078125 },
      { x: 388, y: 210 },
    ],
  },
  {
    id: "skin_tissue_central_bend",
    points: [
      { x: 388, y: 210 },
      { x: 402.7578125, y: 224.18359375 },
      { x: 416.0625, y: 244.34375 },
      { x: 428.7109375, y: 268.39453125 },
      { x: 441.5, y: 294.25 },
      { x: 455.2265625, y: 319.82421875 },
      { x: 470.6875, y: 343.03125 },
      { x: 488.6796875, y: 361.78515625 },
      { x: 510, y: 374 },
    ],
  },
  {
    id: "skin_tissue_lower_arc",
    points: [
      { x: 510, y: 374 },
      { x: 528.6640625, y: 380.78125 },
      { x: 548.3125, y: 385.875 },
      { x: 568.4296875, y: 388.90625 },
      { x: 588.5, y: 389.5 },
      { x: 608.0078125, y: 387.28125 },
      { x: 626.4375, y: 381.875 },
      { x: 643.2734375, y: 372.90625 },
      { x: 658, y: 360 },
    ],
  },
  {
    id: "skin_tissue_exit_rise",
    points: [
      { x: 658, y: 360 },
      { x: 669.6640625, y: 344.962890625 },
      { x: 679.6875, y: 328.765625 },
      { x: 688.8671875, y: 312.029296875 },
      { x: 698, y: 295.375 },
      { x: 707.8828125, y: 279.423828125 },
      { x: 719.3125, y: 264.796875 },
      { x: 733.0859375, y: 252.115234375 },
      { x: 750, y: 242 },
    ],
  },
  {
    id: "skin_tissue_vessel_approach",
    points: [
      { x: 750, y: 242 },
      { x: 766.6171875, y: 236.591796875 },
      { x: 784.6875, y: 234.734375 },
      { x: 803.7890625, y: 235.478515625 },
      { x: 823.5, y: 237.875 },
      { x: 843.3984375, y: 240.974609375 },
      { x: 863.0625, y: 243.828125 },
      { x: 882.0703125, y: 245.486328125 },
      { x: 900, y: 245 },
    ],
  },
] as const satisfies readonly RouteSegmentDefinition[];

const SCENE_LEARNING = {
  route: {
    biologicalFact:
      "Skin contains blood-vessel networks that supply its cells and connect to circulation.",
    gameRole:
      "Every cancer cell follows this single curved route, so treatments can cover it at bends.",
  },
  source: {
    biologicalFact: "A tumor is a mass of abnormal cells growing within a tissue.",
    gameRole: "Traveling cancer cells enter this field from the primary tumor.",
  },
  tissueBend: {
    biologicalFact:
      "Skin cells are supported by extracellular matrix and connective tissue beneath them.",
    gameRole:
      "This bend brings route sections near one another, creating overlapping treatment range.",
  },
  exit: {
    biologicalFact: "Endothelial cells form the inner lining of blood vessels.",
    gameRole: "Cells reaching this vessel leave the field and add to the metastasis count.",
  },
} as const;

export const LEVEL_01_SKIN_TISSUE = {
  id: 1,
  title: "Skin Tissue",
  briefing:
    "Place treatments in the open tissue beside the route. Overlapping coverage at the central " +
    "bend gives cells more than one chance to be contained.",
  accessibleDescription:
    "A single curved route runs from a primary tumor at the left edge through open skin tissue, " +
    "bends down through the center, then rises to a blood vessel exit on the right.",
  theme: "skin_tissue",
  routeClearance: 34,
  routeLearning: SCENE_LEARNING.route,
  segments: SKIN_TISSUE_SEGMENTS,
  routes: [
    {
      id: "skin_tissue_main",
      sourceLandmarkId: "primary_tumor",
      exitLandmarkId: "blood_vessel_exit",
      segmentIds: SKIN_TISSUE_SEGMENTS.map((segment) => segment.id),
    },
  ],
  landmarks: [
    {
      id: "primary_tumor",
      kind: "source",
      position: { x: 52, y: 324 },
      routeIds: ["skin_tissue_main"],
      segmentIds: ["skin_tissue_entry_curve"],
      label: "Primary tumor",
      learning: SCENE_LEARNING.source,
    },
    {
      id: "central_tissue_bend",
      kind: "landmark",
      position: { x: 510, y: 374 },
      routeIds: ["skin_tissue_main"],
      segmentIds: ["skin_tissue_central_bend", "skin_tissue_lower_arc"],
      label: "Central tissue bend",
      learning: SCENE_LEARNING.tissueBend,
    },
    {
      id: "blood_vessel_exit",
      kind: "exit",
      position: { x: 900, y: 245 },
      routeIds: ["skin_tissue_main"],
      segmentIds: ["skin_tissue_vessel_approach"],
      label: "Blood vessel exit",
      learning: SCENE_LEARNING.exit,
    },
  ],
  obstacles: [],
  placementProbes: [
    {
      id: "open_upper_tissue",
      position: { x: 330, y: 100 },
      expectation: "legal",
      label: "Open upper tissue coverage",
    },
    {
      id: "open_central_tissue",
      position: { x: 500, y: 255 },
      expectation: "legal",
      label: "Open central tissue coverage",
    },
    {
      id: "open_lower_tissue",
      position: { x: 590, y: 490 },
      expectation: "legal",
      label: "Open lower tissue coverage",
    },
    {
      id: "central_route_block",
      position: { x: 510, y: 374 },
      expectation: "route_blocked",
      routeId: "skin_tissue_main",
      label: "Central route bed",
    },
  ],
  economy: {
    entryTpMinimum: 200,
    entryTpMaximum: 500,
    reinforcementTp: 0,
    carryoverTpCap: 500,
  },
  waves: [
    { entries: [{ type: "basic", count: 7, gap: 0.7, routeCycle: ["skin_tissue_main"] }] },
    { entries: [{ type: "basic", count: 11, gap: 0.55, routeCycle: ["skin_tissue_main"] }] },
    { entries: [{ type: "basic", count: 15, gap: 0.42, routeCycle: ["skin_tissue_main"] }] },
    {
      entries: [
        { type: "basic", count: 10, gap: 0.45, routeCycle: ["skin_tissue_main"] },
        { type: "fast", count: 7, gap: 0.38, routeCycle: ["skin_tissue_main"] },
      ],
    },
    {
      entries: [
        { type: "tough", count: 4, gap: 1, routeCycle: ["skin_tissue_main"] },
        { type: "basic", count: 12, gap: 0.35, routeCycle: ["skin_tissue_main"] },
      ],
    },
    {
      entries: [
        { type: "fast", count: 16, gap: 0.28, routeCycle: ["skin_tissue_main"] },
        { type: "tough", count: 4, gap: 0.85, routeCycle: ["skin_tissue_main"] },
      ],
    },
    {
      entries: [
        { type: "dividing", count: 7, gap: 0.72, routeCycle: ["skin_tissue_main"] },
        { type: "basic", count: 10, gap: 0.35, routeCycle: ["skin_tissue_main"] },
      ],
    },
    {
      entries: [
        { type: "fast", count: 14, gap: 0.3, routeCycle: ["skin_tissue_main"] },
        { type: "dividing", count: 8, gap: 0.6, routeCycle: ["skin_tissue_main"] },
      ],
    },
    {
      entries: [
        { type: "tough", count: 7, gap: 0.78, routeCycle: ["skin_tissue_main"] },
        { type: "fast", count: 12, gap: 0.28, routeCycle: ["skin_tissue_main"] },
      ],
    },
    {
      entries: [
        { type: "immune_evasive", count: 8, gap: 0.62, routeCycle: ["skin_tissue_main"] },
        { type: "basic", count: 12, gap: 0.32, routeCycle: ["skin_tissue_main"] },
      ],
    },
    {
      entries: [
        { type: "immune_evasive", count: 11, gap: 0.5, routeCycle: ["skin_tissue_main"] },
        { type: "dividing", count: 8, gap: 0.5, routeCycle: ["skin_tissue_main"] },
      ],
    },
    {
      entries: [
        { type: "tough", count: 9, gap: 0.62, routeCycle: ["skin_tissue_main"] },
        { type: "fast", count: 18, gap: 0.24, routeCycle: ["skin_tissue_main"] },
      ],
    },
    {
      entries: [
        { type: "immune_evasive", count: 12, gap: 0.42, routeCycle: ["skin_tissue_main"] },
        { type: "tough", count: 8, gap: 0.62, routeCycle: ["skin_tissue_main"] },
      ],
    },
    {
      entries: [
        { type: "dividing", count: 13, gap: 0.43, routeCycle: ["skin_tissue_main"] },
        { type: "fast", count: 20, gap: 0.2, routeCycle: ["skin_tissue_main"] },
      ],
    },
    {
      entries: [
        { type: "basic", count: 12, gap: 0.26, routeCycle: ["skin_tissue_main"] },
        { type: "fast", count: 14, gap: 0.24, routeCycle: ["skin_tissue_main"] },
        { type: "tough", count: 8, gap: 0.48, routeCycle: ["skin_tissue_main"] },
        { type: "dividing", count: 10, gap: 0.36, routeCycle: ["skin_tissue_main"] },
        { type: "immune_evasive", count: 12, gap: 0.34, routeCycle: ["skin_tissue_main"] },
        { type: "tumor_mass", count: 1, gap: 0.5, routeCycle: ["skin_tissue_main"] },
      ],
    },
  ],
} as const satisfies LevelDefinition;
