import { For, Show, createEffect, createMemo, createSignal, onCleanup, onMount } from "solid-js";
import type { JSX } from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import {
  DIFFICULTIES,
  ENEMIES,
  PLAYFIELD_HEIGHT,
  PLAYFIELD_WIDTH,
  SCENE_ONE_WAVE_COUNT,
  TOWERS,
  UPGRADES,
  WAVES,
} from "./config";
import type { DifficultyId, Enemy, GameState, Point, Tower, TowerId } from "./game_types";
import { activateAudio, playTreatmentSound, playUiSound } from "./audio";
import { AttackEffect } from "./attack_effect";
import { CellDeathEffect, CellRepairEffect, EnemyActor } from "./enemy_actor";
import type { CellDeathVisual, CellRepairVisual } from "./enemy_visuals";
import {
  createCellDeathVisual,
  createCellRepairVisual,
  findDestroyedEnemies,
} from "./enemy_visuals";
import { loadSettings, recordBestResult, updateSettings } from "./persistence";
import { TowerActor, TowerPlacementGhost } from "./tower_actor";
import { WorldLandmarks } from "./world_landmarks";
import {
  canPlaceTower,
  canStartWave,
  createGameState,
  getRepairChance,
  getSellValue,
  getUpgradeCost,
  placeTower,
  sellTower,
  startClusterScene,
  startWave,
  tickGame,
  togglePause,
  upgradeTower,
} from "./simulation";

const TOWER_IDS: readonly TowerId[] = [
  "doctor",
  "chemotherapy",
  "t_cell",
  "radiation",
  "antibody",
  "macrophage",
  "crispr",
];
const DIFFICULTY_IDS: readonly DifficultyId[] = ["practice", "standard", "challenge"];
const MAP_WIDTH = PLAYFIELD_WIDTH;
const MAP_HEIGHT = PLAYFIELD_HEIGHT;

interface UiState {
  selectedTreatment?: TowerId;
  selectedTowerId?: number;
  selectedEnemyId?: number;
  inspectOpen: boolean;
  settingsOpen: boolean;
  cursor: Point;
}

function formatTreatmentName(type: TowerId): string {
  return TOWERS[type].name;
}

function attackCue(type: TowerId): string {
  const cues: Record<TowerId, string> = {
    doctor: "syringe shot",
    chemotherapy: "area burst",
    t_cell: "rapid immune strike",
    radiation: "focused beam",
    antibody: "mark and slow",
    macrophage: "engulf and digest",
    crispr: "repair or mismatch",
  };
  return cues[type];
}

export function App(): JSX.Element {
  const saved = loadSettings();
  const [game, setGame] = createSignal<GameState>(createGameState("practice"));
  const [speed, setSpeed] = createSignal<1 | 2 | 4>(saved.preferredSpeed);
  const [soundEnabled, setSoundEnabled] = createSignal(saved.soundEnabled);
  const [enemyViews, setEnemyViews] = createStore<Enemy[]>([]);
  const [cellDeaths, setCellDeaths] = createSignal<CellDeathVisual[]>([]);
  const [cellRepairs, setCellRepairs] = createSignal<CellRepairVisual[]>([]);
  const [ui, setUi] = createStore<UiState>({
    inspectOpen: false,
    settingsOpen: false,
    cursor: { x: 470, y: 120 },
  });
  let mapElement: SVGSVGElement | undefined;
  let animationFrame = 0;
  let previousFrame = 0;

  const selectedTower = createMemo<Tower | undefined>(() =>
    ui.selectedTowerId === undefined
      ? undefined
      : game().towers.find((tower) => tower.id === ui.selectedTowerId),
  );
  const selectedType = createMemo<TowerId | undefined>(
    () => selectedTower()?.type ?? ui.selectedTreatment,
  );
  const selectedEnemy = createMemo<Enemy | undefined>(() =>
    ui.selectedEnemyId === undefined
      ? undefined
      : game().enemies.find((enemy) => enemy.id === ui.selectedEnemyId),
  );
  const placementValid = createMemo<boolean>(() => {
    const treatment = ui.selectedTreatment;
    return treatment !== undefined && canPlaceTower(game(), treatment, ui.cursor);
  });
  const waveReady = createMemo<boolean>(() => canStartWave(game()));
  const metastasisCapacity = createMemo<number>(
    () => DIFFICULTIES[game().difficulty].metastasisCapacity,
  );
  const pendingCount = createMemo<number>(
    () => game().pendingSpawns.length + game().enemies.length,
  );
  const sceneWaveLimit = createMemo<number>(() =>
    game().scene === 1 ? SCENE_ONE_WAVE_COUNT : WAVES.length,
  );
  const sceneTitle = createMemo<string>(() =>
    game().scene === 1 ? "Skin Tissue" : "Cluster Corridor",
  );

  function resetGame(difficulty: DifficultyId): void {
    setGame(createGameState(difficulty));
    setCellDeaths([]);
    setCellRepairs([]);
    setUi({ selectedTreatment: undefined, selectedTowerId: undefined, selectedEnemyId: undefined });
  }

  function beginWave(): void {
    setGame((current) => startWave(current));
    if (soundEnabled()) {
      activateAudio();
      playUiSound("wave");
    }
  }

  function enterClusterCorridor(): void {
    setGame((current) => startClusterScene(current));
    setCellDeaths([]);
    setCellRepairs([]);
    setUi({ selectedTreatment: undefined, selectedTowerId: undefined, selectedEnemyId: undefined });
    if (soundEnabled()) {
      activateAudio();
      playUiSound("wave");
    }
  }

  function pauseGame(): void {
    setGame((current) => togglePause(current));
  }

  function changeSpeed(nextSpeed: 1 | 2 | 4): void {
    setSpeed(nextSpeed);
    updateSettings({ preferredSpeed: nextSpeed });
  }

  function chooseTreatment(type: TowerId): void {
    setUi({ selectedTreatment: type, selectedTowerId: undefined, selectedEnemyId: undefined });
  }

  function cancelPlacement(): void {
    setUi({ selectedTreatment: undefined });
  }

  function commitPlacement(position: Point): void {
    const treatment = ui.selectedTreatment;
    if (treatment === undefined) {
      return;
    }
    const validPlacement = canPlaceTower(game(), treatment, position);
    setGame((current) => placeTower(current, treatment, position));
    if (validPlacement) {
      setUi({ selectedTreatment: undefined });
      if (soundEnabled()) {
        activateAudio();
        playUiSound("place");
      }
    }
  }

  function positionFromEvent(event: PointerEvent): Point {
    if (mapElement === undefined) {
      return ui.cursor;
    }
    const rectangle = mapElement.getBoundingClientRect();
    const x = ((event.clientX - rectangle.left) * MAP_WIDTH) / rectangle.width;
    const y = ((event.clientY - rectangle.top) * MAP_HEIGHT) / rectangle.height;
    return { x: Math.max(0, Math.min(MAP_WIDTH, x)), y: Math.max(0, Math.min(MAP_HEIGHT, y)) };
  }

  function updateCursor(event: PointerEvent): void {
    if (ui.selectedTreatment !== undefined) {
      setUi("cursor", positionFromEvent(event));
    }
  }

  function mapPointerDown(event: PointerEvent): void {
    const position = positionFromEvent(event);
    setUi("cursor", position);
    commitPlacement(position);
  }

  function pickTower(event: MouseEvent, tower: Tower): void {
    event.stopPropagation();
    setUi({ selectedTowerId: tower.id, selectedTreatment: undefined, selectedEnemyId: undefined });
  }

  function pickEnemy(event: MouseEvent, enemy: Enemy): void {
    event.stopPropagation();
    setUi({ selectedEnemyId: enemy.id, selectedTowerId: undefined, selectedTreatment: undefined });
  }

  function improveTower(): void {
    const tower = selectedTower();
    if (tower !== undefined) {
      setGame((current) => upgradeTower(current, tower.id));
    }
  }

  function removeTower(): void {
    const tower = selectedTower();
    if (tower !== undefined) {
      setGame((current) => sellTower(current, tower.id));
      setUi({ selectedTowerId: undefined });
    }
  }

  function keyboardInput(event: KeyboardEvent): void {
    if (event.key >= "1" && event.key <= "7") {
      const number = Number(event.key);
      const type = TOWER_IDS[number - 1];
      if (type !== undefined) {
        chooseTreatment(type);
      }
      return;
    }
    const movement: Record<string, Point | undefined> = {
      ArrowUp: { x: 0, y: -12 },
      ArrowDown: { x: 0, y: 12 },
      ArrowLeft: { x: -12, y: 0 },
      ArrowRight: { x: 12, y: 0 },
    };
    const step = movement[event.key];
    if (step !== undefined) {
      event.preventDefault();
      setUi("cursor", (cursor) => ({
        x: Math.max(0, Math.min(MAP_WIDTH, cursor.x + step.x)),
        y: Math.max(0, Math.min(MAP_HEIGHT, cursor.y + step.y)),
      }));
      return;
    }
    if (event.key === "Enter") {
      commitPlacement(ui.cursor);
    } else if (event.key === "Escape") {
      cancelPlacement();
    } else if (event.key === " ") {
      event.preventDefault();
      pauseGame();
    } else if (event.key.toLowerCase() === "n") {
      beginWave();
    }
  }

  function setSound(nextValue: boolean): void {
    setSoundEnabled(nextValue);
    updateSettings({ soundEnabled: nextValue });
    if (nextValue) {
      activateAudio();
      playUiSound("place");
    }
  }

  function updateCellTransitions(previous: GameState, next: GameState): void {
    const currentTime = performance.now();
    const currentDeaths = cellDeaths();
    const activeDeaths = currentDeaths.filter((death) => death.expiresAt > currentTime);
    const currentRepairs = cellRepairs();
    const activeRepairs = currentRepairs.filter((repair) => repair.expiresAt > currentTime);
    const escapedCount = Math.max(0, next.metastases - previous.metastases);
    const repairedEnemyIds = next.repairEvents.map((event) => event.enemyId);
    const destroyed = findDestroyedEnemies(
      previous.enemies,
      next.enemies,
      escapedCount,
      repairedEnemyIds,
    );
    const addedDeaths = destroyed.map((enemy) =>
      createCellDeathVisual(enemy, previous.scene, currentTime),
    );
    const previousRepairKeys = new Set(
      previous.repairEvents.map((event) => `${event.towerId}-${event.attempt}`),
    );
    const addedRepairs = next.repairEvents
      .filter((event) => !previousRepairKeys.has(`${event.towerId}-${event.attempt}`))
      .map((event) => createCellRepairVisual(event, previous.scene, currentTime));
    if (activeDeaths.length !== currentDeaths.length || addedDeaths.length > 0) {
      setCellDeaths([...activeDeaths, ...addedDeaths]);
    }
    if (activeRepairs.length !== currentRepairs.length || addedRepairs.length > 0) {
      setCellRepairs([...activeRepairs, ...addedRepairs]);
    }
  }

  function animationLoop(now: number): void {
    if (previousFrame !== 0) {
      const elapsed = (now - previousFrame) / 1000;
      const current = game();
      const next = tickGame(current, elapsed * speed());
      updateCellTransitions(current, next);
      if (soundEnabled()) {
        for (const tower of next.towers) {
          const previous = current.towers.find((candidate) => candidate.id === tower.id);
          if (
            tower.attackFlashUntil !== undefined &&
            tower.attackFlashUntil !== previous?.attackFlashUntil
          ) {
            playTreatmentSound(tower.type);
          }
        }
        if (next.status === "won" && current.status !== "won") playUiSound("win");
        if (next.status === "lost" && current.status !== "lost") playUiSound("loss");
      }
      setGame(next);
    }
    previousFrame = now;
    animationFrame = requestAnimationFrame(animationLoop);
  }

  onMount(() => {
    window.addEventListener("keydown", keyboardInput);
    animationFrame = requestAnimationFrame(animationLoop);
  });
  onCleanup(() => {
    window.removeEventListener("keydown", keyboardInput);
    cancelAnimationFrame(animationFrame);
  });
  createEffect(() => {
    setEnemyViews(reconcile(game().enemies, { key: "id", merge: true }));
  });
  createEffect(() => {
    const current = game();
    if (current.status === "won") {
      recordBestResult(
        current.difficulty,
        DIFFICULTIES[current.difficulty].metastasisCapacity - current.metastases,
      );
    }
  });

  return (
    <main class="game-shell">
      <header class="top-bar">
        <div>
          <p class="eyebrow">Skin tissue defense</p>
          <h1>Attack on Cancer</h1>
        </div>
        <div class="hud" aria-label="Game status">
          <span>
            <b>TP</b> {game().tp}
          </span>
          <span>
            <b>Metastases</b> {game().metastases}/{metastasisCapacity()}
          </span>
          <span>
            <b>Scene</b> {game().scene}: {sceneTitle()}
          </span>
          <span>
            <b>Wave</b> {game().wave}/{sceneWaveLimit()}
          </span>
        </div>
        <button
          class="settings-button"
          type="button"
          onClick={() => setUi("settingsOpen", !ui.settingsOpen)}
        >
          Settings
        </button>
      </header>

      <section class="difficulty-row" aria-label="Difficulty">
        <For each={DIFFICULTY_IDS}>
          {(difficulty) => (
            <button
              type="button"
              classList={{ active: game().difficulty === difficulty }}
              onClick={() => resetGame(difficulty)}
            >
              {DIFFICULTIES[difficulty].label}{" "}
              <small>
                {DIFFICULTIES[difficulty].startingTp} TP /{" "}
                {DIFFICULTIES[difficulty].metastasisCapacity} capacity
              </small>
            </button>
          )}
        </For>
      </section>

      <section class="battle-area" aria-label="Microscopic skin tissue tower defense">
        <svg
          ref={(element) => {
            mapElement = element;
          }}
          class="playfield"
          viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          role="img"
          aria-label="Skin tissue route from the primary tumor to a blood vessel exit"
          onPointerMove={updateCursor}
          onPointerDown={mapPointerDown}
        >
          <WorldLandmarks scene={game().scene} />
          <For each={game().towers}>
            {(tower) => (
              <TowerActor
                tower={tower}
                time={game().time}
                selected={ui.selectedTowerId === tower.id}
                onPick={pickTower}
              />
            )}
          </For>
          <For
            each={game().towers.filter(
              (tower) =>
                tower.attackFlashUntil !== undefined && tower.attackFlashUntil > game().time,
            )}
          >
            {(tower) => <AttackEffect tower={tower} />}
          </For>
          <For each={enemyViews}>
            {(enemy) => (
              <EnemyActor
                enemy={enemy}
                scene={game().scene}
                time={game().time}
                onPick={pickEnemy}
              />
            )}
          </For>
          <For each={cellDeaths()}>{(death) => <CellDeathEffect death={death} />}</For>
          <For each={cellRepairs()}>{(repair) => <CellRepairEffect repair={repair} />}</For>
          <Show when={ui.selectedTreatment}>
            {(treatment) => (
              <TowerPlacementGhost
                type={treatment()}
                position={ui.cursor}
                range={TOWERS[treatment()].range}
                valid={placementValid()}
              />
            )}
          </Show>
        </svg>
        <Show
          when={
            game().status === "intermission" || game().status === "won" || game().status === "lost"
          }
        >
          <div class="terminal-overlay" role="alert">
            <h2>
              {game().status === "intermission"
                ? "SKIN TISSUE CONTAINED"
                : game().status === "won"
                  ? "CANCER CONTAINED"
                  : "CANCER HAS METASTASIZED"}
            </h2>
            <p>
              {game().status === "intermission"
                ? "A multi-tumor cluster is feeding a longer, winding corridor. Rebuild with a 200 TP field grant."
                : game().status === "won"
                  ? "All 21 waves are cleared, including the Cluster Corridor."
                  : "The blood vessel has reached its metastasis capacity."}
            </p>
            <Show
              when={game().status === "intermission"}
              fallback={
                <button type="button" onClick={() => resetGame(game().difficulty)}>
                  New run
                </button>
              }
            >
              <button type="button" onClick={enterClusterCorridor}>
                Enter Cluster Corridor
              </button>
            </Show>
          </div>
        </Show>
      </section>

      <section class="controls-panel">
        <div class="wave-controls">
          <button type="button" disabled={!waveReady()} onClick={beginWave}>
            Start Wave {game().wave + 1}
          </button>
          <button
            type="button"
            disabled={game().status !== "playing" && game().status !== "paused"}
            onClick={pauseGame}
          >
            {game().status === "paused" ? "Resume" : "Pause"}
          </button>
          <button
            type="button"
            classList={{ active: speed() === 1 }}
            onClick={() => changeSpeed(1)}
          >
            1x
          </button>
          <button
            type="button"
            classList={{ active: speed() === 2 }}
            onClick={() => changeSpeed(2)}
          >
            2x
          </button>
          <button
            type="button"
            classList={{ active: speed() === 4 }}
            onClick={() => changeSpeed(4)}
          >
            4x
          </button>
          <span>{pendingCount()} cells in play</span>
        </div>
        <div class="treatment-tray" aria-label="Treatment tray">
          <For each={TOWER_IDS}>
            {(type, index) => (
              <button
                type="button"
                classList={{ active: ui.selectedTreatment === type }}
                onClick={() => chooseTreatment(type)}
              >
                <b>
                  {index() + 1}. {formatTreatmentName(type)}
                </b>
                <span>{TOWERS[type].cost} TP</span>
                <em>{attackCue(type)}</em>
              </button>
            )}
          </For>
        </div>
      </section>

      <Show when={selectedTower()}>
        {(tower) => {
          const upgradeCost = getUpgradeCost(tower());
          return (
            <aside class="tower-card">
              <h2>
                {TOWERS[tower().type].name} - tier {tower().tier + 1}
              </h2>
              <p>{TOWERS[tower().type].description}</p>
              <Show when={tower().type === "crispr"}>
                <p class="repair-status" aria-live="polite">
                  Next repair chance: {Math.round(getRepairChance(tower()) * 100)}% after{" "}
                  {tower().repairMisses ?? 0} sequence mismatches. Seven consecutive mismatches
                  guarantee the next repair.
                </p>
              </Show>
              <button
                type="button"
                disabled={upgradeCost === undefined || game().tp < (upgradeCost ?? 0)}
                onClick={improveTower}
              >
                {upgradeCost === undefined
                  ? "Maximum tier"
                  : `Upgrade: ${UPGRADES[tower().tier]?.name ?? ""} (${upgradeCost} TP)`}
              </button>
              <button type="button" onClick={removeTower}>
                Sell for {getSellValue(tower())} TP
              </button>
            </aside>
          );
        }}
      </Show>

      <section class="inspect">
        <button
          type="button"
          aria-expanded={ui.inspectOpen}
          onClick={() => setUi("inspectOpen", !ui.inspectOpen)}
        >
          Inspect {ui.inspectOpen ? "-" : "+"}
        </button>
        <Show when={ui.inspectOpen}>
          <Show
            when={selectedEnemy()}
            fallback={
              <Show
                when={selectedType()}
                fallback={
                  <p>
                    Choose a treatment, tower, or cancer cell to see its optional biology flavor.
                  </p>
                }
              >
                {(type) => <p>{TOWERS[type()].description}</p>}
              </Show>
            }
          >
            {(enemy) => <p>{ENEMIES[enemy().type].description}</p>}
          </Show>
        </Show>
      </section>
      <Show when={ui.settingsOpen}>
        <aside class="settings-popover">
          <h2>Settings</h2>
          <label>
            <input
              type="checkbox"
              checked={soundEnabled()}
              onInput={(event) => setSound(event.currentTarget.checked)}
            />{" "}
            Sound feedback
          </label>
          <p>Sound starts on. Preferred speed and sound are remembered; runs are not.</p>
        </aside>
      </Show>
      <footer>
        Keys: 1-7 choose treatment, arrows move placement, Enter place, Esc cancel, Space pause, N
        next wave.
      </footer>
    </main>
  );
}
