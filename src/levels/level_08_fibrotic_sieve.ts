import type { LevelDefinition } from "./level_definition";

const SCENE_LEARNING = {
  route: {
    biologicalFact:
      "Fibrosis deposits dense extracellular matrix that can reshape spaces within a tissue.",
    gameRole: "Four narrow routes weave around scar tissue before sharing one outlet.",
  },
  source: {
    biologicalFact: "A tumor is a mass of abnormal cells growing within a tissue.",
    gameRole: "Cancer cells enter all four channels from this single tumor source.",
  },
  split: {
    biologicalFact: "Dense fibrotic tissue can divide open tissue into smaller channels.",
    gameRole: "This split distributes each wave across four constrained routes.",
  },
  center: {
    biologicalFact:
      "Collagen-rich scar tissue is denser and less flexible than the tissue it replaces.",
    gameRole: "The central scar closes broad firing positions between the inner lanes.",
  },
  merge: {
    biologicalFact: "Separate tissue channels can converge beyond a fibrotic region.",
    gameRole: "All four routes reunite here before the final shared segment.",
  },
  exit: {
    biologicalFact: "Blood vessels connect local tissue spaces to wider circulation.",
    gameRole: "Cells reaching this exit leave the field and increase metastasis.",
  },
  scar: {
    biologicalFact:
      "Fibrosis creates collagen-rich scar tissue that can distort normal tissue structure.",
    gameRole: "This scar structure blocks treatment placement and narrows nearby options.",
  },
} as const;

export const LEVEL_08_FIBROTIC_SIEVE: LevelDefinition = {
  id: 8,
  title: "Fibrotic Sieve",
  briefing:
    "Dense scar bands close the central firing positions. Build into the narrow tissue windows " +
    "to cover all four channels before they reunite.",
  accessibleDescription:
    "Four tumor-cell lanes leave one source, fan around a central web of scar tissue, and merge " +
    "at one blood exit. Scar bands block the broad central positions, leaving small upper, " +
    "lower, and distal tissue pockets for treatment placement.",
  theme: "fibrotic_sieve",
  routeClearance: 28,
  routeLearning: SCENE_LEARNING.route,
  segments: [
    {
      id: "shared_inlet",
      points: [
        { x: 40, y: 300 },
        { x: 120, y: 300 },
        { x: 210, y: 300 },
      ],
    },
    {
      id: "upper_outer_channel",
      points: [
        { x: 210, y: 300 },
        { x: 270, y: 168 },
        { x: 420, y: 126 },
        { x: 540, y: 190 },
        { x: 610, y: 300 },
      ],
    },
    {
      id: "upper_inner_channel",
      points: [
        { x: 210, y: 300 },
        { x: 310, y: 246 },
        { x: 430, y: 238 },
        { x: 535, y: 258 },
        { x: 610, y: 300 },
      ],
    },
    {
      id: "lower_inner_channel",
      points: [
        { x: 210, y: 300 },
        { x: 310, y: 354 },
        { x: 430, y: 362 },
        { x: 535, y: 342 },
        { x: 610, y: 300 },
      ],
    },
    {
      id: "lower_outer_channel",
      points: [
        { x: 210, y: 300 },
        { x: 270, y: 432 },
        { x: 420, y: 474 },
        { x: 540, y: 410 },
        { x: 610, y: 300 },
      ],
    },
    {
      id: "shared_outlet",
      points: [
        { x: 610, y: 300 },
        { x: 740, y: 300 },
        { x: 920, y: 300 },
      ],
    },
  ],
  routes: [
    {
      id: "upper_outer",
      sourceLandmarkId: "tumor_source",
      exitLandmarkId: "blood_exit",
      segmentIds: ["shared_inlet", "upper_outer_channel", "shared_outlet"],
    },
    {
      id: "upper_inner",
      sourceLandmarkId: "tumor_source",
      exitLandmarkId: "blood_exit",
      segmentIds: ["shared_inlet", "upper_inner_channel", "shared_outlet"],
    },
    {
      id: "lower_inner",
      sourceLandmarkId: "tumor_source",
      exitLandmarkId: "blood_exit",
      segmentIds: ["shared_inlet", "lower_inner_channel", "shared_outlet"],
    },
    {
      id: "lower_outer",
      sourceLandmarkId: "tumor_source",
      exitLandmarkId: "blood_exit",
      segmentIds: ["shared_inlet", "lower_outer_channel", "shared_outlet"],
    },
  ],
  landmarks: [
    {
      id: "tumor_source",
      kind: "source",
      position: { x: 40, y: 300 },
      routeIds: ["upper_outer", "upper_inner", "lower_inner", "lower_outer"],
      segmentIds: ["shared_inlet"],
      label: "Tumor source",
      learning: SCENE_LEARNING.source,
    },
    {
      id: "sieve_split",
      kind: "landmark",
      position: { x: 210, y: 300 },
      routeIds: ["upper_outer", "upper_inner", "lower_inner", "lower_outer"],
      segmentIds: [
        "shared_inlet",
        "upper_outer_channel",
        "upper_inner_channel",
        "lower_inner_channel",
        "lower_outer_channel",
      ],
      label: "Fibrotic sieve split",
      learning: SCENE_LEARNING.split,
    },
    {
      id: "scarred_center",
      kind: "combat_zone",
      position: { x: 430, y: 300 },
      routeIds: ["upper_outer", "upper_inner", "lower_inner", "lower_outer"],
      label: "Scarred central channels",
      learning: SCENE_LEARNING.center,
    },
    {
      id: "sieve_merge",
      kind: "merge",
      position: { x: 610, y: 300 },
      routeIds: ["upper_outer", "upper_inner", "lower_inner", "lower_outer"],
      segmentIds: [
        "upper_outer_channel",
        "upper_inner_channel",
        "lower_inner_channel",
        "lower_outer_channel",
        "shared_outlet",
      ],
      label: "Sieve outlet merge",
      learning: SCENE_LEARNING.merge,
    },
    {
      id: "blood_exit",
      kind: "exit",
      position: { x: 920, y: 300 },
      routeIds: ["upper_outer", "upper_inner", "lower_inner", "lower_outer"],
      segmentIds: ["shared_outlet"],
      label: "Bloodstream exit",
      learning: SCENE_LEARNING.exit,
    },
  ],
  obstacles: [
    {
      id: "inlet_scar",
      position: { x: 182, y: 300 },
      radius: 42,
      label: "Inlet scar band",
      landmarkId: "sieve_split",
      learning: SCENE_LEARNING.scar,
    },
    {
      id: "upper_scar",
      position: { x: 365, y: 178 },
      radius: 64,
      label: "Upper scar plate",
      learning: SCENE_LEARNING.scar,
    },
    {
      id: "central_scar",
      position: { x: 440, y: 300 },
      radius: 88,
      label: "Central fibrotic knot",
      landmarkId: "scarred_center",
      learning: SCENE_LEARNING.scar,
    },
    {
      id: "lower_scar",
      position: { x: 365, y: 422 },
      radius: 64,
      label: "Lower scar plate",
      learning: SCENE_LEARNING.scar,
    },
    {
      id: "outlet_scar",
      position: { x: 640, y: 300 },
      radius: 52,
      label: "Outlet scar collar",
      landmarkId: "sieve_merge",
      learning: SCENE_LEARNING.scar,
    },
  ],
  placementProbes: [
    {
      id: "northwest_suture_pocket",
      position: { x: 180, y: 112 },
      expectation: "legal",
      label: "Northwest suture pocket",
    },
    {
      id: "upper_sieve_window",
      position: { x: 500, y: 82 },
      expectation: "legal",
      label: "Upper sieve window",
    },
    {
      id: "lower_sieve_window",
      position: { x: 500, y: 518 },
      expectation: "legal",
      label: "Lower sieve window",
    },
    {
      id: "distal_escape_niche",
      position: { x: 772, y: 470 },
      expectation: "legal",
      label: "Distal escape niche",
    },
    {
      id: "upper_outer_route_probe",
      position: { x: 420, y: 126 },
      expectation: "route_blocked",
      routeId: "upper_outer",
      label: "Upper outer channel",
    },
    {
      id: "upper_inner_route_probe",
      position: { x: 430, y: 238 },
      expectation: "route_blocked",
      routeId: "upper_inner",
      label: "Upper inner channel",
    },
    {
      id: "lower_inner_route_probe",
      position: { x: 430, y: 362 },
      expectation: "route_blocked",
      routeId: "lower_inner",
      label: "Lower inner channel",
    },
    {
      id: "lower_outer_route_probe",
      position: { x: 420, y: 474 },
      expectation: "route_blocked",
      routeId: "lower_outer",
      label: "Lower outer channel",
    },
    {
      id: "central_scar_probe",
      position: { x: 440, y: 300 },
      expectation: "obstacle_blocked",
      obstacleId: "central_scar",
      label: "Central fibrotic knot",
    },
    {
      id: "upper_scar_probe",
      position: { x: 365, y: 178 },
      expectation: "obstacle_blocked",
      obstacleId: "upper_scar",
      label: "Upper scar plate",
    },
    {
      id: "outlet_scar_probe",
      position: { x: 640, y: 300 },
      expectation: "obstacle_blocked",
      obstacleId: "outlet_scar",
      label: "Outlet scar collar",
    },
  ],
  economy: {
    entryTpMinimum: 1400,
    entryTpMaximum: 1600,
    reinforcementTp: 1000,
    carryoverTpCap: 500,
  },
  waves: [
    {
      entries: [
        { type: "basic", count: 14, gap: 0.44, routeCycle: ["upper_outer", "lower_outer"] },
      ],
    },
    {
      entries: [{ type: "fast", count: 12, gap: 0.36, routeCycle: ["upper_inner", "lower_inner"] }],
    },
    {
      entries: [
        {
          type: "basic",
          count: 12,
          gap: 0.4,
          routeCycle: ["upper_outer", "upper_inner", "lower_inner", "lower_outer"],
        },
        {
          type: "tough",
          count: 4,
          gap: 0.86,
          routeCycle: ["upper_inner", "lower_inner"],
        },
      ],
    },
    {
      entries: [
        {
          type: "dividing",
          count: 7,
          gap: 0.64,
          routeCycle: ["upper_outer", "lower_outer", "upper_inner", "lower_inner"],
        },
        { type: "fast", count: 10, gap: 0.34, routeCycle: ["upper_inner", "lower_inner"] },
      ],
    },
    {
      entries: [
        { type: "tough", count: 6, gap: 0.78, routeCycle: ["upper_outer", "lower_outer"] },
        {
          type: "basic",
          count: 12,
          gap: 0.36,
          routeCycle: ["upper_inner", "lower_inner", "upper_outer", "lower_outer"],
        },
      ],
    },
    {
      entries: [
        {
          type: "immune_evasive",
          count: 8,
          gap: 0.56,
          routeCycle: ["upper_inner", "lower_inner", "upper_outer", "lower_outer"],
        },
        { type: "fast", count: 12, gap: 0.3, routeCycle: ["upper_outer", "lower_outer"] },
      ],
    },
    {
      entries: [
        {
          type: "dividing",
          count: 10,
          gap: 0.54,
          routeCycle: ["upper_outer", "upper_inner", "lower_inner", "lower_outer"],
        },
        { type: "tough", count: 6, gap: 0.74, routeCycle: ["upper_inner", "lower_inner"] },
      ],
    },
  ],
};
