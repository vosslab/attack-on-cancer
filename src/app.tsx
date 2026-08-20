import { For, Show, createEffect, createMemo, createSignal, onCleanup, onMount } from "solid-js";
import type { JSX } from "solid-js";
import { createStore } from "solid-js/store";
import {
  DIFFICULTIES,
  ENEMIES,
  PATH,
  PLAYFIELD_HEIGHT,
  PLAYFIELD_WIDTH,
  TOWERS,
  UPGRADES,
  WAVES,
} from "./config";
import type { DifficultyId, Enemy, GameState, Point, Tower, TowerId } from "./game_types";
import { activateAudio, playTreatmentSound, playUiSound } from "./audio";
import { loadSettings, recordBestResult, updateSettings } from "./persistence";
import {
  canPlaceTower,
  canStartWave,
  createGameState,
  getPathPosition,
  getSellValue,
  getTowerRange,
  getUpgradeCost,
  placeTower,
  sellTower,
  startWave,
  tickGame,
  togglePause,
  upgradeTower,
} from "./simulation";

const TOWER_IDS: readonly TowerId[] = ["doctor", "chemotherapy", "t_cell", "radiation", "antibody"];
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
  };
  return cues[type];
}

function AttackEffect(props: { tower: Tower }): JSX.Element {
  const point = props.tower.attackPoint;
  if (point === undefined) return <g />;
  const { position, type } = props.tower;
  if (type === "doctor") {
    return (
      <g class="attack-effect attack-doctor" pointer-events="none">
        <line x1={position.x} y1={position.y} x2={point.x} y2={point.y} />
        <path
          d={`M ${point.x - 18} ${point.y + 8} L ${point.x + 9} ${point.y - 9} L ${point.x + 15} ${point.y - 3} L ${point.x - 12} ${point.y + 14} Z`}
        />
      </g>
    );
  }
  if (type === "chemotherapy") {
    return (
      <g class="attack-effect attack-chemotherapy" pointer-events="none">
        <circle cx={point.x} cy={point.y} r="13" />
        <circle cx={point.x - 20} cy={point.y + 9} r="9" />
        <circle cx={point.x + 18} cy={point.y - 11} r="10" />
      </g>
    );
  }
  if (type === "t_cell") {
    return (
      <g class="attack-effect attack-t_cell" pointer-events="none">
        <line x1={position.x} y1={position.y} x2={point.x} y2={point.y} />
        <path
          d={`M ${point.x - 16} ${point.y - 13} l 12 13 l -12 13 M ${point.x - 2} ${point.y - 13} l 12 13 l -12 13`}
        />
      </g>
    );
  }
  if (type === "radiation") {
    return (
      <g class="attack-effect attack-radiation" pointer-events="none">
        <line x1={position.x} y1={position.y} x2={point.x} y2={point.y} />
        <line class="radiation-core" x1={position.x} y1={position.y} x2={point.x} y2={point.y} />
        <rect x={point.x - 17} y={point.y - 17} width="34" height="34" rx="5" />
      </g>
    );
  }
  return (
    <g class="attack-effect attack-antibody" pointer-events="none">
      <line x1={position.x} y1={position.y} x2={point.x} y2={point.y} />
      <circle
        cx={position.x + (point.x - position.x) * 0.32}
        cy={position.y + (point.y - position.y) * 0.32}
        r="5"
      />
      <circle
        cx={position.x + (point.x - position.x) * 0.62}
        cy={position.y + (point.y - position.y) * 0.62}
        r="6"
      />
      <circle cx={point.x} cy={point.y} r="25" />
    </g>
  );
}

function enemyPosition(enemy: Enemy): Point {
  return getPathPosition(enemy.pathDistance);
}

export function App(): JSX.Element {
  const saved = loadSettings();
  const [game, setGame] = createSignal<GameState>(createGameState("practice"));
  const [speed, setSpeed] = createSignal<1 | 2 | 4>(saved.preferredSpeed);
  const [soundEnabled, setSoundEnabled] = createSignal(saved.soundEnabled);
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

  function resetGame(difficulty: DifficultyId): void {
    setGame(createGameState(difficulty));
    setUi({ selectedTreatment: undefined, selectedTowerId: undefined, selectedEnemyId: undefined });
  }

  function beginWave(): void {
    setGame((current) => startWave(current));
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
    if (event.key >= "1" && event.key <= "5") {
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

  function animationLoop(now: number): void {
    if (previousFrame !== 0) {
      const elapsed = (now - previousFrame) / 1000;
      setGame((current) => {
        const next = tickGame(current, elapsed * speed());
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
        return next;
      });
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
            <b>Wave</b> {game().wave}/{WAVES.length}
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
          <defs>
            <linearGradient id="tissue" x1="0" x2="1">
              <stop stop-color="#fff4df" />
              <stop offset="1" stop-color="#e7f7ed" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width={MAP_WIDTH} height={MAP_HEIGHT} rx="24" fill="url(#tissue)" />
          <For
            each={[
              { x: 150, y: 95 },
              { x: 385, y: 445 },
              { x: 625, y: 95 },
              { x: 835, y: 420 },
            ]}
          >
            {(dot, index) => (
              <circle
                class={`tissue-cell tissue-cell-${index() + 1}`}
                cx={dot.x}
                cy={dot.y}
                r="31"
                fill="#dcefdc"
                stroke="#b8d9bd"
                stroke-width="4"
              />
            )}
          </For>
          <path
            class="route-bed"
            d={`M ${PATH.map((point) => `${point.x},${point.y}`).join(" L ")}`}
            fill="none"
            stroke="#ffd5b6"
            stroke-width="52"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            class="route-flow"
            d={`M ${PATH.map((point) => `${point.x},${point.y}`).join(" L ")}`}
            fill="none"
            stroke="#ea8b6c"
            stroke-width="34"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-dasharray="6 8"
          />
          <g class="tumor-source" aria-label="Primary tumor">
            <circle cx="52" cy="324" r="40" fill="#c54267" />
            <circle cx="45" cy="316" r="15" fill="#ef718c" />
            <circle cx="67" cy="336" r="10" fill="#f69bb0" />
            <text x="52" y="388" text-anchor="middle">
              Primary tumor
            </text>
          </g>
          <g class="blood-exit" aria-label="Blood vessel exit">
            <rect x="888" y="205" width="62" height="82" rx="28" fill="#d34c5d" />
            <path d="M900 218v55m16-55v55m16-55v55" stroke="#ffbec3" stroke-width="8" />
            <text x="919" y="318" text-anchor="middle">
              Blood exit
            </text>
          </g>
          <For each={game().towers}>
            {(tower) => (
              <g class={`tower tower-${tower.type}`} onClick={(event) => pickTower(event, tower)}>
                <circle
                  cx={tower.position.x}
                  cy={tower.position.y}
                  r="24"
                  fill={TOWERS[tower.type].color}
                  stroke="#173858"
                  stroke-width="3"
                />
                <circle
                  class="tower-aura"
                  cx={tower.position.x}
                  cy={tower.position.y}
                  r="29"
                  fill="none"
                  stroke={TOWERS[tower.type].color}
                  stroke-width="2"
                />
                <text x={tower.position.x} y={tower.position.y + 5} text-anchor="middle">
                  {TOWERS[tower.type].shortName}
                </text>
                <Show when={ui.selectedTowerId === tower.id}>
                  <circle
                    cx={tower.position.x}
                    cy={tower.position.y}
                    r={getTowerRange(tower)}
                    fill="none"
                    stroke={TOWERS[tower.type].color}
                    stroke-width="2"
                    stroke-dasharray="7 6"
                  />
                </Show>
              </g>
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
          <For each={game().enemies}>
            {(enemy) => {
              const position = enemyPosition(enemy);
              const maximum = ENEMIES[enemy.type].health;
              const isTumorMass = enemy.type === "tumor_mass";
              const radius = isTumorMass ? 35 : 15;
              const healthBarWidth = isTumorMass ? 62 : 28;
              const healthWidth = Math.max(0, (healthBarWidth * enemy.health) / maximum);
              const sheddingSoon =
                isTumorMass &&
                (enemy.nextShedDistance ?? Number.POSITIVE_INFINITY) - enemy.pathDistance < 26;
              return (
                <g
                  class={`enemy enemy-${enemy.type}`}
                  classList={{ "tumor-mass-shedding": sheddingSoon }}
                  transform={`translate(${position.x} ${position.y})`}
                  onClick={(event) => pickEnemy(event, enemy)}
                >
                  <circle
                    class="enemy-body"
                    r={radius}
                    fill={ENEMIES[enemy.type].color}
                    stroke={enemy.markedUntil > game().time ? "#17a88e" : "#692d50"}
                    stroke-width="3"
                  />
                  <Show when={enemy.markedUntil > game().time}>
                    <circle
                      class="marked-halo"
                      r="21"
                      fill="none"
                      stroke="#17a88e"
                      stroke-width="2"
                    />
                  </Show>
                  <Show when={isTumorMass}>
                    <circle
                      class="tumor-mass-shell"
                      r="31"
                      fill="none"
                      stroke="#f0aac6"
                      stroke-width="3"
                    />
                    <circle
                      class="tumor-mass-vein tumor-mass-vein-a"
                      r="23"
                      fill="none"
                      stroke="#d98cae"
                      stroke-width="5"
                    />
                    <circle
                      class="tumor-mass-vein tumor-mass-vein-b"
                      r="17"
                      fill="none"
                      stroke="#b84c7e"
                      stroke-width="3"
                      stroke-dasharray="7 6"
                    />
                    <circle
                      class="tumor-mass-nodule tumor-mass-nodule-a"
                      cx="-13"
                      cy="11"
                      r="6"
                      fill="#a94d79"
                    />
                    <circle
                      class="tumor-mass-nodule tumor-mass-nodule-b"
                      cx="14"
                      cy="-12"
                      r="7"
                      fill="#a94d79"
                    />
                    <circle
                      class="tumor-mass-nodule tumor-mass-nodule-c"
                      cx="4"
                      cy="18"
                      r="4"
                      fill="#e189ae"
                    />
                    <path
                      class="tumor-mass-shed-cue"
                      d="M-44 5 C-58 13 -58 29 -43 34"
                      fill="none"
                      stroke="#f3b0ca"
                      stroke-width="3"
                    />
                  </Show>
                  <circle cx="-5" cy="-3" r="2" fill="#fff" />
                  <circle cx="5" cy="-3" r="2" fill="#fff" />
                  <rect
                    x={-healthBarWidth / 2}
                    y={-radius - 13}
                    width={healthBarWidth}
                    height="6"
                    rx="2"
                    fill="#67314b"
                  />
                  <rect
                    x={-healthBarWidth / 2}
                    y={-radius - 13}
                    width={healthWidth}
                    height="6"
                    rx="2"
                    fill="#86d35b"
                  />
                </g>
              );
            }}
          </For>
          <Show when={ui.selectedTreatment}>
            {(treatment) => (
              <g class="placement-ghost" pointer-events="none">
                <circle
                  cx={ui.cursor.x}
                  cy={ui.cursor.y}
                  r={TOWERS[treatment()].range}
                  fill={placementValid() ? "#2aaa7720" : "#e34848"}
                  stroke={placementValid() ? "#2aaa77" : "#e34848"}
                  stroke-width="2"
                  stroke-dasharray="8 7"
                />
                <circle
                  cx={ui.cursor.x}
                  cy={ui.cursor.y}
                  r="22"
                  fill={TOWERS[treatment()].color}
                  opacity=".65"
                />
              </g>
            )}
          </Show>
        </svg>
        <Show when={game().status === "won" || game().status === "lost"}>
          <div class="terminal-overlay" role="alert">
            <h2>{game().status === "won" ? "CANCER CONTAINED" : "CANCER HAS METASTASIZED"}</h2>
            <p>
              {game().status === "won"
                ? "All 15 waves are cleared."
                : "The blood vessel has reached its metastasis capacity."}
            </p>
            <button type="button" onClick={() => resetGame(game().difficulty)}>
              New run
            </button>
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
        Keys: 1-5 choose treatment, arrows move placement, Enter place, Esc cancel, Space pause, N
        next wave.
      </footer>
    </main>
  );
}
