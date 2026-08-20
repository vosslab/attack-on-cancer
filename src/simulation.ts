import {
  CHALLENGE_WAVE_MULTIPLIER,
  DIFFICULTIES,
  ENEMIES,
  PATH,
  PLAYFIELD_HEIGHT,
  PLAYFIELD_WIDTH,
  TOWERS,
  UPGRADES,
  WAVES,
} from "./config";
import type {
  DifficultyId,
  Enemy,
  EnemyId,
  GameState,
  Point,
  Tower,
  TowerConfig,
  TowerId,
} from "./game_types";

const TOWER_OVERLAP_RADIUS = 42;
const PATH_CLEARANCE = 34;
const MARK_DAMAGE_MULTIPLIER = 1.35;

//============================================
// Path helpers

function distanceBetween(first: Point, second: Point): number {
  const horizontal = second.x - first.x;
  const vertical = second.y - first.y;
  const distance = Math.hypot(horizontal, vertical);
  return distance;
}

function clamp(value: number, lower: number, upper: number): number {
  const clamped = Math.min(Math.max(value, lower), upper);
  return clamped;
}

function pointToSegmentDistance(point: Point, start: Point, end: Point): number {
  const horizontal = end.x - start.x;
  const vertical = end.y - start.y;
  const segmentLengthSquared = horizontal * horizontal + vertical * vertical;
  if (segmentLengthSquared === 0) {
    const distance = distanceBetween(point, start);
    return distance;
  }

  const projected =
    ((point.x - start.x) * horizontal + (point.y - start.y) * vertical) / segmentLengthSquared;
  const fraction = clamp(projected, 0, 1);
  const closest = { x: start.x + horizontal * fraction, y: start.y + vertical * fraction };
  const distance = distanceBetween(point, closest);
  return distance;
}

export function getPathLength(): number {
  let total = 0;
  for (let index = 0; index < PATH.length - 1; index += 1) {
    const start = PATH[index];
    const end = PATH[index + 1];
    if (start !== undefined && end !== undefined) {
      total += distanceBetween(start, end);
    }
  }
  return total;
}

export function getPathPosition(pathDistance: number): Point {
  const limitedDistance = clamp(pathDistance, 0, getPathLength());
  let traversed = 0;
  for (let index = 0; index < PATH.length - 1; index += 1) {
    const start = PATH[index];
    const end = PATH[index + 1];
    if (start === undefined || end === undefined) {
      continue;
    }
    const segmentLength = distanceBetween(start, end);
    if (traversed + segmentLength >= limitedDistance) {
      const fraction = segmentLength === 0 ? 0 : (limitedDistance - traversed) / segmentLength;
      const position = {
        x: start.x + (end.x - start.x) * fraction,
        y: start.y + (end.y - start.y) * fraction,
      };
      return position;
    }
    traversed += segmentLength;
  }

  const exit = PATH[PATH.length - 1];
  if (exit === undefined) {
    throw new Error("The path needs an exit point.");
  }
  return { x: exit.x, y: exit.y };
}

export function isPathClear(position: Point): boolean {
  for (let index = 0; index < PATH.length - 1; index += 1) {
    const start = PATH[index];
    const end = PATH[index + 1];
    if (
      start !== undefined &&
      end !== undefined &&
      pointToSegmentDistance(position, start, end) < PATH_CLEARANCE
    ) {
      return false;
    }
  }
  return true;
}

//============================================
// State setup and player actions

export function createGameState(difficulty: DifficultyId): GameState {
  const state: GameState = {
    status: "briefing",
    difficulty,
    tp: DIFFICULTIES[difficulty].startingTp,
    metastases: 0,
    wave: 0,
    enemies: [],
    towers: [],
    nextEnemyId: 1,
    nextTowerId: 1,
    pendingSpawns: [],
    time: 0,
  };
  return state;
}

function isInPlayfield(position: Point): boolean {
  const isInBounds =
    position.x >= 24 &&
    position.x <= PLAYFIELD_WIDTH - 32 &&
    position.y >= 24 &&
    position.y <= PLAYFIELD_HEIGHT - 32;
  return isInBounds;
}

export function isValidPlacement(state: GameState, position: Point): boolean {
  if (!isInPlayfield(position) || !isPathClear(position)) {
    return false;
  }
  for (const tower of state.towers) {
    if (distanceBetween(position, tower.position) < TOWER_OVERLAP_RADIUS) {
      return false;
    }
  }
  return true;
}

export function canPlaceTower(state: GameState, type: TowerId, position: Point): boolean {
  const canAfford = state.tp >= TOWERS[type].cost;
  const allowed =
    state.status !== "lost" &&
    state.status !== "won" &&
    canAfford &&
    isValidPlacement(state, position);
  return allowed;
}

export function placeTower(state: GameState, type: TowerId, position: Point): GameState {
  if (!canPlaceTower(state, type, position)) {
    return state;
  }
  const newTower: Tower = {
    id: state.nextTowerId,
    type,
    position: { x: position.x, y: position.y },
    tier: 0,
    cooldownRemaining: 0,
  };
  const nextState: GameState = {
    ...state,
    tp: state.tp - TOWERS[type].cost,
    towers: [...state.towers, newTower],
    nextTowerId: state.nextTowerId + 1,
  };
  return nextState;
}

export function getSellValue(tower: Tower): number {
  let totalSpent = TOWERS[tower.type].cost;
  for (let index = 0; index < tower.tier; index += 1) {
    const upgrade = UPGRADES[index];
    if (upgrade !== undefined) {
      totalSpent += upgrade.cost;
    }
  }
  const refund = Math.floor(totalSpent * 0.7);
  return refund;
}

export function sellTower(state: GameState, towerId: number): GameState {
  const tower = state.towers.find((candidate) => candidate.id === towerId);
  if (tower === undefined || state.status === "won" || state.status === "lost") {
    return state;
  }
  const nextState: GameState = {
    ...state,
    tp: state.tp + getSellValue(tower),
    towers: state.towers.filter((candidate) => candidate.id !== towerId),
  };
  return nextState;
}

export function getUpgradeCost(tower: Tower): number | undefined {
  const upgrade = UPGRADES[tower.tier];
  const cost = upgrade?.cost;
  return cost;
}

export function upgradeTower(state: GameState, towerId: number): GameState {
  const towerIndex = state.towers.findIndex((candidate) => candidate.id === towerId);
  const tower = towerIndex === -1 ? undefined : state.towers[towerIndex];
  const cost = tower === undefined ? undefined : getUpgradeCost(tower);
  if (
    tower === undefined ||
    cost === undefined ||
    state.tp < cost ||
    state.status === "won" ||
    state.status === "lost"
  ) {
    return state;
  }
  const upgradedTower: Tower = { ...tower, tier: tower.tier + 1 };
  const nextTowers = state.towers.map((candidate) =>
    candidate.id === towerId ? upgradedTower : candidate,
  );
  const nextState: GameState = { ...state, tp: state.tp - cost, towers: nextTowers };
  return nextState;
}

//============================================
// Wave scheduling

export function canStartWave(state: GameState): boolean {
  const noActiveCells = state.enemies.length === 0 && state.pendingSpawns.length === 0;
  const canStart =
    state.status !== "paused" &&
    state.status !== "lost" &&
    state.status !== "won" &&
    state.wave < WAVES.length &&
    noActiveCells;
  return canStart;
}

function makeWaveSpawns(
  waveIndex: number,
  startTime: number,
  difficulty: DifficultyId,
): Array<{ type: EnemyId; at: number }> {
  const wave = WAVES[waveIndex];
  if (wave === undefined) {
    return [];
  }
  const pendingSpawns: Array<{ type: EnemyId; at: number }> = [];
  let scheduledAt = startTime;
  for (const entry of wave) {
    const multiplier =
      difficulty === "challenge" && entry.type !== "tumor_mass" ? CHALLENGE_WAVE_MULTIPLIER : 1;
    const spawnCount = Math.ceil(entry.count * multiplier);
    for (let count = 0; count < spawnCount; count += 1) {
      pendingSpawns.push({ type: entry.type, at: scheduledAt });
      scheduledAt += entry.gap;
    }
  }
  return pendingSpawns;
}

export function startWave(state: GameState): GameState {
  if (!canStartWave(state)) {
    return state;
  }
  const pendingSpawns = makeWaveSpawns(state.wave, state.time, state.difficulty);
  const nextState: GameState = {
    ...state,
    status: "playing",
    wave: state.wave + 1,
    pendingSpawns,
  };
  return nextState;
}

export function togglePause(state: GameState): GameState {
  if (state.status === "playing") {
    return { ...state, status: "paused" };
  }
  if (state.status === "paused") {
    return { ...state, status: "playing" };
  }
  return state;
}

//============================================
// Combat simulation

function getTowerConfig(tower: Tower): TowerConfig {
  const config = TOWERS[tower.type];
  return config;
}

function getUpgradeMultiplier(
  tower: Tower,
  property: "damageMultiplier" | "cooldownMultiplier",
): number {
  let multiplier = 1;
  for (let index = 0; index < tower.tier; index += 1) {
    const upgrade = UPGRADES[index];
    if (upgrade !== undefined) {
      multiplier *= upgrade[property];
    }
  }
  return multiplier;
}

export function getTowerRange(tower: Tower): number {
  let range = getTowerConfig(tower).range;
  for (let index = 0; index < tower.tier; index += 1) {
    const upgrade = UPGRADES[index];
    if (upgrade !== undefined) {
      range += upgrade.rangeBonus;
    }
  }
  return range;
}

function getTowerDamage(tower: Tower): number {
  const damage = getTowerConfig(tower).damage * getUpgradeMultiplier(tower, "damageMultiplier");
  return damage;
}

function getTowerCooldown(tower: Tower): number {
  const cooldown =
    getTowerConfig(tower).cooldown * getUpgradeMultiplier(tower, "cooldownMultiplier");
  return cooldown;
}

function isMarked(enemy: Enemy, time: number): boolean {
  const marked = enemy.markedUntil > time;
  return marked;
}

function getTarget(tower: Tower, enemies: readonly Enemy[]): Enemy | undefined {
  const range = getTowerRange(tower);
  let selected: Enemy | undefined;
  for (const enemy of enemies) {
    const position = getPathPosition(enemy.pathDistance);
    if (
      distanceBetween(tower.position, position) <= range &&
      (selected === undefined ||
        enemy.pathDistance > selected.pathDistance ||
        (enemy.pathDistance === selected.pathDistance && enemy.id < selected.id))
    ) {
      selected = enemy;
    }
  }
  return selected;
}

function applyDamage(enemy: Enemy, source: TowerId, baseDamage: number, time: number): Enemy {
  const marked = isMarked(enemy, time);
  let damage = marked ? baseDamage * MARK_DAMAGE_MULTIPLIER : baseDamage;
  if (source === "t_cell" && enemy.type === "immune_evasive" && !marked) {
    damage *= 0.5;
  }
  const damagedEnemy: Enemy = { ...enemy, health: enemy.health - damage };
  return damagedEnemy;
}

function fireTower(tower: Tower, enemies: readonly Enemy[], time: number): Enemy[] {
  const target = getTarget(tower, enemies);
  if (target === undefined) {
    return [...enemies];
  }

  const config = getTowerConfig(tower);
  const markedUntil =
    config.markDuration === undefined
      ? target.markedUntil
      : Math.max(target.markedUntil, time + config.markDuration);
  const firstHit = applyDamage({ ...target, markedUntil }, tower.type, getTowerDamage(tower), time);
  const splashRadius = config.splashRadius;
  if (splashRadius === undefined) {
    const result = enemies.map((enemy) => (enemy.id === target.id ? firstHit : enemy));
    return result;
  }

  const targetPosition = getPathPosition(target.pathDistance);
  const damagedEnemies = enemies.map((enemy) => {
    if (enemy.id === target.id) {
      return firstHit;
    }
    const enemyPosition = getPathPosition(enemy.pathDistance);
    const insideSplash = distanceBetween(targetPosition, enemyPosition) <= splashRadius;
    return insideSplash ? applyDamage(enemy, tower.type, getTowerDamage(tower), time) : enemy;
  });
  return damagedEnemies;
}

function spawnReadyEnemies(state: GameState, time: number): GameState {
  const readySpawns = state.pendingSpawns.filter((spawn) => spawn.at <= time);
  const pendingSpawns = state.pendingSpawns.filter((spawn) => spawn.at > time);
  if (readySpawns.length === 0) {
    return { ...state, pendingSpawns };
  }
  let nextEnemyId = state.nextEnemyId;
  const spawnedEnemies = readySpawns.map((spawn) => {
    const enemy: Enemy = {
      id: nextEnemyId,
      type: spawn.type,
      health: ENEMIES[spawn.type].health,
      pathDistance: 0,
      markedUntil: 0,
      nextShedDistance: spawn.type === "tumor_mass" ? 105 : undefined,
    };
    nextEnemyId += 1;
    return enemy;
  });
  return {
    ...state,
    enemies: [...state.enemies, ...spawnedEnemies],
    pendingSpawns,
    nextEnemyId,
  };
}

function moveEnemies(enemies: readonly Enemy[], deltaSeconds: number, time: number): Enemy[] {
  const movedEnemies = enemies.map((enemy) => {
    const config = ENEMIES[enemy.type];
    const speedMultiplier = isMarked(enemy, time) ? (TOWERS.antibody.slowFactor ?? 1) : 1;
    const movedEnemy: Enemy = {
      ...enemy,
      pathDistance: enemy.pathDistance + config.speed * speedMultiplier * deltaSeconds,
    };
    return movedEnemy;
  });
  return movedEnemies;
}

function shedTumorMassCells(state: GameState): GameState {
  let nextEnemyId = state.nextEnemyId;
  const shedCells: Enemy[] = [];
  const enemies = state.enemies.map((enemy) => {
    if (enemy.type !== "tumor_mass" || enemy.health <= 0) return enemy;
    const nextShedDistance = enemy.nextShedDistance ?? 105;
    if (enemy.pathDistance < nextShedDistance) return enemy;
    shedCells.push({
      id: nextEnemyId,
      type: "basic",
      health: ENEMIES.basic.health,
      pathDistance: Math.max(0, enemy.pathDistance - 18),
      markedUntil: 0,
    });
    nextEnemyId += 1;
    return {
      ...enemy,
      health: enemy.health - 42,
      nextShedDistance: nextShedDistance + 105,
    };
  });
  return shedCells.length === 0
    ? state
    : { ...state, enemies: [...enemies, ...shedCells], nextEnemyId };
}

function removeEscapedEnemies(state: GameState): GameState {
  const pathLength = getPathLength();
  const escaped = state.enemies.filter((enemy) => enemy.pathDistance >= pathLength);
  if (escaped.length === 0) {
    return state;
  }
  const survivors = state.enemies.filter((enemy) => enemy.pathDistance < pathLength);
  const metastases = state.metastases + escaped.length;
  const capacity = DIFFICULTIES[state.difficulty].metastasisCapacity;
  const status = metastases >= capacity ? "lost" : state.status;
  return { ...state, enemies: survivors, metastases, status };
}

function resolveDestroyedEnemies(state: GameState): GameState {
  const destroyed = state.enemies.filter((enemy) => enemy.health <= 0);
  if (destroyed.length === 0) {
    return state;
  }
  let nextEnemyId = state.nextEnemyId;
  let rewards = 0;
  const children: Enemy[] = [];
  for (const enemy of destroyed) {
    rewards += ENEMIES[enemy.type].reward;
    if (enemy.type === "dividing") {
      for (let index = 0; index < 2; index += 1) {
        children.push({
          id: nextEnemyId,
          type: "basic",
          health: ENEMIES.basic.health,
          pathDistance: enemy.pathDistance,
          markedUntil: 0,
        });
        nextEnemyId += 1;
      }
    }
    if (enemy.type === "tumor_mass") {
      const fragments: readonly EnemyId[] = [
        "basic",
        "basic",
        "basic",
        "basic",
        "basic",
        "basic",
        "tough",
        "tough",
        "tough",
        "tough",
      ];
      for (const type of fragments) {
        children.push({
          id: nextEnemyId,
          type,
          health: ENEMIES[type].health,
          pathDistance: enemy.pathDistance,
          markedUntil: 0,
        });
        nextEnemyId += 1;
      }
    }
  }
  const survivors = state.enemies.filter((enemy) => enemy.health > 0);
  return {
    ...state,
    tp: state.tp + rewards,
    enemies: [...survivors, ...children],
    nextEnemyId,
  };
}

function attackWithReadyTowers(state: GameState, deltaSeconds: number): GameState {
  let enemies = state.enemies;
  const towers = state.towers.map((tower) => {
    const cooldownRemaining = Math.max(0, tower.cooldownRemaining - deltaSeconds);
    if (cooldownRemaining > 0) {
      return { ...tower, cooldownRemaining };
    }
    const target = getTarget(tower, enemies);
    if (target === undefined) {
      return { ...tower, cooldownRemaining: 0 };
    }
    enemies = fireTower(tower, enemies, state.time);
    const firedTower: Tower = {
      ...tower,
      attackPoint: getPathPosition(target.pathDistance),
      attackFlashUntil: state.time + 0.22,
      cooldownRemaining: getTowerCooldown(tower),
    };
    return firedTower;
  });
  const nextState: GameState = { ...state, enemies, towers };
  return nextState;
}

function resolveWin(state: GameState): GameState {
  const clearedFinalWave =
    state.wave === WAVES.length && state.enemies.length === 0 && state.pendingSpawns.length === 0;
  if (!clearedFinalWave || state.status === "lost") {
    return state;
  }
  return { ...state, status: "won" };
}

export function tickGame(state: GameState, deltaSeconds: number): GameState {
  if (state.status !== "playing" || deltaSeconds <= 0) {
    return state;
  }
  const elapsed = deltaSeconds;
  const time = state.time + elapsed;
  let nextState: GameState = { ...state, time };
  nextState = spawnReadyEnemies(nextState, time);
  nextState = { ...nextState, enemies: moveEnemies(nextState.enemies, elapsed, time) };
  nextState = shedTumorMassCells(nextState);
  nextState = removeEscapedEnemies(nextState);
  if (nextState.status === "lost") {
    return nextState;
  }
  nextState = attackWithReadyTowers(nextState, elapsed);
  nextState = resolveDestroyedEnemies(nextState);
  nextState = resolveWin(nextState);
  return nextState;
}
