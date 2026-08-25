import type { CellRepairEvent, Enemy, EnemyId, LevelId, Point } from "./game_types";
import { getEnemyVisualPosition } from "./simulation";
import type { VisualVariant } from "../generated/visual_assets";

export type CellVariant = VisualVariant;
export type CellDeathKind = "apoptosis" | "rupture";

export interface CellDeathVisual {
  enemyId: number;
  type: EnemyId;
  position: Point;
  variant: CellVariant;
  kind: CellDeathKind;
  expiresAt: number;
}

export interface CellRepairVisual {
  eventKey: string;
  enemyId: number;
  type: EnemyId;
  position: Point;
  expiresAt: number;
}

export const CELL_DEATH_DURATION_MS = 950;
export const CELL_REPAIR_DURATION_MS = 1100;

export function cellVariant(enemyId: number): CellVariant {
  const variant = Math.abs(enemyId) % 4;
  return variant as CellVariant;
}

export function actorAnimationDelay(actorId: number): string {
  const phase = (Math.abs(actorId) % 17) * 0.073;
  return `-${phase.toFixed(3)}s`;
}

export function cellDeathKind(enemy: Enemy): CellDeathKind {
  if (enemy.type === "dividing" || enemy.type === "tumor_mass") {
    return "rupture";
  }
  return enemy.id % 3 === 0 ? "rupture" : "apoptosis";
}

export function findDestroyedEnemies(
  previousEnemies: readonly Enemy[],
  nextEnemies: readonly Enemy[],
  escapedCount: number,
  repairedEnemyIds: readonly number[],
): Enemy[] {
  const nextIds = new Set(nextEnemies.map((enemy) => enemy.id));
  const repairedIds = new Set(repairedEnemyIds);
  const removed = previousEnemies.filter(
    (enemy) => !nextIds.has(enemy.id) && !repairedIds.has(enemy.id),
  );
  if (escapedCount <= 0) {
    return removed;
  }

  // Escaped cells are the removed actors furthest along the route. Exclude
  // those exits so the blood-vessel boundary never emits a death animation.
  const progressSorted = [...removed].sort(
    (first, second) => second.pathDistance - first.pathDistance,
  );
  const escapedIds = new Set(
    progressSorted.slice(0, Math.min(escapedCount, progressSorted.length)).map((enemy) => enemy.id),
  );
  const destroyed = removed.filter((enemy) => !escapedIds.has(enemy.id));
  return destroyed;
}

export function createCellRepairVisual(
  event: CellRepairEvent,
  level: LevelId,
  startedAt: number,
): CellRepairVisual {
  return {
    eventKey: `${event.towerId}-${event.attempt}`,
    enemyId: event.enemyId,
    type: event.type,
    position: getEnemyVisualPosition(event.enemyId, event.pathDistance, level, event.routeId),
    expiresAt: startedAt + CELL_REPAIR_DURATION_MS,
  };
}

export function createCellDeathVisual(
  enemy: Enemy,
  level: LevelId,
  startedAt: number,
): CellDeathVisual {
  const visual: CellDeathVisual = {
    enemyId: enemy.id,
    type: enemy.type,
    position: getEnemyVisualPosition(enemy.id, enemy.pathDistance, level, enemy.routeId),
    variant: cellVariant(enemy.id),
    kind: cellDeathKind(enemy),
    expiresAt: startedAt + CELL_DEATH_DURATION_MS,
  };
  return visual;
}
