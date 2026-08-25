import type { LevelDefinition } from "./level_definition";

const SCENE_LEARNING = {
  route: {
    biologicalFact:
      "Ducts are epithelial-lined tubes that connect smaller tissue units into larger channels.",
    gameRole: "Three routes begin separately, then share a narrow delta neck and one exit.",
  },
  source: {
    biologicalFact: "Epithelial cells form the lining of ducts and can undergo abnormal growth.",
    gameRole: "This tumor source feeds one or more of the separate early duct routes.",
  },
  merge: {
    biologicalFact: "Smaller duct branches can join a shared collecting channel.",
    gameRole: "All three tumor-cell routes first become one route at this narrow neck.",
  },
  coverage: {
    biologicalFact: "A shared duct segment carries material arriving from several branches.",
    gameRole: "Treatments beside this zone can cover cells from every incoming route.",
  },
  exit: {
    biologicalFact: "Blood vessels near ducts connect the local tissue to circulation.",
    gameRole: "Cells reaching this vessel leave the field and increase metastasis.",
  },
  lobule: {
    biologicalFact: "Lobules are organized clusters of cells connected to a duct system.",
    gameRole: "This lobule blocks central placement beside the merging duct branches.",
  },
  septum: {
    biologicalFact:
      "A fibrous septum is a connective-tissue partition between neighboring tissue regions.",
    gameRole: "This septum blocks a late placement area beside the shared exit route.",
  },
} as const;

/**
 * Three ducts begin at two separate tumor sources.  Their unique upstream
 * branches only become interchangeable at the delta neck, so early coverage
 * remains a distinct tactical requirement.
 */
export const LEVEL_06_DUCTAL_DELTA: LevelDefinition = {
  id: 6,
  title: "Ductal Delta",
  briefing:
    "Two duct sources release distinct threats. Cover their early branches before the delta neck " +
    "concentrates every route.",
  accessibleDescription:
    "Three tumor routes begin at upper and lower duct sources, remain separate through duct " +
    "branches, then share the delta neck and blood exit.",
  theme: "ductal_delta",
  routeClearance: 28,
  routeLearning: SCENE_LEARNING.route,
  segments: [
    {
      id: "upper_source_duct",
      points: [
        { x: 72, y: 126 },
        { x: 172, y: 126 },
        { x: 248, y: 194 },
      ],
    },
    {
      id: "middle_source_duct",
      points: [
        { x: 72, y: 126 },
        { x: 148, y: 214 },
        { x: 248, y: 258 },
      ],
    },
    {
      id: "upper_delta_branch",
      points: [
        { x: 248, y: 194 },
        { x: 350, y: 158 },
        { x: 466, y: 322 },
      ],
    },
    {
      id: "lower_source_duct",
      points: [
        { x: 76, y: 470 },
        { x: 176, y: 470 },
        { x: 258, y: 398 },
      ],
    },
    {
      id: "lower_delta_branch",
      points: [
        { x: 258, y: 398 },
        { x: 362, y: 450 },
        { x: 466, y: 322 },
      ],
    },
    {
      id: "middle_delta_branch",
      points: [
        { x: 248, y: 258 },
        { x: 326, y: 286 },
        { x: 466, y: 322 },
      ],
    },
    {
      id: "delta_neck",
      points: [
        { x: 466, y: 322 },
        { x: 572, y: 322 },
        { x: 662, y: 294 },
      ],
    },
    {
      id: "blood_exit_trunk",
      points: [
        { x: 662, y: 294 },
        { x: 770, y: 294 },
        { x: 900, y: 294 },
      ],
    },
  ],
  routes: [
    {
      id: "upper_duct",
      sourceLandmarkId: "upper_duct_source",
      exitLandmarkId: "blood_exit",
      segmentIds: ["upper_source_duct", "upper_delta_branch", "delta_neck", "blood_exit_trunk"],
    },
    {
      id: "middle_duct",
      sourceLandmarkId: "upper_duct_source",
      exitLandmarkId: "blood_exit",
      segmentIds: ["middle_source_duct", "middle_delta_branch", "delta_neck", "blood_exit_trunk"],
    },
    {
      id: "lower_duct",
      sourceLandmarkId: "lower_duct_source",
      exitLandmarkId: "blood_exit",
      segmentIds: ["lower_source_duct", "lower_delta_branch", "delta_neck", "blood_exit_trunk"],
    },
  ],
  landmarks: [
    {
      id: "upper_duct_source",
      kind: "source",
      position: { x: 72, y: 126 },
      routeIds: ["upper_duct", "middle_duct"],
      label: "Upper duct tumor source",
      learning: SCENE_LEARNING.source,
    },
    {
      id: "lower_duct_source",
      kind: "source",
      position: { x: 76, y: 470 },
      routeIds: ["lower_duct"],
      label: "Lower duct tumor source",
      learning: SCENE_LEARNING.source,
    },
    {
      id: "delta_neck_merge",
      kind: "merge",
      position: { x: 466, y: 322 },
      routeIds: ["upper_duct", "middle_duct", "lower_duct"],
      segmentIds: ["delta_neck"],
      label: "Shared delta neck",
      learning: SCENE_LEARNING.merge,
    },
    {
      id: "delta_fire_zone",
      kind: "combat_zone",
      position: { x: 572, y: 322 },
      routeIds: ["upper_duct", "middle_duct", "lower_duct"],
      segmentIds: ["delta_neck"],
      label: "Delta neck shared coverage zone",
      learning: SCENE_LEARNING.coverage,
    },
    {
      id: "blood_exit",
      kind: "exit",
      position: { x: 900, y: 294 },
      routeIds: ["upper_duct", "middle_duct", "lower_duct"],
      segmentIds: ["blood_exit_trunk"],
      label: "Blood vessel exit",
      learning: SCENE_LEARNING.exit,
    },
  ],
  obstacles: [
    {
      id: "ductal_lobule",
      position: { x: 356, y: 300 },
      radius: 58,
      label: "Ductal lobule",
      landmarkId: "delta_neck_merge",
      learning: SCENE_LEARNING.lobule,
    },
    {
      id: "fibrous_septum",
      position: { x: 734, y: 412 },
      radius: 45,
      label: "Fibrous septum",
      learning: SCENE_LEARNING.septum,
    },
  ],
  placementProbes: [
    {
      id: "upper_origin_coverage",
      position: { x: 182, y: 70 },
      expectation: "legal",
      label: "Upper source coverage pocket",
    },
    {
      id: "lower_origin_coverage",
      position: { x: 164, y: 376 },
      expectation: "legal",
      label: "Lower source coverage pocket",
    },
    {
      id: "delta_neck_coverage",
      position: { x: 574, y: 248 },
      expectation: "legal",
      label: "Shared delta neck coverage pocket",
    },
    {
      id: "upper_duct_route",
      position: { x: 350, y: 158 },
      expectation: "route_blocked",
      routeId: "upper_duct",
      label: "Upper duct route",
    },
    {
      id: "lower_duct_route",
      position: { x: 362, y: 450 },
      expectation: "route_blocked",
      routeId: "lower_duct",
      label: "Lower duct route",
    },
    {
      id: "delta_lobule_blocked",
      position: { x: 356, y: 300 },
      expectation: "obstacle_blocked",
      obstacleId: "ductal_lobule",
      label: "Ductal lobule",
    },
  ],
  economy: {
    entryTpMinimum: 470,
    entryTpMaximum: 650,
    reinforcementTp: 230,
    carryoverTpCap: 260,
  },
  waves: [
    {
      entries: [
        { type: "fast", count: 8, gap: 0.52, routeCycle: ["upper_duct", "middle_duct"] },
        { type: "tough", count: 5, gap: 0.85, routeCycle: ["lower_duct"] },
      ],
    },
    {
      entries: [
        { type: "basic", count: 12, gap: 0.46, routeCycle: ["upper_duct", "lower_duct"] },
        { type: "fast", count: 7, gap: 0.4, routeCycle: ["lower_duct"] },
      ],
    },
    {
      entries: [
        {
          type: "dividing",
          count: 8,
          gap: 0.7,
          routeCycle: ["upper_duct", "middle_duct", "lower_duct"],
        },
        { type: "tough", count: 7, gap: 0.7, routeCycle: ["lower_duct", "upper_duct"] },
      ],
    },
    {
      entries: [
        {
          type: "immune_evasive",
          count: 8,
          gap: 0.58,
          routeCycle: ["upper_duct", "lower_duct", "middle_duct"],
        },
        { type: "fast", count: 12, gap: 0.35, routeCycle: ["middle_duct", "lower_duct"] },
      ],
    },
  ],
};
