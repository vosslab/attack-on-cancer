import type { LevelDefinition } from "./level_definition";

const SCENE_LEARNING = {
  route: {
    biologicalFact:
      "Lymphatic vessels carry lymph through lymph nodes, where immune cells sample its contents.",
    gameRole: "Two routes loop around the follicle in opposite directions before sharing one exit.",
  },
  source: {
    biologicalFact: "Afferent lymphatic vessels carry lymph into a lymph node.",
    gameRole: "Cancer cells enter both modeled lymph-node routes from this incoming vessel.",
  },
  follicle: {
    biologicalFact: "Lymph follicles are organized, immune-cell-rich regions within a lymph node.",
    gameRole: "This central follicle blocks placement and separates the two looping routes.",
  },
  cortex: {
    biologicalFact: "The lymph-node cortex contains follicles and other immune-cell-rich tissue.",
    gameRole: "This cortical loop identifies one side of the route around the follicle.",
  },
  hub: {
    biologicalFact: "Lymph leaving different node regions converges toward outgoing flow.",
    gameRole: "Both routes return here, creating repeated shared treatment coverage.",
  },
  exit: {
    biologicalFact: "Lymph eventually returns to the bloodstream through venous circulation.",
    gameRole: "Cells reaching this exit leave the local field and increase metastasis.",
  },
} as const;

/**
 * Two routes circulate in opposite directions around the lymph follicle before
 * returning to one shared cortical hub.  The exact entry and exit segments are
 * deliberately reused so coverage of the hub receives repeated exposure from
 * both routes without duplicating nearly identical geometry.
 */
export const LEVEL_04_LYMPH_NODE_LOOP: LevelDefinition = {
  id: 4,
  title: "Lymph Node Loop",
  briefing:
    "Cells circulate around the lymph follicle in opposite directions. Defend the cortical hub " +
    "where both loops return.",
  accessibleDescription:
    "Two counter-rotating cell routes leave one lymphatic source, pass above or below a central " +
    "lymph follicle, and reunite at a shared cortical hub before the blood exit.",
  theme: "lymph_node_loop",
  routeClearance: 32,
  routeLearning: SCENE_LEARNING.route,
  segments: [
    {
      id: "lymphatic_entry",
      points: [
        { x: 52, y: 300 },
        { x: 132, y: 300 },
        { x: 218, y: 300 },
      ],
    },
    {
      id: "upper_follicle_loop",
      points: [
        { x: 218, y: 300 },
        { x: 270, y: 205 },
        { x: 376, y: 132 },
        { x: 510, y: 122 },
        { x: 622, y: 170 },
        { x: 690, y: 250 },
        { x: 704, y: 300 },
      ],
    },
    {
      id: "lower_follicle_loop",
      points: [
        { x: 218, y: 300 },
        { x: 270, y: 395 },
        { x: 376, y: 468 },
        { x: 510, y: 478 },
        { x: 622, y: 430 },
        { x: 690, y: 350 },
        { x: 704, y: 300 },
      ],
    },
    {
      id: "cortical_hub_exit",
      points: [
        { x: 704, y: 300 },
        { x: 804, y: 300 },
        { x: 908, y: 300 },
      ],
    },
  ],
  routes: [
    {
      id: "upper_loop",
      sourceLandmarkId: "afferent_source",
      exitLandmarkId: "venous_exit",
      segmentIds: ["lymphatic_entry", "upper_follicle_loop", "cortical_hub_exit"],
    },
    {
      id: "lower_loop",
      sourceLandmarkId: "afferent_source",
      exitLandmarkId: "venous_exit",
      segmentIds: ["lymphatic_entry", "lower_follicle_loop", "cortical_hub_exit"],
    },
  ],
  landmarks: [
    {
      id: "afferent_source",
      kind: "source",
      position: { x: 52, y: 300 },
      routeIds: ["upper_loop", "lower_loop"],
      segmentIds: ["lymphatic_entry"],
      label: "Afferent lymphatic source",
      learning: SCENE_LEARNING.source,
    },
    {
      id: "follicle",
      kind: "landmark",
      position: { x: 480, y: 300 },
      label: "Lymph follicle",
      learning: SCENE_LEARNING.follicle,
    },
    {
      id: "upper_cortex",
      kind: "landmark",
      position: { x: 490, y: 122 },
      routeIds: ["upper_loop"],
      segmentIds: ["upper_follicle_loop"],
      label: "Upper cortical loop",
      learning: SCENE_LEARNING.cortex,
    },
    {
      id: "lower_cortex",
      kind: "landmark",
      position: { x: 490, y: 478 },
      routeIds: ["lower_loop"],
      segmentIds: ["lower_follicle_loop"],
      label: "Lower cortical loop",
      learning: SCENE_LEARNING.cortex,
    },
    {
      id: "cortical_hub",
      kind: "combat_zone",
      position: { x: 704, y: 300 },
      routeIds: ["upper_loop", "lower_loop"],
      segmentIds: ["upper_follicle_loop", "lower_follicle_loop", "cortical_hub_exit"],
      label: "Shared cortical hub",
      learning: SCENE_LEARNING.hub,
    },
    {
      id: "venous_exit",
      kind: "exit",
      position: { x: 908, y: 300 },
      routeIds: ["upper_loop", "lower_loop"],
      segmentIds: ["cortical_hub_exit"],
      label: "Venous exit",
      learning: SCENE_LEARNING.exit,
    },
  ],
  obstacles: [
    {
      id: "lymph_follicle_mass",
      position: { x: 480, y: 300 },
      radius: 128,
      landmarkId: "follicle",
      label: "Lymph follicle",
      learning: SCENE_LEARNING.follicle,
    },
  ],
  placementProbes: [
    {
      id: "hub_coverage_pocket",
      position: { x: 770, y: 410 },
      expectation: "legal",
      label: "Open cortex covering the shared hub",
    },
    {
      id: "upper-hub-flank",
      position: { x: 600, y: 220 },
      expectation: "legal",
      label: "Upper cortex covering the loop hub",
    },
    {
      id: "lower-hub-flank",
      position: { x: 600, y: 380 },
      expectation: "legal",
      label: "Lower cortex covering the loop hub",
    },
    {
      id: "upper_loop_route",
      position: { x: 510, y: 122 },
      expectation: "route_blocked",
      routeId: "upper_loop",
      label: "Upper cortical route",
    },
    {
      id: "lower_loop_route",
      position: { x: 510, y: 478 },
      expectation: "route_blocked",
      routeId: "lower_loop",
      label: "Lower cortical route",
    },
    {
      id: "follicle_obstacle",
      position: { x: 480, y: 300 },
      expectation: "obstacle_blocked",
      obstacleId: "lymph_follicle_mass",
      label: "Lymph follicle",
    },
  ],
  economy: {
    entryTpMinimum: 260,
    entryTpMaximum: 420,
    reinforcementTp: 70,
    carryoverTpCap: 310,
  },
  waves: [
    {
      entries: [{ type: "basic", count: 10, gap: 0.52, routeCycle: ["upper_loop", "lower_loop"] }],
    },
    {
      entries: [
        { type: "basic", count: 8, gap: 0.46, routeCycle: ["lower_loop", "upper_loop"] },
        { type: "fast", count: 6, gap: 0.4, routeCycle: ["upper_loop", "lower_loop"] },
      ],
    },
    {
      entries: [
        { type: "tough", count: 5, gap: 0.7, routeCycle: ["upper_loop", "lower_loop"] },
        { type: "basic", count: 10, gap: 0.36, routeCycle: ["lower_loop", "upper_loop"] },
      ],
    },
    {
      entries: [
        { type: "fast", count: 12, gap: 0.3, routeCycle: ["upper_loop", "lower_loop"] },
        { type: "dividing", count: 4, gap: 0.82, routeCycle: ["lower_loop", "upper_loop"] },
      ],
    },
    {
      entries: [
        { type: "immune_evasive", count: 5, gap: 0.72, routeCycle: ["upper_loop", "lower_loop"] },
        { type: "tough", count: 6, gap: 0.58, routeCycle: ["lower_loop", "upper_loop"] },
      ],
    },
  ],
};
