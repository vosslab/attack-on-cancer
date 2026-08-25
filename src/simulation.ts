import {
  CHALLENGE_WAVE_MULTIPLIER,
  CLUSTER_SCENE_BUILD_GRANT,
  DIFFICULTIES,
  ENEMIES,
  getScenePath,
  PLAYFIELD_HEIGHT,
  PLAYFIELD_WIDTH,
  SCENE_ONE_WAVE_COUNT,
  SELL_REFUND_RATE,
  TOWERS,
  UPGRADES,
  WAVES,
} from "./config";
import type {
  CellRepairEvent,
  DifficultyId,
  Enemy,
  EnemyId,
  GameState,
  Point,
  SceneId,
  Tower,
  TowerConfig,
  TowerId,
} from "./game_types";

const TOWER_OVERLAP_RADIUS = 42;
const PATH_CLEARANCE = 34;
const MARK_DAMAGE_MULTIPLIER = 1.35;
const ENEMY_VISUAL_TANGENT_SAMPLE = 8;
const ENEMY_VISUAL_LANE_JITTER = 3;
const ENEMY_VISUAL_TRAVEL_JITTER = 2.5;

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

export function getPathLength(scene: SceneId = 1): number {
  const path = getScenePath(scene);
  let total = 0;
  for (let index = 0; index < path.length - 1; index += 1) {
    const start = path[index];
    const end = path[index + 1];
    if (start !== undefined && end !== undefined) {
      total += distanceBetween(start, end);
    }
  }
  return total;
}

export function getPathPosition(pathDistance: number, scene: SceneId = 1): Point {
  const path = getScenePath(scene);
  const limitedDistance = clamp(pathDistance, 0, getPathLength(scene));
  let traversed = 0;
  for (let index = 0; index < path.length - 1; index += 1) {
    const start = path[index];
    const end = path[index + 1];
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

  const exit = path[path.length - 1];
  if (exit === undefined) {
    throw new Error("The path needs an exit point.");
  }
  return { x: exit.x, y: exit.y };
}

function getEnemyVisualNoise(enemyId: number, salt: number): number {
  const seed = Math.abs(enemyId) + salt;
  let scrambled = Math.imul(seed ^ (seed >>> 16), 0x45d9f3b);
  scrambled = Math.imul(scrambled ^ (scrambled >>> 16), 0x45d9f3b);
  const normalized = (scrambled >>> 0) / 0xffffffff;
  return normalized * 2 - 1;
}

function getEnemyVisualLane(enemyId: number): number {
  let lane: number;
  switch (Math.abs(enemyId) % 7) {
    case 0:
      lane = 0;
      break;
    case 1:
      lane = 27;
      break;
    case 2:
      lane = -9;
      break;
    case 3:
      lane = 18;
      break;
    case 4:
      lane = -18;
      break;
    case 5:
      lane = 9;
      break;
    default:
      lane = -27;
  }
  return lane + getEnemyVisualNoise(enemyId, 31) * ENEMY_VISUAL_LANE_JITTER;
}

export function getEnemyVisualPosition(
  enemyId: number,
  pathDistance: number,
  scene: SceneId = 1,
): Point {
  const center = getPathPosition(pathDistance, scene);
  const before = getPathPosition(pathDistance - ENEMY_VISUAL_TANGENT_SAMPLE, scene);
  const after = getPathPosition(pathDistance + ENEMY_VISUAL_TANGENT_SAMPLE, scene);
  const horizontal = after.x - before.x;
  const vertical = after.y - before.y;
  const tangentLength = Math.hypot(horizontal, vertical);
  if (tangentLength === 0) {
    throw new Error("The enemy visual lane needs a non-zero route tangent.");
  }
  const lane = getEnemyVisualLane(enemyId);
  const travel = getEnemyVisualNoise(enemyId, 67) * ENEMY_VISUAL_TRAVEL_JITTER;
  const position = {
    x: center.x + (horizontal / tangentLength) * travel + (-vertical / tangentLength) * lane,
    y: center.y + (vertical / tangentLength) * travel + (horizontal / tangentLength) * lane,
  };
  return position;
}

export function isPathClear(position: Point, scene: SceneId = 1): boolean {
  const path = getScenePath(scene);
  for (let index = 0; index < path.length - 1; index += 1) {
    const start = path[index];
    const end = path[index + 1];
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
    scene: 1,
    difficulty,
    tp: DIFFICULTIES[difficulty].startingTp,
    metastases: 0,
    wave: 0,
    enemies: [],
    towers: [],
    nextEnemyId: 1,
    nextTowerId: 1,
    pendingSpawns: [],
    repairEvents: [],
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
  if (!isInPlayfield(position) || !isPathClear(position, state.scene)) {
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
    state.status !== "intermission" &&
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
    repairMisses: type === "crispr" ? 0 : undefined,
    attackSequence: type === "crispr" ? 0 : undefined,
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
  const refund = Math.floor(totalSpent * SELL_REFUND_RATE);
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
  const sceneWaveLimit = state.scene === 1 ? SCENE_ONE_WAVE_COUNT : WAVES.length;
  const noActiveCells = state.enemies.length === 0 && state.pendingSpawns.length === 0;
  const canStart =
    state.status !== "paused" &&
    state.status !== "lost" &&
    state.status !== "won" &&
    state.status !== "intermission" &&
    state.wave < sceneWaveLimit &&
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

export function startClusterScene(state: GameState): GameState {
  if (state.status !== "intermission" || state.scene !== 1) {
    return state;
  }
  return {
    ...state,
    status: "briefing",
    scene: 2,
    tp: state.tp + CLUSTER_SCENE_BUILD_GRANT,
    towers: [],
    enemies: [],
    pendingSpawns: [],
    repairEvents: [],
    nextTowerId: 1,
  };
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

export function getRepairChance(tower: Tower): number {
  const config = getTowerConfig(tower);
  const chances = config.repairChanceByTier;
  const pityStep = config.repairPityStep;
  const guaranteeAfter = config.repairGuaranteeAfterMisses;
  if (
    tower.type !== "crispr" ||
    chances === undefined ||
    pityStep === undefined ||
    guaranteeAfter === undefined
  ) {
    throw new Error("The CRISPR Repair Editor requires complete repair-chance configuration.");
  }
  if (!Number.isInteger(tower.tier) || tower.tier < 0 || tower.tier >= chances.length) {
    throw new Error(`CRISPR tier must be 0-${chances.length - 1}, received ${tower.tier}.`);
  }
  const misses = Math.max(0, tower.repairMisses ?? 0);
  if (misses >= guaranteeAfter) {
    return 1;
  }
  const tierChance = chances[tower.tier];
  if (tierChance === undefined) {
    throw new Error(`CRISPR tier ${tower.tier} has no repair chance.`);
  }
  return Math.min(1, tierChance + misses * pityStep);
}

function getRepairRoll(tower: Tower, target: Enemy): number {
  const attempt = tower.attackSequence ?? 0;
  let seed = Math.imul(tower.id + 1, 0x9e3779b1);
  seed ^= Math.imul(target.id + 1, 0x85ebca77);
  seed ^= Math.imul(attempt + 1, 0xc2b2ae3d);
  seed = Math.imul(seed ^ (seed >>> 16), 0x7feb352d);
  seed = Math.imul(seed ^ (seed >>> 15), 0x846ca68b);
  const normalized = ((seed ^ (seed >>> 16)) >>> 0) / 0x100000000;
  return normalized;
}

function isMarked(enemy: Enemy, time: number): boolean {
  const marked = enemy.markedUntil > time;
  return marked;
}

function getTarget(tower: Tower, enemies: readonly Enemy[], scene: SceneId): Enemy | undefined {
  const range = getTowerRange(tower);
  const inRange = enemies.filter(
    (enemy) => distanceBetween(tower.position, getPathPosition(enemy.pathDistance, scene)) <= range,
  );
  const ordinaryTargets = inRange.filter((enemy) => enemy.type !== "tumor_mass");
  const targetPool =
    tower.type === "crispr" && ordinaryTargets.length > 0 ? ordinaryTargets : inRange;
  let selected: Enemy | undefined;
  for (const enemy of targetPool) {
    if (
      selected === undefined ||
      enemy.pathDistance > selected.pathDistance ||
      (enemy.pathDistance === selected.pathDistance && enemy.id < selected.id)
    ) {
      selected = enemy;
    }
  }
  return selected;
}

function applyDamage(enemy: Enemy, source: TowerId, baseDamage: number, time: number): Enemy {
  const marked = isMarked(enemy, time);
  const markedDamageMultiplier = TOWERS[source].markedDamageMultiplier ?? MARK_DAMAGE_MULTIPLIER;
  let damage = marked ? baseDamage * markedDamageMultiplier : baseDamage;
  if (source === "t_cell" && enemy.type === "immune_evasive" && !marked) {
    damage *= 0.5;
  }
  const damagedEnemy: Enemy = { ...enemy, health: enemy.health - damage };
  return damagedEnemy;
}

interface TowerFireResult {
  enemies: Enemy[];
  tower: Tower;
  reward: number;
  repairEvent?: CellRepairEvent;
}

function fireCrispr(tower: Tower, target: Enemy, enemies: readonly Enemy[]): TowerFireResult {
  const config = getTowerConfig(tower);
  const attempt = tower.attackSequence ?? 0;
  const successful = getRepairRoll(tower, target) < getRepairChance(tower);
  const attemptedTower: Tower = { ...tower, attackSequence: attempt + 1 };
  if (!successful) {
    return {
      enemies: [...enemies],
      tower: {
        ...attemptedTower,
        attackOutcome: "mismatch",
        repairMisses: (tower.repairMisses ?? 0) + 1,
      },
      reward: 0,
    };
  }

  if (target.type === "tumor_mass") {
    const tumorEditDamage = config.tumorEditDamage;
    const tumorShedDelay = config.tumorShedDelay;
    if (tumorEditDamage === undefined || tumorShedDelay === undefined) {
      throw new Error("CRISPR Tumor Mass editing requires damage and shedding-delay values.");
    }
    const editedTarget: Enemy = {
      ...target,
      health: target.health - tumorEditDamage,
      nextShedDistance: (target.nextShedDistance ?? target.pathDistance + 105) + tumorShedDelay,
    };
    return {
      enemies: enemies.map((enemy) => (enemy.id === target.id ? editedTarget : enemy)),
      tower: { ...attemptedTower, attackOutcome: "tumor_suppressed", repairMisses: 0 },
      reward: 0,
    };
  }

  return {
    enemies: enemies.filter((enemy) => enemy.id !== target.id),
    tower: { ...attemptedTower, attackOutcome: "repair", repairMisses: 0 },
    reward: ENEMIES[target.type].reward,
    repairEvent: {
      towerId: tower.id,
      attempt,
      enemyId: target.id,
      type: target.type,
      pathDistance: target.pathDistance,
    },
  };
}

function fireTower(
  tower: Tower,
  target: Enemy,
  enemies: readonly Enemy[],
  time: number,
  scene: SceneId,
): TowerFireResult {
  if (tower.type === "crispr") {
    return fireCrispr(tower, target, enemies);
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
    return { enemies: result, tower, reward: 0 };
  }

  const targetPosition = getPathPosition(target.pathDistance, scene);
  const damagedEnemies = enemies.map((enemy) => {
    if (enemy.id === target.id) {
      return firstHit;
    }
    const enemyPosition = getPathPosition(enemy.pathDistance, scene);
    const insideSplash = distanceBetween(targetPosition, enemyPosition) <= splashRadius;
    return insideSplash ? applyDamage(enemy, tower.type, getTowerDamage(tower), time) : enemy;
  });
  return { enemies: damagedEnemies, tower, reward: 0 };
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
  const pathLength = getPathLength(state.scene);
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
  let reward = 0;
  const repairEvents = [...state.repairEvents];
  const towers = state.towers.map((tower) => {
    const cooldownRemaining = Math.max(0, tower.cooldownRemaining - deltaSeconds);
    if (cooldownRemaining > 0) {
      return { ...tower, cooldownRemaining };
    }
    const target = getTarget(tower, enemies, state.scene);
    if (target === undefined) {
      return { ...tower, cooldownRemaining: 0 };
    }
    const result = fireTower(tower, target, enemies, state.time, state.scene);
    enemies = result.enemies;
    reward += result.reward;
    if (result.repairEvent !== undefined) {
      repairEvents.push(result.repairEvent);
    }
    const firedTower: Tower = {
      ...result.tower,
      attackPoint: getEnemyVisualPosition(target.id, target.pathDistance, state.scene),
      attackFlashUntil: state.time + (TOWERS[tower.type].attackVisualDuration ?? 0.22),
      cooldownRemaining: getTowerCooldown(tower),
    };
    return firedTower;
  });
  const nextState: GameState = {
    ...state,
    tp: state.tp + reward,
    enemies,
    towers,
    repairEvents,
  };
  return nextState;
}

function resolveWin(state: GameState): GameState {
  const sceneWaveLimit = state.scene === 1 ? SCENE_ONE_WAVE_COUNT : WAVES.length;
  const clearedFinalWave =
    state.wave === sceneWaveLimit && state.enemies.length === 0 && state.pendingSpawns.length === 0;
  if (!clearedFinalWave || state.status === "lost") {
    return state;
  }
  return { ...state, status: state.scene === 1 ? "intermission" : "won" };
}

export function tickGame(state: GameState, deltaSeconds: number): GameState {
  if (state.status !== "playing" || deltaSeconds <= 0) {
    return state;
  }
  const elapsed = deltaSeconds;
  const time = state.time + elapsed;
  let nextState: GameState = { ...state, time, repairEvents: [] };
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
