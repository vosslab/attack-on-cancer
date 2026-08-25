import type { Point } from "../game_types";
import type { LevelDefinition, RouteSegmentDefinition } from "./level_definition";

const ROUTE_STEPS_PER_CURVE = 8;

interface CubicRouteSegment {
  controlOne: Point;
  controlTwo: Point;
  end: Point;
}

function sampleCubicSegment(
  id: string,
  start: Point,
  curve: CubicRouteSegment,
): RouteSegmentDefinition {
  const points: Point[] = [{ ...start }];
  for (let step = 1; step <= ROUTE_STEPS_PER_CURVE; step += 1) {
    const fraction = step / ROUTE_STEPS_PER_CURVE;
    const inverse = 1 - fraction;
    points.push({
      x:
        inverse ** 3 * start.x +
        3 * inverse ** 2 * fraction * curve.controlOne.x +
        3 * inverse * fraction ** 2 * curve.controlTwo.x +
        fraction ** 3 * curve.end.x,
      y:
        inverse ** 3 * start.y +
        3 * inverse ** 2 * fraction * curve.controlOne.y +
        3 * inverse * fraction ** 2 * curve.controlTwo.y +
        fraction ** 3 * curve.end.y,
    });
  }
  const segment: RouteSegmentDefinition = { id, points };
  return segment;
}

// The segment endpoints and controls reproduce the original Cluster Corridor path exactly.
// Keeping each curve separate makes the long early climb, central loop, and late bend editable.
const CLUSTER_SEGMENTS: readonly RouteSegmentDefinition[] = [
  sampleCubicSegment(
    "cluster-entry",
    { x: 52, y: 318 },
    {
      controlOne: { x: 108, y: 326 },
      controlTwo: { x: 164, y: 310 },
      end: { x: 190, y: 254 },
    },
  ),
  sampleCubicSegment(
    "upper-climb",
    { x: 190, y: 254 },
    {
      controlOne: { x: 216, y: 194 },
      controlTwo: { x: 218, y: 142 },
      end: { x: 278, y: 116 },
    },
  ),
  sampleCubicSegment(
    "upper-arc",
    { x: 278, y: 116 },
    {
      controlOne: { x: 326, y: 94 },
      controlTwo: { x: 374, y: 100 },
      end: { x: 416, y: 142 },
    },
  ),
  sampleCubicSegment(
    "central-descent",
    { x: 416, y: 142 },
    {
      controlOne: { x: 458, y: 184 },
      controlTwo: { x: 478, y: 220 },
      end: { x: 456, y: 278 },
    },
  ),
  sampleCubicSegment(
    "central-turn",
    { x: 456, y: 278 },
    {
      controlOne: { x: 438, y: 326 },
      controlTwo: { x: 392, y: 358 },
      end: { x: 418, y: 408 },
    },
  ),
  sampleCubicSegment(
    "lower-sweep",
    { x: 418, y: 408 },
    {
      controlOne: { x: 442, y: 454 },
      controlTwo: { x: 490, y: 482 },
      end: { x: 548, y: 474 },
    },
  ),
  sampleCubicSegment(
    "lower-rise",
    { x: 548, y: 474 },
    {
      controlOne: { x: 604, y: 468 },
      controlTwo: { x: 654, y: 450 },
      end: { x: 686, y: 402 },
    },
  ),
  sampleCubicSegment(
    "late-bend",
    { x: 686, y: 402 },
    {
      controlOne: { x: 720, y: 352 },
      controlTwo: { x: 742, y: 320 },
      end: { x: 724, y: 278 },
    },
  ),
  sampleCubicSegment(
    "return-arc",
    { x: 724, y: 278 },
    {
      controlOne: { x: 708, y: 238 },
      controlTwo: { x: 664, y: 210 },
      end: { x: 674, y: 174 },
    },
  ),
  sampleCubicSegment(
    "exit-approach",
    { x: 674, y: 174 },
    {
      controlOne: { x: 688, y: 126 },
      controlTwo: { x: 766, y: 108 },
      end: { x: 812, y: 132 },
    },
  ),
  sampleCubicSegment(
    "blood-vessel-entry",
    { x: 812, y: 132 },
    {
      controlOne: { x: 856, y: 154 },
      controlTwo: { x: 864, y: 220 },
      end: { x: 900, y: 242 },
    },
  ),
];

const CLUSTER_ROUTE_SEGMENT_IDS = CLUSTER_SEGMENTS.map((segment) => segment.id);

const SCENE_LEARNING = {
  route: {
    biologicalFact:
      "Cancer cells can invade surrounding tissue and enter nearby blood or lymphatic vessels.",
    gameRole:
      "This long corridor carries every cell around the central cluster toward circulation.",
  },
  source: {
    biologicalFact: "A tumor can contain many groups of abnormal cells within one mass.",
    gameRole: "The full wave enters from this multi-tumor source at the field edge.",
  },
  coverageRidge: {
    biologicalFact:
      "Tumor microenvironments include surrounding cells, extracellular matrix, and vessels.",
    gameRole: "This open ridge offers early coverage before cells descend around the cluster.",
  },
  tumorCluster: {
    biologicalFact:
      "A solid tumor is a three-dimensional mass of abnormal cells and supporting tissue.",
    gameRole: "This central mass blocks treatment placement and forces the route around it.",
  },
  lateBend: {
    biologicalFact: "Blood and lymphatic vessels curve as they pass through tissues.",
    gameRole: "This late bend is the final broad coverage opportunity before the exit.",
  },
  exit: {
    biologicalFact: "Endothelial cells form the inner lining of blood vessels.",
    gameRole: "Cells reaching this vessel leave the field and add to the metastasis count.",
  },
} as const;

export const LEVEL_02_CLUSTER_CORRIDOR: LevelDefinition = {
  id: 2,
  title: "Cluster Corridor",
  briefing:
    "Redeploy on a fresh field. Cover the long upper approach, then protect the late bend before " +
    "cells reach circulation.",
  accessibleDescription:
    "A single long route begins at a multi-tumor cluster on the left, climbs through an upper " +
    "arc, loops below a blocked central tumor cluster, then turns upward through a late bend to " +
    "the blood-vessel exit on the right.",
  theme: "cluster-corridor",
  routeClearance: 34,
  routeLearning: SCENE_LEARNING.route,
  segments: CLUSTER_SEGMENTS,
  routes: [
    {
      id: "cluster-corridor",
      sourceLandmarkId: "multi-tumor-source",
      exitLandmarkId: "blood-vessel-exit",
      segmentIds: CLUSTER_ROUTE_SEGMENT_IDS,
    },
  ],
  landmarks: [
    {
      id: "multi-tumor-source",
      kind: "source",
      position: { x: 52, y: 318 },
      routeIds: ["cluster-corridor"],
      segmentIds: ["cluster-entry"],
      label: "Multi-tumor cluster source",
      learning: SCENE_LEARNING.source,
    },
    {
      id: "upper-coverage-ridge",
      kind: "combat_zone",
      position: { x: 330, y: 168 },
      routeIds: ["cluster-corridor"],
      segmentIds: ["upper-climb", "upper-arc"],
      label: "Upper coverage ridge",
      learning: SCENE_LEARNING.coverageRidge,
    },
    {
      id: "central-tumor-cluster",
      kind: "landmark",
      position: { x: 526, y: 316 },
      label: "Blocked central tumor cluster",
      learning: SCENE_LEARNING.tumorCluster,
    },
    {
      id: "late-bend-guard",
      kind: "combat_zone",
      position: { x: 710, y: 336 },
      routeIds: ["cluster-corridor"],
      segmentIds: ["lower-rise", "late-bend", "return-arc"],
      label: "Late-bend guard zone",
      learning: SCENE_LEARNING.lateBend,
    },
    {
      id: "blood-vessel-exit",
      kind: "exit",
      position: { x: 900, y: 242 },
      routeIds: ["cluster-corridor"],
      segmentIds: ["blood-vessel-entry"],
      label: "Blood vessel exit",
      learning: SCENE_LEARNING.exit,
    },
  ],
  obstacles: [
    {
      id: "central-tumor-cluster-obstacle",
      position: { x: 526, y: 316 },
      radius: 82,
      label: "Central tumor cluster",
      landmarkId: "central-tumor-cluster",
      learning: SCENE_LEARNING.tumorCluster,
    },
  ],
  placementProbes: [
    {
      id: "upper-ridge-long-range",
      position: { x: 326, y: 224 },
      expectation: "legal",
      label: "Open upper ridge for long-range coverage",
    },
    {
      id: "late-bend-coverage",
      position: { x: 782, y: 350 },
      expectation: "legal",
      label: "Open tissue beside the late bend",
    },
    {
      id: "central-route-blocked",
      position: { x: 456, y: 278 },
      expectation: "route_blocked",
      routeId: "cluster-corridor",
      label: "Central corridor route",
    },
    {
      id: "central-cluster-blocked",
      position: { x: 526, y: 316 },
      expectation: "obstacle_blocked",
      obstacleId: "central-tumor-cluster-obstacle",
      label: "Central tumor cluster",
    },
  ],
  economy: {
    entryTpMinimum: 200,
    entryTpMaximum: 900,
    reinforcementTp: 200,
    carryoverTpCap: 700,
  },
  waves: [
    {
      entries: [
        { type: "basic", count: 30, gap: 0.19, routeCycle: ["cluster-corridor"] },
        { type: "fast", count: 22, gap: 0.17, routeCycle: ["cluster-corridor"] },
      ],
    },
    {
      entries: [
        { type: "tough", count: 16, gap: 0.38, routeCycle: ["cluster-corridor"] },
        { type: "dividing", count: 20, gap: 0.25, routeCycle: ["cluster-corridor"] },
      ],
    },
    {
      entries: [
        { type: "immune_evasive", count: 22, gap: 0.24, routeCycle: ["cluster-corridor"] },
        { type: "fast", count: 28, gap: 0.15, routeCycle: ["cluster-corridor"] },
        { type: "basic", count: 18, gap: 0.18, routeCycle: ["cluster-corridor"] },
      ],
    },
    {
      entries: [
        { type: "dividing", count: 28, gap: 0.21, routeCycle: ["cluster-corridor"] },
        { type: "tough", count: 18, gap: 0.31, routeCycle: ["cluster-corridor"] },
        { type: "immune_evasive", count: 16, gap: 0.25, routeCycle: ["cluster-corridor"] },
      ],
    },
    {
      entries: [
        { type: "basic", count: 35, gap: 0.14, routeCycle: ["cluster-corridor"] },
        { type: "fast", count: 35, gap: 0.13, routeCycle: ["cluster-corridor"] },
        { type: "tough", count: 20, gap: 0.29, routeCycle: ["cluster-corridor"] },
        { type: "dividing", count: 18, gap: 0.22, routeCycle: ["cluster-corridor"] },
      ],
    },
    {
      entries: [
        { type: "basic", count: 40, gap: 0.12, routeCycle: ["cluster-corridor"] },
        { type: "fast", count: 40, gap: 0.12, routeCycle: ["cluster-corridor"] },
        { type: "dividing", count: 30, gap: 0.17, routeCycle: ["cluster-corridor"] },
        { type: "immune_evasive", count: 30, gap: 0.19, routeCycle: ["cluster-corridor"] },
        { type: "tough", count: 24, gap: 0.26, routeCycle: ["cluster-corridor"] },
        { type: "tumor_mass", count: 1, gap: 0.5, routeCycle: ["cluster-corridor"] },
      ],
    },
  ],
};
