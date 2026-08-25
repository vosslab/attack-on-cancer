import { For, Show } from "solid-js";
import type { JSX } from "solid-js";

import { WorldArtwork, type WorldArtworkId } from "../generated/visual_assets";
import { PLAYFIELD_HEIGHT, PLAYFIELD_WIDTH } from "./config";
import type { LevelId, Point } from "./game_types";
import { getCampaignLevel } from "./levels/campaign";
import type {
  LandmarkDefinition,
  LevelDefinition,
  ObstacleDefinition,
  SceneLearningContent,
} from "./levels/level_definition";
import {
  getSceneLearningCopy,
  type SceneLearningCopy,
  type SceneObjectKind,
} from "./scene_learning";

interface WorldLandmarksProps {
  level: LevelId;
  interactive?: boolean;
}

const TOOLTIP_WIDTH = 350;
const TOOLTIP_HEIGHT = 152;

const BASE_TISSUE_CELLS: readonly Point[] = [
  { x: 148, y: 92 },
  { x: 344, y: 94 },
  { x: 618, y: 94 },
  { x: 832, y: 100 },
  { x: 205, y: 500 },
  { x: 560, y: 505 },
  { x: 835, y: 440 },
];

/** Dedicated microscopic world sheets begin at the first branching level. */
const WORLD_ARTWORK_BY_LEVEL: Readonly<Partial<Record<LevelId, WorldArtworkId>>> = {
  3: "capillary_crossroads",
  4: "lymph_node_loop",
  5: "alveolar_switchbacks",
  6: "ductal_delta",
  7: "vascular_bypass",
  8: "fibrotic_sieve",
  9: "marrow_lattice",
  10: "metastatic_confluence",
};

function segmentPath(points: readonly Point[]): string {
  return `M ${points.map((point) => `${point.x},${point.y}`).join(" L ")}`;
}

function landmarkArtwork(
  levelId: LevelId,
  landmark: LandmarkDefinition,
): "tumor_source" | "tumor_cluster" | "blood_exit" | undefined {
  if (landmark.kind === "source") return levelId === 2 ? "tumor_cluster" : "tumor_source";
  if (landmark.kind === "exit") return "blood_exit";
  return undefined;
}

function landmarkClass(landmark: LandmarkDefinition): string {
  return `world-landmark world-landmark-${landmark.kind}`;
}

function tooltipOffset(anchor: Point): Point {
  const x = anchor.x < 360 ? 28 : anchor.x > 600 ? -TOOLTIP_WIDTH - 28 : -TOOLTIP_WIDTH / 2;
  const y = anchor.y < 170 ? 40 : -TOOLTIP_HEIGHT - 18;
  return { x, y };
}

function routeTooltipAnchor(level: LevelDefinition): Point {
  const fieldCenter = { x: PLAYFIELD_WIDTH / 2, y: PLAYFIELD_HEIGHT / 2 };
  let closest = level.segments[0]?.points[0] ?? fieldCenter;
  let closestDistance = Number.POSITIVE_INFINITY;
  for (const segment of level.segments) {
    for (const point of segment.points) {
      const xDistance = point.x - fieldCenter.x;
      const yDistance = point.y - fieldCenter.y;
      const distance = xDistance * xDistance + yDistance * yDistance;
      if (distance < closestDistance) {
        closest = point;
        closestDistance = distance;
      }
    }
  }
  return closest;
}

function landmarkHitRadius(landmark: LandmarkDefinition): number {
  if (landmark.kind === "source") return 48;
  if (landmark.kind === "exit") return 44;
  return 34;
}

function interactiveLandmarks(level: LevelDefinition): readonly LandmarkDefinition[] {
  const obstacleLandmarkIds = new Set(
    level.obstacles
      .map((obstacle) => obstacle.landmarkId)
      .filter((landmarkId): landmarkId is string => landmarkId !== undefined),
  );
  return level.landmarks.filter((landmark) => !obstacleLandmarkIds.has(landmark.id));
}

function focusSceneObject(event: PointerEvent & { currentTarget: SVGGElement }): void {
  event.stopPropagation();
  event.currentTarget.classList.remove("scene-object-dismissed");
  event.currentTarget.focus();
}

function stopSceneClick(event: MouseEvent): void {
  event.stopPropagation();
}

function resetSceneObjectDismissal(event: PointerEvent & { currentTarget: SVGGElement }): void {
  event.currentTarget.classList.remove("scene-object-dismissed");
}

function handleSceneObjectKey(event: KeyboardEvent & { currentTarget: SVGGElement }): void {
  event.stopPropagation();
  if (
    event.key === " " ||
    event.key === "Enter" ||
    event.key === "ArrowUp" ||
    event.key === "ArrowDown" ||
    event.key === "ArrowLeft" ||
    event.key === "ArrowRight"
  ) {
    event.preventDefault();
  }
  if (event.key === "Escape") {
    event.currentTarget.classList.add("scene-object-dismissed");
    event.currentTarget.blur();
  }
}

function SceneTooltip(props: {
  anchor: Point;
  kind: SceneObjectKind;
  title: string;
  learning: SceneLearningContent;
}): JSX.Element {
  const copy = (): SceneLearningCopy => getSceneLearningCopy(props.kind, props.learning);
  const offset = (): Point => tooltipOffset(props.anchor);
  return (
    <g class="scene-tooltip" aria-hidden="true" role="tooltip">
      <foreignObject x={offset().x} y={offset().y} width={TOOLTIP_WIDTH} height={TOOLTIP_HEIGHT}>
        <div class="scene-tooltip-card" data-scene-tooltip={props.title}>
          <span class="scene-tooltip-category">{copy().category}</span>
          <strong>{props.title}</strong>
          <p>
            <span class="scene-tooltip-biological-fact">{props.learning.biologicalFact}</span>{" "}
            <span class="scene-tooltip-game-role">{props.learning.gameRole}</span>
          </p>
        </div>
      </foreignObject>
    </g>
  );
}

function SceneObjectHotspot(props: {
  id: string;
  kind: SceneObjectKind;
  label: string;
  learning: SceneLearningContent;
  position: Point;
  radius: number;
}): JSX.Element {
  const copy = (): SceneLearningCopy => getSceneLearningCopy(props.kind, props.learning);
  return (
    <g
      class={`scene-object scene-object-${props.kind}`}
      data-scene-object={props.id}
      transform={`translate(${props.position.x} ${props.position.y})`}
      role="img"
      tabIndex={0}
      aria-label={`${props.label}. ${copy().description}`}
      on:pointerdown={focusSceneObject}
      on:pointerleave={resetSceneObjectDismissal}
      on:click={stopSceneClick}
      on:keydown={handleSceneObjectKey}
    >
      <circle class="scene-object-hit" r={props.radius} />
      <circle
        class="scene-object-focus-ring scene-object-focus-ring-outer"
        r={props.radius + 3}
        aria-hidden="true"
      />
      <circle
        class="scene-object-focus-ring scene-object-focus-ring-inner"
        r={props.radius}
        aria-hidden="true"
      />
      <SceneTooltip
        anchor={props.position}
        kind={props.kind}
        title={props.label}
        learning={props.learning}
      />
    </g>
  );
}

function SceneRouteHotspot(props: { level: LevelDefinition }): JSX.Element {
  const anchor = (): Point => routeTooltipAnchor(props.level);
  const label = (): string =>
    props.level.routes.length === 1 ? "Cancer-cell route" : "Branching cancer-cell routes";
  const copy = (): SceneLearningCopy => getSceneLearningCopy("route", props.level.routeLearning);
  return (
    <g
      class="scene-object scene-object-route"
      data-scene-object="route-network"
      role="img"
      tabIndex={0}
      aria-label={`${label()}. ${copy().description}`}
      on:pointerdown={focusSceneObject}
      on:pointerleave={resetSceneObjectDismissal}
      on:click={stopSceneClick}
      on:keydown={handleSceneObjectKey}
    >
      <For each={props.level.segments}>
        {(segment) => (
          <>
            <path class="scene-route-hit" d={segmentPath(segment.points)} />
            <path
              class="scene-route-focus scene-route-focus-outline"
              d={segmentPath(segment.points)}
              aria-hidden="true"
            />
            <path class="scene-route-focus" d={segmentPath(segment.points)} aria-hidden="true" />
          </>
        )}
      </For>
      <g transform={`translate(${anchor().x} ${anchor().y})`}>
        <SceneTooltip
          anchor={anchor()}
          kind="route"
          title={label()}
          learning={props.level.routeLearning}
        />
      </g>
    </g>
  );
}

function obstacleHotspotRadius(obstacle: ObstacleDefinition): number {
  return Math.max(34, obstacle.radius + 8);
}

export function TissueRegion(props: WorldLandmarksProps): JSX.Element {
  const levelId = (): LevelId => props.level;
  const level = (): LevelDefinition => getCampaignLevel(levelId());
  const backgroundId = (): string => `tissue-background-${levelId()}`;
  const depthId = (): string => `tissue-depth-${levelId()}`;
  const matrixId = (): string => `tissue-matrix-${levelId()}`;
  const worldArtwork = (): WorldArtworkId | undefined => WORLD_ARTWORK_BY_LEVEL[levelId()];

  return (
    <g
      class="tissue-region"
      data-level={levelId()}
      data-level-theme={level().theme}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={backgroundId()} x1="0" y1="0" x2="1" y2="1">
          <stop stop-color="#fff0d9" />
          <stop offset="0.48" stop-color="#f4efdc" />
          <stop offset="1" stop-color="#dff3e8" />
        </linearGradient>
        <radialGradient id={depthId()} cx="38%" cy="42%" r="72%">
          <stop stop-color="#fff" stop-opacity="0.42" />
          <stop offset="0.58" stop-color="#fff" stop-opacity="0" />
          <stop offset="1" stop-color="#8aa7a2" stop-opacity="0.16" />
        </radialGradient>
        <pattern id={matrixId()} width="84" height="62" patternUnits="userSpaceOnUse">
          <path class="tissue-matrix-fiber" d="M-8 18C18-2 44 8 66 28S98 48 108 32" />
          <path
            class="tissue-matrix-fiber tissue-matrix-fiber-secondary"
            d="M-16 52C12 30 38 40 58 56S92 68 104 50"
          />
          <circle class="tissue-matrix-speck" cx="17" cy="20" r="2" />
          <circle class="tissue-matrix-speck" cx="63" cy="48" r="1.5" />
        </pattern>
      </defs>
      <Show
        when={worldArtwork()}
        fallback={
          <>
            <rect
              class="tissue-background"
              width={PLAYFIELD_WIDTH}
              height={PLAYFIELD_HEIGHT}
              rx="24"
              fill={`url(#${backgroundId()})`}
            />
            <rect
              class="tissue-depth"
              width={PLAYFIELD_WIDTH}
              height={PLAYFIELD_HEIGHT}
              rx="24"
              fill={`url(#${depthId()})`}
            />
            <rect
              class="tissue-matrix"
              width={PLAYFIELD_WIDTH}
              height={PLAYFIELD_HEIGHT}
              rx="24"
              fill={`url(#${matrixId()})`}
            />
            <g class="tissue-folds">
              <path d="M48 132C182 82 282 110 372 76S590 46 724 104S876 150 938 112" />
              <path d="M20 472C122 422 228 446 316 486S500 536 620 482S826 406 944 452" />
              <path d="M104 560C224 526 340 556 448 532S674 504 842 548" />
            </g>
            <For each={BASE_TISSUE_CELLS}>
              {(point, index) => (
                <g
                  class={`tissue-cell tissue-cell-${index() + 1}`}
                  transform={`translate(${point.x} ${point.y})`}
                >
                  <WorldArtwork type="tissue_cell" instanceKey={`tissue-${levelId()}-${index()}`} />
                </g>
              )}
            </For>
          </>
        }
      >
        <g class="level-world-art" data-world-art={worldArtwork()}>
          <WorldArtwork type={worldArtwork()!} instanceKey={`level-${levelId()}-world`} />
        </g>
      </Show>
    </g>
  );
}

export function WorldLandmarks(props: WorldLandmarksProps): JSX.Element {
  const levelId = (): LevelId => props.level;
  const level = (): LevelDefinition => getCampaignLevel(levelId());
  return (
    <g
      class="world-landmarks"
      data-level={levelId()}
      data-level-theme={level().theme}
      aria-label={`${level().title}: ${level().accessibleDescription}`}
    >
      <TissueRegion level={levelId()} />
      <g class="campaign-routes" aria-hidden="true">
        <g class="campaign-route-layer campaign-route-beds" data-route-layer="bed">
          <For each={level().segments}>
            {(segment) => (
              <path
                class="campaign-route-segment route-bed"
                data-route-segment={segment.id}
                d={segmentPath(segment.points)}
              />
            )}
          </For>
        </g>
        <g class="campaign-route-layer campaign-route-membranes" data-route-layer="membrane">
          <For each={level().segments}>
            {(segment) => (
              <path
                class="route-membrane"
                data-route-segment={segment.id}
                d={segmentPath(segment.points)}
              />
            )}
          </For>
        </g>
        <g class="campaign-route-layer campaign-route-flows" data-route-layer="flow">
          <For each={level().segments}>
            {(segment) => (
              <path
                class="route-flow"
                data-route-segment={segment.id}
                d={segmentPath(segment.points)}
              />
            )}
          </For>
        </g>
        <g class="campaign-route-layer campaign-route-currents" data-route-layer="current">
          <For each={level().segments}>
            {(segment) => (
              <path
                class="route-current"
                data-route-segment={segment.id}
                d={segmentPath(segment.points)}
              />
            )}
          </For>
        </g>
      </g>
      <g class="campaign-obstacles" aria-hidden="true">
        <For each={level().obstacles}>
          {(obstacle) => (
            <g
              class="world-obstacle"
              data-obstacle={obstacle.id}
              transform={`translate(${obstacle.position.x} ${obstacle.position.y})`}
            >
              <circle class="world-obstacle-halo" r={obstacle.radius + 7} />
              <circle class="world-obstacle-core" r={obstacle.radius} />
            </g>
          )}
        </For>
      </g>
      <g class="campaign-landmarks" aria-hidden="true">
        <For each={level().landmarks}>
          {(landmark) => {
            const artwork = landmarkArtwork(levelId(), landmark);
            return (
              <g
                class={landmarkClass(landmark)}
                data-landmark={landmark.id}
                transform={`translate(${landmark.position.x} ${landmark.position.y})`}
              >
                <Show when={artwork}>
                  <WorldArtwork type={artwork!} instanceKey={`level-${levelId()}-${landmark.id}`} />
                </Show>
              </g>
            );
          }}
        </For>
      </g>
      <Show when={props.interactive}>
        <g class="scene-learning-layer" role="group" aria-label="Explore scene objects">
          <SceneRouteHotspot level={level()} />
          <For each={interactiveLandmarks(level())}>
            {(landmark) => (
              <SceneObjectHotspot
                id={`landmark:${landmark.id}`}
                kind={landmark.kind}
                label={landmark.label}
                learning={landmark.learning}
                position={landmark.position}
                radius={landmarkHitRadius(landmark)}
              />
            )}
          </For>
          <For each={level().obstacles}>
            {(obstacle) => (
              <SceneObjectHotspot
                id={`obstacle:${obstacle.id}`}
                kind="obstacle"
                label={obstacle.label}
                learning={obstacle.learning}
                position={obstacle.position}
                radius={obstacleHotspotRadius(obstacle)}
              />
            )}
          </For>
        </g>
      </Show>
    </g>
  );
}
