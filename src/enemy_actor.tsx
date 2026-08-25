import { Show } from "solid-js";
import type { JSX } from "solid-js";

import {
  ApoptosisArtwork,
  EnemyArtwork,
  RepairArtwork,
  RuptureArtwork,
} from "../generated/visual_assets";
import { ENEMIES } from "./config";
import type { Enemy, EnemyId, Point, SceneId } from "./game_types";
import { getEnemyVisualPosition } from "./simulation";
import type { CellDeathVisual, CellRepairVisual, CellVariant } from "./enemy_visuals";
import { actorAnimationDelay, cellVariant } from "./enemy_visuals";

export type EnemyVisualState = "idle" | "hit" | "shedding";

function enemyRadius(type: EnemyId): number {
  const radii: Record<EnemyId, number> = {
    basic: 16,
    fast: 17,
    tough: 18,
    dividing: 17,
    immune_evasive: 18,
    tumor_mass: 35,
  };
  return radii[type];
}

function healthBarWidth(type: EnemyId): number {
  const widths: Record<EnemyId, number> = {
    basic: 30,
    fast: 32,
    tough: 34,
    dividing: 36,
    immune_evasive: 34,
    tumor_mass: 62,
  };
  return widths[type];
}

export function EnemyActor(props: {
  enemy: Enemy;
  scene: SceneId;
  time: number;
  onPick: (event: MouseEvent, enemy: Enemy) => void;
}): JSX.Element {
  const position = (): Point =>
    getEnemyVisualPosition(props.enemy.id, props.enemy.pathDistance, props.scene);
  const maximumHealth = (): number => ENEMIES[props.enemy.type].health;
  const radius = (): number => enemyRadius(props.enemy.type);
  const barWidth = (): number => healthBarWidth(props.enemy.type);
  const healthWidth = (): number =>
    Math.max(0, (barWidth() * props.enemy.health) / maximumHealth());
  const marked = (): boolean => props.enemy.markedUntil > props.time;
  const sheddingSoon = (): boolean =>
    props.enemy.type === "tumor_mass" &&
    (props.enemy.nextShedDistance ?? Number.POSITIVE_INFINITY) - props.enemy.pathDistance < 26;
  const variant = (): CellVariant => cellVariant(props.enemy.id);
  const visualState = (): EnemyVisualState => {
    if (sheddingSoon()) return "shedding";
    return marked() ? "hit" : "idle";
  };
  const className = (): string => {
    const classes = [
      "enemy",
      `enemy-${props.enemy.type}`,
      `cell-variant-${variant()}`,
      marked() ? "enemy-marked" : "",
      sheddingSoon() ? "tumor-mass-shedding" : "",
    ];
    return classes.filter(Boolean).join(" ");
  };

  return (
    <g
      class={className()}
      data-enemy-id={props.enemy.id}
      data-enemy-type={props.enemy.type}
      data-visual-state={visualState()}
      data-visual-variant={variant()}
      style={{
        "--actor-phase": actorAnimationDelay(props.enemy.id),
        "--cell-base": ENEMIES[props.enemy.type].color,
      }}
      transform={`translate(${position().x} ${position().y})`}
      on:click={(event) => props.onPick(event, props.enemy)}
    >
      <EnemyArtwork
        type={props.enemy.type}
        variant={variant()}
        instanceKey={`enemy-${props.enemy.id}`}
      />
      <Show when={marked()}>
        <circle class="marked-halo" r={radius() + 6} />
      </Show>
      <Show when={props.enemy.health < maximumHealth()}>
        <rect
          class="cell-health-track"
          x={-barWidth() / 2}
          y={-radius() - 13}
          width={barWidth()}
          height="6"
          rx="2"
        />
        <rect
          class="cell-health-value"
          x={-barWidth() / 2}
          y={-radius() - 13}
          width={healthWidth()}
          height="6"
          rx="2"
        />
      </Show>
    </g>
  );
}

export function CellDeathEffect(props: { death: CellDeathVisual }): JSX.Element {
  return (
    <g
      class={`cell-death cell-death-${props.death.kind} cell-variant-${props.death.variant}`}
      data-death-kind={props.death.kind}
      data-visual-state={props.death.kind}
      style={{ "--death-fill": ENEMIES[props.death.type].color }}
      transform={`translate(${props.death.position.x} ${props.death.position.y})`}
      pointer-events="none"
      aria-hidden="true"
    >
      <Show
        when={props.death.kind === "apoptosis"}
        fallback={<RuptureArtwork instanceKey={`death-${props.death.enemyId}`} />}
      >
        <ApoptosisArtwork instanceKey={`death-${props.death.enemyId}`} />
      </Show>
    </g>
  );
}

export function CellRepairEffect(props: { repair: CellRepairVisual }): JSX.Element {
  return (
    <g
      class="cell-repair"
      data-repair-event={props.repair.eventKey}
      data-repair-source-type={props.repair.type}
      data-visual-state="repair"
      transform={`translate(${props.repair.position.x} ${props.repair.position.y})`}
      pointer-events="none"
      aria-hidden="true"
    >
      <RepairArtwork instanceKey={`repair-${props.repair.eventKey}-${props.repair.enemyId}`} />
    </g>
  );
}
