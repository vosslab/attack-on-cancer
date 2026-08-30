import type { LevelId, Point, RouteId } from "../game_types";
import { LEVEL_01_SKIN_TISSUE } from "./level_01_skin_tissue";
import { LEVEL_02_CLUSTER_CORRIDOR } from "./level_02_cluster_corridor";
import { LEVEL_03_CAPILLARY_CROSSROADS } from "./level_03_capillary_crossroads";
import { LEVEL_04_LYMPH_NODE_LOOP } from "./level_04_lymph_node_loop";
import { LEVEL_05_ALVEOLAR_SWITCHBACKS } from "./level_05_alveolar_switchbacks";
import { LEVEL_06_DUCTAL_DELTA } from "./level_06_ductal_delta";
import { LEVEL_07_VASCULAR_BYPASS } from "./level_07_vascular_bypass";
import { LEVEL_08_FIBROTIC_SIEVE } from "./level_08_fibrotic_sieve";
import { LEVEL_09_MARROW_LATTICE } from "./level_09_marrow_lattice";
import { LEVEL_10_METASTATIC_CONFLUENCE } from "./level_10_metastatic_confluence";
import {
  validateLevelDefinition,
  type CampaignWaveDefinition,
  type LevelDefinition,
  type RouteDefinition,
} from "./level_definition";

export const CAMPAIGN_LEVELS = [
  LEVEL_01_SKIN_TISSUE,
  LEVEL_02_CLUSTER_CORRIDOR,
  LEVEL_03_CAPILLARY_CROSSROADS,
  LEVEL_04_LYMPH_NODE_LOOP,
  LEVEL_05_ALVEOLAR_SWITCHBACKS,
  LEVEL_06_DUCTAL_DELTA,
  LEVEL_07_VASCULAR_BYPASS,
  LEVEL_08_FIBROTIC_SIEVE,
  LEVEL_09_MARROW_LATTICE,
  LEVEL_10_METASTATIC_CONFLUENCE,
] as const satisfies readonly LevelDefinition[];

type RoutePointsById = ReadonlyMap<RouteId, readonly Point[]>;

function getSegmentPoints(level: LevelDefinition, segmentId: string): readonly Point[] {
  const segment = level.segments.find((candidate) => candidate.id === segmentId);
  if (segment === undefined) {
    throw new Error(`Level ${level.id}: route references unknown segment '${segmentId}'.`);
  }
  return segment.points;
}

function assembleRoutePoints(level: LevelDefinition, route: RouteDefinition): readonly Point[] {
  const points: Point[] = [];
  for (const [segmentIndex, segmentId] of route.segmentIds.entries()) {
    const segmentPoints = getSegmentPoints(level, segmentId);
    const startIndex = segmentIndex === 0 ? 0 : 1;
    points.push(...segmentPoints.slice(startIndex));
  }
  return points;
}

function buildRoutePointCache(level: LevelDefinition): RoutePointsById {
  const routePoints = new Map<RouteId, readonly Point[]>();
  for (const route of level.routes) {
    routePoints.set(route.id, assembleRoutePoints(level, route));
  }
  return routePoints;
}

function requireOrderedIds(levels: readonly LevelDefinition[]): void {
  if (levels.length !== 10) {
    throw new Error(`Campaign must contain exactly 10 levels; found ${levels.length}.`);
  }
  for (const [index, level] of levels.entries()) {
    const expectedId = index + 1;
    if (level.id !== expectedId) {
      throw new Error(`Campaign level ${expectedId} must appear at position ${expectedId}.`);
    }
  }
}

/** Validates each authored definition and the campaign's fixed 1-through-10 progression. */
export function validateCampaignLevels(levels: readonly LevelDefinition[]): void {
  requireOrderedIds(levels);
  for (const level of levels) validateLevelDefinition(level);
}

validateCampaignLevels(CAMPAIGN_LEVELS);

const LEVELS_BY_ID = new Map<LevelId, LevelDefinition>(
  CAMPAIGN_LEVELS.map((level) => [level.id, level]),
);
const ROUTE_POINTS_BY_LEVEL = new Map<LevelId, RoutePointsById>(
  CAMPAIGN_LEVELS.map((level) => [level.id, buildRoutePointCache(level)]),
);

export function getCampaignLevel(levelId: LevelId): LevelDefinition {
  const level = LEVELS_BY_ID.get(levelId);
  if (level === undefined) throw new Error(`Unknown campaign level '${levelId}'.`);
  return level;
}

export function getLevelRoute(levelId: LevelId, routeId: RouteId): RouteDefinition {
  const level = getCampaignLevel(levelId);
  const route = level.routes.find((candidate) => candidate.id === routeId);
  if (route === undefined) throw new Error(`Level ${levelId}: unknown route '${routeId}'.`);
  return route;
}

/** Returns the canonical source-to-exit points assembled once from shared segments. */
export function getLevelRoutePoints(levelId: LevelId, routeId: RouteId): readonly Point[] {
  getLevelRoute(levelId, routeId);
  const routePoints = ROUTE_POINTS_BY_LEVEL.get(levelId)?.get(routeId);
  if (routePoints === undefined)
    throw new Error(`Level ${levelId}: missing points for '${routeId}'.`);
  return routePoints;
}

export function getLevelWaves(levelId: LevelId): readonly CampaignWaveDefinition[] {
  const level = getCampaignLevel(levelId);
  return level.waves;
}
