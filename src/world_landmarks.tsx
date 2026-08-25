import { For, Show } from "solid-js";
import type { JSX } from "solid-js";

import { WorldArtwork } from "../generated/visual_assets";
import { getScenePath, PLAYFIELD_HEIGHT, PLAYFIELD_WIDTH } from "./config";
import type { Point, SceneId } from "./game_types";

const TISSUE_CELLS: Record<SceneId, readonly Point[]> = {
  1: [
    { x: 148, y: 92 },
    { x: 344, y: 94 },
    { x: 618, y: 94 },
    { x: 832, y: 100 },
    { x: 205, y: 500 },
    { x: 560, y: 505 },
    { x: 835, y: 440 },
  ],
  2: [
    { x: 144, y: 92 },
    { x: 520, y: 84 },
    { x: 874, y: 84 },
    { x: 240, y: 500 },
    { x: 620, y: 520 },
    { x: 842, y: 440 },
  ],
};

function routePath(scene: SceneId): string {
  const points = getScenePath(scene).map((point) => `${point.x},${point.y}`);
  return `M ${points.join(" L ")}`;
}

export function TissueRegion(props: { scene: SceneId }): JSX.Element {
  const backgroundId = (): string => `tissue-background-${props.scene}`;
  const depthId = (): string => `tissue-depth-${props.scene}`;
  const matrixId = (): string => `tissue-matrix-${props.scene}`;
  return (
    <g class={`tissue-region tissue-region-${props.scene}`} data-scene={props.scene}>
      <defs>
        <linearGradient id={backgroundId()} x1="0" y1="0" x2="1" y2="1">
          <Show
            when={props.scene === 1}
            fallback={
              <>
                <stop stop-color="#f7ded8" />
                <stop offset="0.5" stop-color="#eee2eb" />
                <stop offset="1" stop-color="#d9e9ed" />
              </>
            }
          >
            <stop stop-color="#fff0d9" />
            <stop offset="0.48" stop-color="#f4efdc" />
            <stop offset="1" stop-color="#dff3e8" />
          </Show>
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
      <g class="tissue-folds" aria-hidden="true">
        <path d="M48 132C182 82 282 110 372 76S590 46 724 104S876 150 938 112" />
        <path d="M20 472C122 422 228 446 316 486S500 536 620 482S826 406 944 452" />
        <path d="M104 560C224 526 340 556 448 532S674 504 842 548" />
      </g>
      <For each={TISSUE_CELLS[props.scene]}>
        {(point, index) => (
          <g
            class={`tissue-cell tissue-cell-${index() + 1}`}
            transform={`translate(${point.x} ${point.y})`}
          >
            <WorldArtwork type="tissue_cell" instanceKey={`tissue-${props.scene}-${index()}`} />
          </g>
        )}
      </For>
    </g>
  );
}

export function WorldLandmarks(props: { scene: SceneId }): JSX.Element {
  return (
    <g class="world-landmarks" data-scene={props.scene}>
      <TissueRegion scene={props.scene} />
      <path class="route-bed" d={routePath(props.scene)} />
      <path class="route-membrane" d={routePath(props.scene)} />
      <path class="route-flow" d={routePath(props.scene)} />
      <Show
        when={props.scene === 1}
        fallback={
          <g class="cluster-source" aria-label="Multi-tumor cluster" transform="translate(57 320)">
            <WorldArtwork type="tumor_cluster" instanceKey="world-tumor-cluster" />
            <text x="7" y="72" text-anchor="middle">
              Tumor cluster
            </text>
          </g>
        }
      >
        <g class="tumor-source" aria-label="Primary tumor" transform="translate(52 324)">
          <WorldArtwork type="tumor_source" instanceKey="world-primary-tumor" />
          <text y="64" text-anchor="middle">
            Primary tumor
          </text>
        </g>
      </Show>
      <g class="blood-exit" aria-label="Blood vessel exit" transform="translate(919 246)">
        <WorldArtwork type="blood_exit" instanceKey="world-blood-exit" />
        <text y="72" text-anchor="middle">
          Blood exit
        </text>
      </g>
    </g>
  );
}
