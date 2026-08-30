import {
  For,
  Index,
  Show,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
} from "solid-js";
import type { JSX } from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import { DIFFICULTIES, ENEMIES, PLAYFIELD_HEIGHT, PLAYFIELD_WIDTH, TOWERS } from "./config";
import { UPGRADE_PATHS } from "./upgrade_paths";
import type { DifficultyId, Enemy, GameState, Point, Tower, TowerId } from "./game_types";
import { TOWER_IDS } from "./tower_ids";
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
import { TowerInspector } from "./tower_inspector";
import { WorldLandmarks } from "./world_landmarks";
import { getCampaignLevel, getLevelWaves } from "./levels/campaign";
import {
  advanceLevel,
  canPlaceTower,
  canStartWave,
  createGameState,
  getNextLevel,
  placeTower,
  sellTower,
  startWave,
  tickGame,
  togglePause,
  upgradeTower,
} from "./simulation";

const DIFFICULTY_IDS: readonly DifficultyId[] = ["practice", "standard", "challenge"];
const MAP_WIDTH = PLAYFIELD_WIDTH;
const MAP_HEIGHT = PLAYFIELD_HEIGHT;

interface UiState {
  selectedTreatment?: TowerId;
  selectedTowerId?: number;
  selectedEnemyId?: number;
  settingsOpen: boolean;
  signatureConfirmTowerId?: number;
  signatureBanner?: string;
  signatureCelebration?: number;
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
  const level = createMemo(() => getCampaignLevel(game().level));
  const levelWaveLimit = createMemo<number>(() => getLevelWaves(game().level).length);
  const microenvironmentLandmarks = createMemo(() =>
    level()
      .landmarks.filter((landmark) => landmark.kind !== "source" && landmark.kind !== "exit")
      .slice(0, 3),
  );
  const mapLabel = createMemo<string>(() =>
    game().level === 1
      ? "Skin tissue route from the primary tumor to a blood vessel exit"
      : `${level().title} campaign map`,
  );

  function resetGame(difficulty: DifficultyId): void {
    setGame(createGameState(difficulty));
    setCellDeaths([]);
    setCellRepairs([]);
    setUi({ selectedTreatment: undefined, selectedTowerId: undefined, selectedEnemyId: undefined });
  }

  function beginWave(): void {
    setGame((current) => startWave(current));
    setUi({ selectedTowerId: undefined, selectedEnemyId: undefined });
    if (soundEnabled()) {
      activateAudio();
      playUiSound("wave");
    }
  }

  function advanceCampaignLevel(): void {
    // The pure simulation is the authority for sequential campaign eligibility.
    setGame((current) => advanceLevel(current));
    setCellDeaths([]);
    setCellRepairs([]);
    setUi({ selectedTreatment: undefined, selectedTowerId: undefined, selectedEnemyId: undefined });
    if (soundEnabled()) {
      activateAudio();
      playUiSound("wave");
    }
  }

  function nextLevelMessage(): string {
    const nextLevelId = getNextLevel(game().level);
    const nextLevel = getCampaignLevel(nextLevelId);
    return `Prepare for Level ${nextLevelId}: ${nextLevel.title}. ${nextLevel.briefing}`;
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
    // The simulation revalidates this untrusted pointer position before committing a tower.
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
    const activeElement = document.activeElement;
    if (activeElement instanceof SVGElement && activeElement.hasAttribute("data-scene-object")) {
      activeElement.blur();
    }
    const position = positionFromEvent(event);
    setUi("cursor", position);
    commitPlacement(position);
  }

  function pickTower(tower: Tower): void {
    setUi({
      selectedTowerId: tower.id,
      selectedTreatment: undefined,
      selectedEnemyId: undefined,
      signatureConfirmTowerId: undefined,
    });
  }

  function pickEnemy(event: MouseEvent, enemy: Enemy): void {
    event.stopPropagation();
    setUi({
      selectedEnemyId: enemy.id,
      selectedTowerId: undefined,
      selectedTreatment: undefined,
      signatureConfirmTowerId: undefined,
    });
  }

  function improveTower(): void {
    const tower = selectedTower();
    if (tower !== undefined) {
      setGame((current) => upgradeTower(current, tower.id));
      if (soundEnabled()) {
        activateAudio();
        playUiSound("upgrade");
      }
    }
  }

  function requestSignatureUnlock(): void {
    const tower = selectedTower();
    if (tower !== undefined) setUi("signatureConfirmTowerId", tower.id);
  }

  function cancelSignatureUnlock(): void {
    setUi("signatureConfirmTowerId", undefined);
  }

  function confirmSignatureUnlock(): void {
    const tower = selectedTower();
    if (tower === undefined) return;
    const signature = UPGRADE_PATHS[tower.type][2];
    const beforeTier = tower.tier;
    setGame((current) => upgradeTower(current, tower.id));
    if (beforeTier === 2) {
      const signatureCelebration = Date.now();
      setUi({
        signatureConfirmTowerId: undefined,
        signatureBanner: signature.signatureName,
        signatureCelebration,
      });
      window.setTimeout(() => {
        if (ui.signatureCelebration === signatureCelebration)
          setUi("signatureCelebration", undefined);
      }, 1200);
      if (soundEnabled()) {
        activateAudio();
        playUiSound("signature");
      }
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
      if (ui.signatureConfirmTowerId !== undefined) cancelSignatureUnlock();
      else cancelPlacement();
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
      createCellDeathVisual(enemy, previous.level, currentTime),
    );
    const previousRepairKeys = new Set(
      previous.repairEvents.map((event) => `${event.towerId}-${event.attempt}`),
    );
    const addedRepairs = next.repairEvents
      .filter((event) => !previousRepairKeys.has(`${event.towerId}-${event.attempt}`))
      .map((event) => createCellRepairVisual(event, previous.level, currentTime));
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
          <span class="hud-level" data-level={game().level}>
            <b>Level</b> {game().level} of 10: {level().title}
          </span>
          <span>
            <b>Wave</b> {game().wave}/{levelWaveLimit()}
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

      <section class="campaign-context" aria-label="Campaign map context">
        <div>
          <div class="campaign-hud">
            <strong>
              Level {game().level} of 10: {level().title}
            </strong>
            <small>
              {level().routes.length} route{level().routes.length === 1 ? "" : "s"} through this
              field
            </small>
          </div>
          <p class="campaign-briefing">{level().briefing}</p>
        </div>
        <aside class="microenvironment-context" aria-label="Map microenvironment">
          <div class="microenvironment-heading">
            <span>Map microenvironment</span>
            <small>Game model</small>
          </div>
          <p>{level().accessibleDescription}</p>
          <Show when={microenvironmentLandmarks().length > 0}>
            <p class="microenvironment-landmarks">
              <b>Key sites:</b>{" "}
              <For each={microenvironmentLandmarks()}>
                {(landmark, index) => (
                  <>
                    {index() > 0 ? " · " : ""}
                    {landmark.label}
                  </>
                )}
              </For>
            </p>
          </Show>
        </aside>
      </section>

      <section class="battle-area" aria-label={`${level().title} battlefield`}>
        <span id="campaign-map-description" class="campaign-map-copy">
          {level().accessibleDescription} Point to, tap, or use Tab to focus named scene objects and
          read their learning tooltips.
        </span>
        <svg
          ref={(element) => {
            mapElement = element;
          }}
          class="playfield"
          classList={{ "placement-active": ui.selectedTreatment !== undefined }}
          data-level-theme={level().theme}
          viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          preserveAspectRatio="none"
          role="group"
          aria-label={mapLabel()}
          aria-describedby="campaign-map-description"
          onPointerMove={updateCursor}
          onPointerDown={mapPointerDown}
        >
          <WorldLandmarks level={game().level} interactive />
          <Index each={game().towers}>
            {(tower) => (
              <TowerActor
                tower={tower()}
                time={game().time}
                selected={ui.selectedTowerId === tower().id}
                onPick={pickTower}
              />
            )}
          </Index>
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
                level={game().level}
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
        <p class="scene-learning-hint" aria-hidden="true">
          <span>i</span> Point, tap, or Tab to explore objects
        </p>
        <Show
          when={
            game().status === "intermission" || game().status === "won" || game().status === "lost"
          }
        >
          <div class="terminal-overlay" role="alert">
            <h2>
              {game().status === "intermission"
                ? `LEVEL ${game().level} CONTAINED`
                : game().status === "won"
                  ? "CANCER CONTAINED"
                  : "CANCER HAS METASTASIZED"}
            </h2>
            <p>
              {game().status === "intermission"
                ? nextLevelMessage()
                : game().status === "won"
                  ? "All ten campaign levels are contained."
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
              <button type="button" onClick={advanceCampaignLevel}>
                Continue to Level {game().level + 1}
              </button>
            </Show>
          </div>
        </Show>
      </section>

      <section class="controls-panel">
        <div class="treatment-tray" aria-label="Treatment tray">
          <p class="tray-label">Place a treatment</p>
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
      </section>

      <Show when={selectedTower()}>
        {(tower) => (
          <TowerInspector
            tower={tower()}
            treatmentPoints={game().tp}
            signatureConfirmation={ui.signatureConfirmTowerId === tower().id}
            onUpgrade={improveTower}
            onRequestSignature={requestSignatureUnlock}
            onConfirmSignature={confirmSignatureUnlock}
            onCancelSignature={cancelSignatureUnlock}
            onSell={removeTower}
          />
        )}
      </Show>
      <Show when={ui.signatureBanner}>
        <div class="signature-banner" role="status">
          Signature unlocked: {ui.signatureBanner}
        </div>
      </Show>
      <Show when={ui.signatureCelebration}>
        {(celebration) => (
          <div
            class="signature-confetti"
            data-signature-confetti={celebration()}
            aria-hidden="true"
          >
            <For each={[0, 1, 2, 3, 4, 5, 6, 7]}>{(piece) => <i data-piece={piece} />}</For>
          </div>
        )}
      </Show>

      <Show when={selectedEnemy()}>
        {(enemy) => (
          <aside class="target-context" aria-label="Selected cancer cell">
            <p class="inspector-kicker">Selected cancer cell</p>
            <h2>{ENEMIES[enemy().type].name}</h2>
            <p>{ENEMIES[enemy().type].description}</p>
          </aside>
        )}
      </Show>
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
