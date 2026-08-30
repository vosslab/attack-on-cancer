import type { LevelId, Point, RouteId, WaveEntry } from "../game_types";

export type RouteSegmentId = string;
export type LandmarkId = string;
export type ObstacleId = string;
export type PlacementProbeId = string;

export type LandmarkKind = "source" | "exit" | "merge" | "combat_zone" | "landmark";
export type PlacementExpectation = "legal" | "route_blocked" | "obstacle_blocked";

export interface SceneLearningContent {
  biologicalFact: string;
  gameRole: string;
}

export interface RouteSegmentDefinition {
  id: RouteSegmentId;
  points: readonly Point[];
}

export interface RouteDefinition {
  id: RouteId;
  sourceLandmarkId: LandmarkId;
  exitLandmarkId: LandmarkId;
  segmentIds: readonly RouteSegmentId[];
}

export interface LandmarkDefinition {
  id: LandmarkId;
  kind: LandmarkKind;
  position: Point;
  routeIds?: readonly RouteId[];
  segmentIds?: readonly RouteSegmentId[];
  label: string;
  learning: SceneLearningContent;
}

export interface ObstacleDefinition {
  id: ObstacleId;
  position: Point;
  radius: number;
  label: string;
  landmarkId?: LandmarkId;
  learning: SceneLearningContent;
}

export interface PlacementProbe {
  id: PlacementProbeId;
  position: Point;
  expectation: PlacementExpectation;
  routeId?: RouteId;
  obstacleId?: ObstacleId;
  label: string;
}

export interface EconomyEnvelope {
  entryTpMinimum: number;
  entryTpMaximum: number;
  reinforcementTp: number;
  carryoverTpCap: number;
}

export interface RouteWaveEntry extends WaveEntry {
  routeCycle: readonly RouteId[];
}

export interface CampaignWaveDefinition {
  entries: readonly RouteWaveEntry[];
}

export interface LevelDefinition {
  id: LevelId;
  title: string;
  briefing: string;
  accessibleDescription: string;
  theme: string;
  routeClearance: number;
  routeLearning: SceneLearningContent;
  segments: readonly RouteSegmentDefinition[];
  routes: readonly RouteDefinition[];
  landmarks: readonly LandmarkDefinition[];
  obstacles: readonly ObstacleDefinition[];
  placementProbes: readonly PlacementProbe[];
  economy: EconomyEnvelope;
  waves: readonly CampaignWaveDefinition[];
}

interface SegmentLookup {
  [segmentId: string]: RouteSegmentDefinition | undefined;
}

function validationError(level: LevelDefinition, message: string): never {
  throw new Error(`Level ${level.id}: ${message}`);
}

function requireNonEmpty(level: LevelDefinition, value: string, subject: string): void {
  if (value.trim().length === 0) {
    validationError(level, `${subject} must not be empty.`);
  }
}

function requireFinitePoint(level: LevelDefinition, point: Point, subject: string): void {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
    validationError(level, `${subject} must have finite coordinates.`);
  }
}

function validateSceneLearningContent(
  level: LevelDefinition,
  learning: SceneLearningContent,
  subject: string,
): void {
  requireNonEmpty(level, learning.biologicalFact, `${subject} biological fact`);
  requireNonEmpty(level, learning.gameRole, `${subject} game role`);
}

function requireUniqueIds<T extends { id: string }>(
  level: LevelDefinition,
  values: readonly T[],
  subject: string,
): void {
  const ids = new Set<string>();
  for (const value of values) {
    requireNonEmpty(level, value.id, `${subject} ID`);
    if (ids.has(value.id)) {
      validationError(level, `Duplicate ${subject} ID '${value.id}'.`);
    }
    ids.add(value.id);
  }
}

function pointsMatch(first: Point, second: Point): boolean {
  return first.x === second.x && first.y === second.y;
}

function getSegmentLookup(level: LevelDefinition): SegmentLookup {
  const segments: SegmentLookup = {};
  for (const segment of level.segments) {
    segments[segment.id] = segment;
  }
  return segments;
}

function getRequiredSegment(
  level: LevelDefinition,
  segments: SegmentLookup,
  segmentId: RouteSegmentId,
  subject: string,
): RouteSegmentDefinition {
  const segment = segments[segmentId];
  if (segment === undefined) {
    validationError(level, `${subject} references unknown segment '${segmentId}'.`);
  }
  return segment;
}

function validateSegments(level: LevelDefinition): SegmentLookup {
  if (level.segments.length === 0) {
    validationError(level, "must define at least one route segment.");
  }
  requireUniqueIds(level, level.segments, "segment");
  for (const segment of level.segments) {
    if (segment.points.length < 2) {
      validationError(level, `Segment '${segment.id}' needs at least two points.`);
    }
    for (const point of segment.points) {
      requireFinitePoint(level, point, `Segment '${segment.id}'`);
    }
  }
  const segments = getSegmentLookup(level);
  return segments;
}

function validateLandmarks(
  level: LevelDefinition,
  routeIds: ReadonlySet<RouteId>,
  segments: SegmentLookup,
): void {
  requireUniqueIds(level, level.landmarks, "landmark");
  for (const landmark of level.landmarks) {
    requireNonEmpty(level, landmark.label, `Landmark '${landmark.id}' label`);
    validateSceneLearningContent(level, landmark.learning, `Landmark '${landmark.id}' learning`);
    requireFinitePoint(level, landmark.position, `Landmark '${landmark.id}'`);
    for (const routeId of landmark.routeIds ?? []) {
      if (!routeIds.has(routeId)) {
        validationError(level, `Landmark '${landmark.id}' references unknown route '${routeId}'.`);
      }
    }
    for (const segmentId of landmark.segmentIds ?? []) {
      getRequiredSegment(level, segments, segmentId, `Landmark '${landmark.id}'`);
    }
  }
}

function buildLandmarkKinds(level: LevelDefinition): ReadonlyMap<LandmarkId, LandmarkKind> {
  const kinds = new Map<LandmarkId, LandmarkKind>();
  for (const landmark of level.landmarks) {
    kinds.set(landmark.id, landmark.kind);
  }
  return kinds;
}

function validateRouteContinuity(
  level: LevelDefinition,
  route: RouteDefinition,
  segments: SegmentLookup,
): void {
  if (route.segmentIds.length === 0) {
    validationError(level, `Route '${route.id}' needs at least one segment.`);
  }
  const usedSegments = new Set<RouteSegmentId>();
  let previousSegment: RouteSegmentDefinition | undefined;
  for (const segmentId of route.segmentIds) {
    if (usedSegments.has(segmentId)) {
      validationError(
        level,
        `Route '${route.id}' repeats segment '${segmentId}', creating a cycle.`,
      );
    }
    usedSegments.add(segmentId);
    const segment = getRequiredSegment(level, segments, segmentId, `Route '${route.id}'`);
    if (previousSegment !== undefined) {
      const previousEnd = previousSegment.points[previousSegment.points.length - 1];
      const segmentStart = segment.points[0];
      if (
        previousEnd === undefined ||
        segmentStart === undefined ||
        !pointsMatch(previousEnd, segmentStart)
      ) {
        validationError(
          level,
          `Route '${route.id}' is discontinuous before segment '${segmentId}'.`,
        );
      }
    }
    previousSegment = segment;
  }
}

function validateSegmentGraph(level: LevelDefinition): void {
  const edges = new Map<RouteSegmentId, Set<RouteSegmentId>>();
  for (const route of level.routes) {
    for (let index = 1; index < route.segmentIds.length; index += 1) {
      const from = route.segmentIds[index - 1];
      const to = route.segmentIds[index];
      if (from === undefined || to === undefined) continue;
      const destinations = edges.get(from) ?? new Set<RouteSegmentId>();
      destinations.add(to);
      edges.set(from, destinations);
    }
  }

  const visiting = new Set<RouteSegmentId>();
  const visited = new Set<RouteSegmentId>();
  function visit(segmentId: RouteSegmentId): void {
    if (visiting.has(segmentId)) {
      validationError(level, `Segment graph contains a cycle through '${segmentId}'.`);
    }
    if (visited.has(segmentId)) return;
    visiting.add(segmentId);
    for (const destination of edges.get(segmentId) ?? []) visit(destination);
    visiting.delete(segmentId);
    visited.add(segmentId);
  }
  for (const segmentId of edges.keys()) visit(segmentId);
}

function validateRoutes(level: LevelDefinition, segments: SegmentLookup): ReadonlySet<RouteId> {
  if (level.routes.length === 0) {
    validationError(level, "must define at least one route.");
  }
  requireUniqueIds(level, level.routes, "route");
  const routeIds = new Set(level.routes.map((route) => route.id));
  validateLandmarks(level, routeIds, segments);
  const landmarkKinds = buildLandmarkKinds(level);
  for (const route of level.routes) {
    if (landmarkKinds.get(route.sourceLandmarkId) !== "source") {
      validationError(
        level,
        `Route '${route.id}' references invalid source landmark '${route.sourceLandmarkId}'.`,
      );
    }
    if (landmarkKinds.get(route.exitLandmarkId) !== "exit") {
      validationError(
        level,
        `Route '${route.id}' references invalid exit landmark '${route.exitLandmarkId}'.`,
      );
    }
    validateRouteContinuity(level, route, segments);
  }
  validateSegmentGraph(level);
  return routeIds;
}

function distanceToSegment(point: Point, start: Point, end: Point): number {
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  const lengthSquared = deltaX * deltaX + deltaY * deltaY;
  if (lengthSquared === 0) return Math.hypot(point.x - start.x, point.y - start.y);
  const unboundedFraction =
    ((point.x - start.x) * deltaX + (point.y - start.y) * deltaY) / lengthSquared;
  const fraction = Math.max(0, Math.min(1, unboundedFraction));
  const closestX = start.x + fraction * deltaX;
  const closestY = start.y + fraction * deltaY;
  const distance = Math.hypot(point.x - closestX, point.y - closestY);
  return distance;
}

function isNearRoute(
  level: LevelDefinition,
  probe: PlacementProbe,
  route: RouteDefinition,
  segments: SegmentLookup,
  clearance: number,
): boolean {
  for (const segmentId of route.segmentIds) {
    const segment = getRequiredSegment(level, segments, segmentId, `Route '${route.id}'`);
    for (let index = 1; index < segment.points.length; index += 1) {
      const start = segment.points[index - 1];
      const end = segment.points[index];
      if (
        start !== undefined &&
        end !== undefined &&
        distanceToSegment(probe.position, start, end) <= clearance
      ) {
        return true;
      }
    }
  }
  return false;
}

function validateObstacles(level: LevelDefinition): ReadonlyMap<ObstacleId, ObstacleDefinition> {
  requireUniqueIds(level, level.obstacles, "obstacle");
  const landmarkIds = new Set(level.landmarks.map((landmark) => landmark.id));
  const obstacles = new Map<ObstacleId, ObstacleDefinition>();
  for (const obstacle of level.obstacles) {
    requireNonEmpty(level, obstacle.label, `Obstacle '${obstacle.id}' label`);
    validateSceneLearningContent(level, obstacle.learning, `Obstacle '${obstacle.id}' learning`);
    requireFinitePoint(level, obstacle.position, `Obstacle '${obstacle.id}'`);
    if (!Number.isFinite(obstacle.radius) || obstacle.radius <= 0) {
      validationError(level, `Obstacle '${obstacle.id}' needs a positive finite radius.`);
    }
    if (obstacle.landmarkId !== undefined && !landmarkIds.has(obstacle.landmarkId)) {
      validationError(
        level,
        `Obstacle '${obstacle.id}' references unknown landmark '${obstacle.landmarkId}'.`,
      );
    }
    obstacles.set(obstacle.id, obstacle);
  }
  return obstacles;
}

function isInsideObstacle(probe: PlacementProbe, obstacle: ObstacleDefinition): boolean {
  const distance = Math.hypot(
    probe.position.x - obstacle.position.x,
    probe.position.y - obstacle.position.y,
  );
  return distance <= obstacle.radius;
}

function validatePlacementProbes(
  level: LevelDefinition,
  routeIds: ReadonlySet<RouteId>,
  segments: SegmentLookup,
  obstacles: ReadonlyMap<ObstacleId, ObstacleDefinition>,
): void {
  requireUniqueIds(level, level.placementProbes, "placement probe");
  const routes = new Map(level.routes.map((route) => [route.id, route]));
  for (const probe of level.placementProbes) {
    requireNonEmpty(level, probe.label, `Placement probe '${probe.id}' label`);
    requireFinitePoint(level, probe.position, `Placement probe '${probe.id}'`);
    if (probe.expectation === "legal") {
      if (probe.routeId !== undefined || probe.obstacleId !== undefined) {
        validationError(level, `Legal placement probe '${probe.id}' must not reference a blocker.`);
      }
      const onRoute = level.routes.some((route) =>
        isNearRoute(level, probe, route, segments, level.routeClearance),
      );
      const inObstacle = [...obstacles.values()].some((obstacle) =>
        isInsideObstacle(probe, obstacle),
      );
      if (onRoute || inObstacle) {
        validationError(level, `Legal placement probe '${probe.id}' is blocked by map geometry.`);
      }
      continue;
    }
    if (probe.expectation === "route_blocked") {
      if (
        probe.routeId === undefined ||
        probe.obstacleId !== undefined ||
        !routeIds.has(probe.routeId)
      ) {
        validationError(
          level,
          `Route-blocked probe '${probe.id}' must reference exactly one valid route.`,
        );
      }
      const route = routes.get(probe.routeId);
      if (
        route === undefined ||
        !isNearRoute(level, probe, route, segments, level.routeClearance)
      ) {
        validationError(
          level,
          `Route-blocked probe '${probe.id}' is not on route '${probe.routeId}'.`,
        );
      }
      continue;
    }
    if (probe.obstacleId === undefined || probe.routeId !== undefined) {
      validationError(
        level,
        `Obstacle-blocked probe '${probe.id}' must reference exactly one obstacle.`,
      );
    }
    const obstacle = obstacles.get(probe.obstacleId);
    if (obstacle === undefined || !isInsideObstacle(probe, obstacle)) {
      validationError(
        level,
        `Obstacle-blocked probe '${probe.id}' is not inside obstacle '${probe.obstacleId}'.`,
      );
    }
  }
}

function validateEconomy(level: LevelDefinition): void {
  const values = Object.values(level.economy);
  if (values.some((value) => !Number.isFinite(value) || value < 0)) {
    validationError(level, "economy values must be finite and non-negative.");
  }
  if (level.economy.entryTpMinimum > level.economy.entryTpMaximum) {
    validationError(level, "economy entry TP minimum exceeds its maximum.");
  }
}

function validateWaves(level: LevelDefinition, routeIds: ReadonlySet<RouteId>): void {
  if (level.waves.length === 0) validationError(level, "must define at least one wave.");
  for (const [waveIndex, wave] of level.waves.entries()) {
    if (wave.entries.length === 0) validationError(level, `Wave ${waveIndex + 1} has no entries.`);
    for (const entry of wave.entries) {
      validateWaveEntry(level, entry, waveIndex, routeIds);
    }
  }
}

function validateWaveEntry(
  level: LevelDefinition,
  entry: RouteWaveEntry,
  waveIndex: number,
  routeIds: ReadonlySet<RouteId>,
): void {
  if (
    !Number.isInteger(entry.count) ||
    entry.count <= 0 ||
    !Number.isFinite(entry.gap) ||
    entry.gap < 0
  ) {
    validationError(level, `Wave ${waveIndex + 1} has an invalid spawn entry.`);
  }
  if (entry.routeCycle.length === 0) {
    validationError(level, `Wave ${waveIndex + 1} has an empty route cycle.`);
  }
  for (const routeId of entry.routeCycle) {
    if (!routeIds.has(routeId)) {
      validationError(level, `Wave ${waveIndex + 1} references unknown route '${routeId}'.`);
    }
  }
}

export function validateLevelDefinition(level: LevelDefinition): void {
  if (!Number.isInteger(level.id) || level.id < 1 || level.id > 10) {
    validationError(level, "ID must be an integer from 1 through 10.");
  }
  requireNonEmpty(level, level.title, "title");
  requireNonEmpty(level, level.briefing, "briefing");
  requireNonEmpty(level, level.accessibleDescription, "accessible description");
  requireNonEmpty(level, level.theme, "theme");
  validateSceneLearningContent(level, level.routeLearning, "Route network learning");
  if (!Number.isFinite(level.routeClearance) || level.routeClearance <= 0) {
    validationError(level, "route clearance must be positive and finite.");
  }
  const segments = validateSegments(level);
  const routeIds = validateRoutes(level, segments);
  const obstacles = validateObstacles(level);
  validatePlacementProbes(level, routeIds, segments, obstacles);
  validateEconomy(level);
  validateWaves(level, routeIds);
}
