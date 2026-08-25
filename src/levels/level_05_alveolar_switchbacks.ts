import type { LevelDefinition } from "./level_definition";

const UPPER_ROUTE = "upper_alveolus";
const LOWER_ROUTE = "lower_alveolus";

const SCENE_LEARNING = {
  route: {
    biologicalFact:
      "Dense capillary networks curve around alveoli so gases can move between air and blood.",
    gameRole: "Two long hairpin routes circle separate air spaces before merging at one exit.",
  },
  source: {
    biologicalFact: "Bronchioles conduct air toward the alveoli at the ends of the airway tree.",
    gameRole: "Cancer cells enter both modeled tissue routes beside this bronchiole.",
  },
  airSpace: {
    biologicalFact:
      "Alveoli are tiny lung air sacs where oxygen enters blood and carbon dioxide leaves it.",
    gameRole: "This air space blocks treatment placement and bends one route around its edge.",
  },
  lateBend: {
    biologicalFact: "Capillaries closely follow curved alveolar surfaces during gas exchange.",
    gameRole: "This hairpin is a late chance to contain cells before the routes merge.",
  },
  merge: {
    biologicalFact: "Small pulmonary capillaries join larger vessels after gas exchange.",
    gameRole: "The upper and lower routes reunite here and share the final exit segment.",
  },
  exit: {
    biologicalFact: "Pulmonary vessels carry blood away from capillary beds around alveoli.",
    gameRole: "Cells reaching this exit leave the field and increase metastasis.",
  },
} as const;

/**
 * Level 5 asks players to cover two parallel return lanes without treating the
 * air spaces as buildable tissue. The exact shared entry and exit segments keep
 * simulation, placement clearance, and later route painting on one geometry.
 */
export const LEVEL_05_ALVEOLAR_SWITCHBACKS: LevelDefinition = {
  id: 5,
  title: "Alveolar Switchbacks",
  briefing:
    "Two tumor-cell lanes fold around separate air spaces. Long-range treatment can reach both " +
    "parallel lanes, while the late bends still need protection.",
  accessibleDescription:
    "A source at the left splits into upper and lower hairpin routes around two round air " +
    "spaces. Both routes turn back toward the center before joining an exit lane at the right.",
  theme: "alveolar_switchbacks",
  routeClearance: 28,
  routeLearning: SCENE_LEARNING.route,
  segments: [
    {
      id: "shared_entry",
      points: [
        { x: 48, y: 300 },
        { x: 148, y: 300 },
        { x: 220, y: 300 },
      ],
    },
    {
      id: "upper_approach",
      points: [
        { x: 220, y: 300 },
        { x: 272, y: 226 },
        { x: 356, y: 154 },
      ],
    },
    {
      id: "upper_hairpin",
      points: [
        { x: 356, y: 154 },
        { x: 570, y: 154 },
        { x: 650, y: 180 },
        { x: 650, y: 240 },
        { x: 586, y: 260 },
        { x: 382, y: 260 },
      ],
    },
    {
      id: "upper_return",
      points: [
        { x: 382, y: 260 },
        { x: 510, y: 260 },
        { x: 704, y: 260 },
      ],
    },
    {
      id: "upper_exit_link",
      points: [
        { x: 704, y: 260 },
        { x: 760, y: 300 },
      ],
    },
    {
      id: "lower_approach",
      points: [
        { x: 220, y: 300 },
        { x: 272, y: 374 },
        { x: 356, y: 446 },
      ],
    },
    {
      id: "lower_hairpin",
      points: [
        { x: 356, y: 446 },
        { x: 570, y: 446 },
        { x: 650, y: 420 },
        { x: 650, y: 360 },
        { x: 586, y: 340 },
        { x: 382, y: 340 },
      ],
    },
    {
      id: "lower_return",
      points: [
        { x: 382, y: 340 },
        { x: 510, y: 340 },
        { x: 704, y: 340 },
      ],
    },
    {
      id: "shared_exit",
      points: [
        { x: 760, y: 300 },
        { x: 912, y: 300 },
      ],
    },
    {
      id: "lower_exit_link",
      points: [
        { x: 704, y: 340 },
        { x: 760, y: 300 },
      ],
    },
  ],
  routes: [
    {
      id: UPPER_ROUTE,
      sourceLandmarkId: "bronchiole_source",
      exitLandmarkId: "capillary_exit",
      segmentIds: [
        "shared_entry",
        "upper_approach",
        "upper_hairpin",
        "upper_return",
        "upper_exit_link",
        "shared_exit",
      ],
    },
    {
      id: LOWER_ROUTE,
      sourceLandmarkId: "bronchiole_source",
      exitLandmarkId: "capillary_exit",
      segmentIds: [
        "shared_entry",
        "lower_approach",
        "lower_hairpin",
        "lower_return",
        "lower_exit_link",
        "shared_exit",
      ],
    },
  ],
  landmarks: [
    {
      id: "bronchiole_source",
      kind: "source",
      position: { x: 48, y: 300 },
      routeIds: [UPPER_ROUTE, LOWER_ROUTE],
      segmentIds: ["shared_entry"],
      label: "Bronchiole tumor source",
      learning: SCENE_LEARNING.source,
    },
    {
      id: "upper_air_space",
      kind: "landmark",
      position: { x: 500, y: 207 },
      routeIds: [UPPER_ROUTE],
      segmentIds: ["upper_hairpin"],
      label: "Upper alveolar air space",
      learning: SCENE_LEARNING.airSpace,
    },
    {
      id: "lower_air_space",
      kind: "landmark",
      position: { x: 500, y: 393 },
      routeIds: [LOWER_ROUTE],
      segmentIds: ["lower_hairpin"],
      label: "Lower alveolar air space",
      learning: SCENE_LEARNING.airSpace,
    },
    {
      id: "upper_late_bend",
      kind: "combat_zone",
      position: { x: 650, y: 240 },
      routeIds: [UPPER_ROUTE],
      segmentIds: ["upper_hairpin"],
      label: "Upper late bend",
      learning: SCENE_LEARNING.lateBend,
    },
    {
      id: "lower_late_bend",
      kind: "combat_zone",
      position: { x: 650, y: 360 },
      routeIds: [LOWER_ROUTE],
      segmentIds: ["lower_hairpin"],
      label: "Lower late bend",
      learning: SCENE_LEARNING.lateBend,
    },
    {
      id: "capillary_merge",
      kind: "merge",
      position: { x: 760, y: 300 },
      routeIds: [UPPER_ROUTE, LOWER_ROUTE],
      segmentIds: ["upper_exit_link", "lower_exit_link", "shared_exit"],
      label: "Capillary merge",
      learning: SCENE_LEARNING.merge,
    },
    {
      id: "capillary_exit",
      kind: "exit",
      position: { x: 912, y: 300 },
      routeIds: [UPPER_ROUTE, LOWER_ROUTE],
      segmentIds: ["shared_exit"],
      label: "Capillary escape exit",
      learning: SCENE_LEARNING.exit,
    },
  ],
  obstacles: [
    {
      id: "upper_air_space_obstacle",
      position: { x: 500, y: 207 },
      radius: 52,
      label: "Upper air space",
      landmarkId: "upper_air_space",
      learning: SCENE_LEARNING.airSpace,
    },
    {
      id: "lower_air_space_obstacle",
      position: { x: 500, y: 393 },
      radius: 52,
      label: "Lower air space",
      landmarkId: "lower_air_space",
      learning: SCENE_LEARNING.airSpace,
    },
  ],
  placementProbes: [
    {
      id: "parallel_long_range_platform",
      position: { x: 510, y: 300 },
      expectation: "legal",
      label: "Central tissue for parallel long-range coverage",
    },
    {
      id: "upper_late_bend_platform",
      position: { x: 708, y: 214 },
      expectation: "legal",
      label: "Upper late-bend coverage tissue",
    },
    {
      id: "lower_late_bend_platform",
      position: { x: 708, y: 386 },
      expectation: "legal",
      label: "Lower late-bend coverage tissue",
    },
    {
      id: "upper_return_route_blocked",
      position: { x: 500, y: 260 },
      expectation: "route_blocked",
      routeId: UPPER_ROUTE,
      label: "Upper returning lane",
    },
    {
      id: "lower_return_route_blocked",
      position: { x: 500, y: 340 },
      expectation: "route_blocked",
      routeId: LOWER_ROUTE,
      label: "Lower returning lane",
    },
    {
      id: "upper_air_space_blocked",
      position: { x: 500, y: 207 },
      expectation: "obstacle_blocked",
      obstacleId: "upper_air_space_obstacle",
      label: "Upper air-space interior",
    },
    {
      id: "lower_air_space_blocked",
      position: { x: 500, y: 393 },
      expectation: "obstacle_blocked",
      obstacleId: "lower_air_space_obstacle",
      label: "Lower air-space interior",
    },
  ],
  economy: {
    entryTpMinimum: 360,
    entryTpMaximum: 460,
    reinforcementTp: 210,
    carryoverTpCap: 210,
  },
  waves: [
    {
      entries: [{ type: "basic", count: 12, gap: 0.52, routeCycle: [UPPER_ROUTE, LOWER_ROUTE] }],
    },
    {
      entries: [{ type: "fast", count: 14, gap: 0.36, routeCycle: [LOWER_ROUTE, UPPER_ROUTE] }],
    },
    {
      entries: [
        { type: "basic", count: 10, gap: 0.4, routeCycle: [UPPER_ROUTE, LOWER_ROUTE] },
        { type: "tough", count: 4, gap: 0.9, routeCycle: [LOWER_ROUTE, UPPER_ROUTE] },
      ],
    },
    {
      entries: [
        { type: "dividing", count: 8, gap: 0.58, routeCycle: [UPPER_ROUTE, LOWER_ROUTE] },
        { type: "fast", count: 12, gap: 0.3, routeCycle: [LOWER_ROUTE, UPPER_ROUTE] },
      ],
    },
    {
      entries: [
        { type: "immune_evasive", count: 8, gap: 0.6, routeCycle: [LOWER_ROUTE, UPPER_ROUTE] },
        { type: "tough", count: 6, gap: 0.78, routeCycle: [UPPER_ROUTE, LOWER_ROUTE] },
      ],
    },
  ],
};
