import { For, Show } from "solid-js";
import type { JSX } from "solid-js";

import { TowerArtwork } from "../generated/visual_assets";
import type { VisualTier } from "../generated/visual_assets";
import { TOWERS } from "./config";
import type { Point, Tower, TowerId } from "./game_types";
import { getTowerRange } from "./simulation";
import { actorAnimationDelay } from "./enemy_visuals";

export function towerVisualTier(tier: number): VisualTier {
  if (tier === 0 || tier === 1 || tier === 2 || tier === 3) return tier;
  throw new Error(`Tower visual tier must be 0-3, received ${tier}.`);
}

function towerAimDegrees(tower: Tower): number {
  if (tower.attackPoint === undefined) return 0;
  const horizontal = tower.attackPoint.x - tower.position.x;
  const vertical = tower.attackPoint.y - tower.position.y;
  return (Math.atan2(vertical, horizontal) * 180) / Math.PI;
}

export function TowerActor(props: {
  tower: Tower;
  time: number;
  selected: boolean;
  onPick: (event: MouseEvent, tower: Tower) => void;
}): JSX.Element {
  const attacking = (): boolean =>
    props.tower.attackFlashUntil !== undefined && props.tower.attackFlashUntil > props.time;
  const tier = (): VisualTier => towerVisualTier(props.tower.tier);
  const aim = (): string => `${towerAimDegrees(props.tower)}deg`;

  return (
    <g
      class={`tower tower-${props.tower.type}`}
      data-tower-id={props.tower.id}
      data-tower-type={props.tower.type}
      data-visual-state={attacking() ? "attacking" : "idle"}
      data-visual-tier={tier()}
      data-attack-outcome={props.tower.attackOutcome}
      data-repair-misses={props.tower.repairMisses}
      style={{ "--actor-phase": actorAnimationDelay(props.tower.id) }}
      transform={`translate(${props.tower.position.x} ${props.tower.position.y})`}
      on:click={(event) => props.onPick(event, props.tower)}
    >
      <circle class="tower-aura" r="29" />
      <g class="tower-artwork-aim" style={{ "--tower-aim": aim() }}>
        <TowerArtwork
          type={props.tower.type}
          tier={tier()}
          instanceKey={`tower-${props.tower.id}`}
        />
      </g>
      <Show when={props.tower.type === "crispr"}>
        <g class="crispr-pity-pips" aria-hidden="true">
          <For each={[0, 1, 2, 3, 4, 5, 6]}>
            {(index) => (
              <circle
                classList={{ active: index < (props.tower.repairMisses ?? 0) }}
                cx={-18 + index * 6}
                cy="29"
                r="2"
              />
            )}
          </For>
        </g>
      </Show>
      <circle class="tower-hit-target" r="31" aria-hidden="true" />
      <Show when={props.selected}>
        <circle
          class="tower-range"
          r={getTowerRange(props.tower)}
          stroke={TOWERS[props.tower.type].color}
        />
      </Show>
    </g>
  );
}

export function TowerPlacementGhost(props: {
  type: TowerId;
  position: Point;
  range: number;
  valid: boolean;
}): JSX.Element {
  return (
    <g
      class={`placement-ghost tower-${props.type}`}
      data-visual-state="idle"
      transform={`translate(${props.position.x} ${props.position.y})`}
      pointer-events="none"
    >
      <circle
        class={props.valid ? "placement-range placement-range-valid" : "placement-range"}
        r={props.range}
      />
      <g class="placement-artwork">
        <TowerArtwork type={props.type} tier={0} instanceKey="placement-ghost" />
      </g>
    </g>
  );
}
