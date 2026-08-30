import { ENEMIES } from "./config";
import { UPGRADE_PATHS } from "./upgrade_paths";
import type { Enemy, Point, Tower } from "./game_types";

export function hasSignature(tower: Tower): boolean {
  return tower.tier === 3;
}

export function getClonalSurgeMultiplier(tower: Tower, targetId: number): number {
  if (!hasSignature(tower) || tower.type !== "t_cell" || tower.signatureTargetId !== targetId) {
    return 1;
  }
  const stacks = Math.min(tower.signatureCharge ?? 0, 5);
  return 1 + stacks * 0.12;
}

export function advanceClonalSurge(tower: Tower, targetId: number): Tower {
  if (!hasSignature(tower) || tower.type !== "t_cell") return tower;
  const charge =
    tower.signatureTargetId === targetId ? Math.min((tower.signatureCharge ?? 0) + 1, 5) : 1;
  return { ...tower, signatureTargetId: targetId, signatureCharge: charge };
}

export function advanceDoubleTap(tower: Tower): Tower {
  if (!hasSignature(tower) || tower.type !== "doctor") return tower;
  const charge = (tower.signatureCharge ?? 0) + 1;
  return { ...tower, signatureCharge: charge % 3 };
}

export function shouldDoubleTap(tower: Tower): boolean {
  return hasSignature(tower) && tower.type === "doctor" && (tower.signatureCharge ?? 0) === 2;
}

export function getPiercingTarget(target: Enemy, enemies: readonly Enemy[]): Enemy | undefined {
  const sameRoute = enemies
    .filter((enemy) => enemy.id !== target.id && enemy.routeId === target.routeId)
    .filter((enemy) => enemy.pathDistance < target.pathDistance)
    .sort((first, second) => second.pathDistance - first.pathDistance || first.id - second.id);
  return sameRoute[0];
}

export function getBispecificTarget(
  target: Enemy,
  enemies: readonly Enemy[],
  positionFor: (enemy: Enemy) => Point,
): Enemy | undefined {
  const targetPosition = positionFor(target);
  const candidates = enemies
    .filter((enemy) => enemy.id !== target.id && enemy.markedUntil <= target.markedUntil)
    .filter((enemy) => {
      const position = positionFor(enemy);
      return Math.hypot(position.x - targetPosition.x, position.y - targetPosition.y) <= 90;
    })
    .sort((first, second) => first.id - second.id);
  return candidates[0];
}

export function getTrogocytosisRefund(enemy: Enemy): number {
  const refund = Math.floor(ENEMIES[enemy.type].reward * 0.15);
  return refund;
}

export function getRepairGuaranteeAfterMisses(tower: Tower): number {
  const base = 7;
  const signature = UPGRADE_PATHS[tower.type][2];
  return tower.type === "crispr" && hasSignature(tower) && signature.signature === "base_editor"
    ? 4
    : base;
}

export function getTumorEditMultiplier(tower: Tower): number {
  return tower.type === "crispr" && hasSignature(tower) ? 1.5 : 1;
}
