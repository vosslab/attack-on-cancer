import type { Enemy, EnemyId, Point, SceneId } from "./game_types";
import { getPathPosition } from "./simulation";

export type CellVariant = 0 | 1 | 2 | 3;
export type CellDeathKind = "apoptosis" | "rupture";

export interface CellDeathVisual {
  enemyId: number;
  type: EnemyId;
  position: Point;
  variant: CellVariant;
  kind: CellDeathKind;
  expiresAt: number;
}

export const CELL_DEATH_DURATION_MS = 950;

export function cellVariant(enemyId: number): CellVariant {
  const variant = Math.abs(enemyId) % 4;
  return variant as CellVariant;
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
): Enemy[] {
  const nextIds = new Set(nextEnemies.map((enemy) => enemy.id));
  const removed = previousEnemies.filter((enemy) => !nextIds.has(enemy.id));
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

export function createCellDeathVisual(
  enemy: Enemy,
  scene: SceneId,
  startedAt: number,
): CellDeathVisual {
  const visual: CellDeathVisual = {
    enemyId: enemy.id,
    type: enemy.type,
    position: getPathPosition(enemy.pathDistance, scene),
    variant: cellVariant(enemy.id),
    kind: cellDeathKind(enemy),
    expiresAt: startedAt + CELL_DEATH_DURATION_MS,
  };
  return visual;
}
