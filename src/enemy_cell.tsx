import { Match, Show, Switch } from "solid-js";
import type { JSX } from "solid-js";

import { ENEMIES } from "./config";
import type { Enemy, EnemyId, Point, SceneId } from "./game_types";
import { getPathPosition } from "./simulation";
import type { CellDeathVisual, CellVariant } from "./enemy_visuals";
import { cellVariant } from "./enemy_visuals";

type MembranePaths = Record<CellVariant, string>;

const BASIC_MEMBRANES: MembranePaths = {
  0: "M0-15C9-17 16-10 15-2C19 6 11 15 2 15C-7 18-16 11-15 2C-18-7-10-15 0-15Z",
  1: "M-2-16C7-16 12-12 15-5C20 1 14 11 8 13C1 18-10 16-14 8C-18 1-14-10-7-12C-6-16-4-16-2-16Z",
  2: "M2-16C10-14 17-7 15 1C18 9 8 17 0 15C-8 18-17 9-14 1C-18-7-8-17 2-16Z",
  3: "M-3-15C5-19 14-12 14-5C20 1 14 10 7 12C2 18-9 16-12 9C-20 5-16-6-10-10C-9-14-6-16-3-15Z",
};

const FAST_MEMBRANES: MembranePaths = {
  0: "M-19-5C-13-16 1-18 12-11L21-4L14 1C11 11 1 17-11 12C-17 9-21 3-19-5Z",
  1: "M-20 2C-18-10-7-17 5-14L19-9L14-1L21 5L8 7C1 17-14 15-19 7Z",
  2: "M-18-9C-7-17 7-14 13-7L22-1L13 4C7 14-7 18-16 10C-21 5-22-3-18-9Z",
  3: "M-21-1C-17-12-5-17 7-12L20-4L13 2L19 8L6 10C-4 18-18 11-21-1Z",
};

const TOUGH_MEMBRANES: MembranePaths = {
  0: "M-5-18C2-20 8-16 11-12C18-11 20-4 17 2C21 9 14 16 7 16C2 21-7 19-11 14C-19 13-21 5-17-2C-21-9-14-16-5-18Z",
  1: "M1-19C8-18 14-13 14-8C21-5 21 4 17 8C18 16 8 20 2 17C-4 22-13 18-15 11C-22 7-20-2-16-6C-17-14-7-19 1-19Z",
  2: "M-2-19C7-20 12-14 14-9C21-6 20 3 17 7C20 15 11 20 4 17C-2 22-11 18-13 12C-21 9-21 0-16-5C-18-13-10-18-2-19Z",
  3: "M-7-17C0-21 7-17 10-13C18-13 21-6 18 0C22 6 17 14 11 15C7 21-2 20-7 16C-15 19-21 11-18 4C-23-2-17-11-12-12C-12-15-10-17-7-17Z",
};

const DIVIDING_MEMBRANES: MembranePaths = {
  0: "M0-9C-6-18-19-17-21-6C-24 6-15 16-4 13C-1 11 1 11 4 13C15 17 24 6 21-6C19-17 6-18 0-9Z",
  1: "M1-8C-5-17-18-19-21-7C-24 4-17 15-6 14C-2 12 1 10 5 14C16 17 23 7 21-4C20-16 7-18 1-8Z",
  2: "M-1-8C-7-17-19-16-21-4C-22 7-14 17-4 13C-1 11 1 11 5 14C16 16 23 5 20-6C17-18 5-17-1-8Z",
  3: "M0-10C-6-18-18-18-21-7C-25 4-17 16-5 14C-2 12 2 12 5 14C17 17 25 4 21-7C18-18 6-18 0-10Z",
};

const EVASIVE_MEMBRANES: MembranePaths = {
  0: "M0-16L5-12C11-15 16-9 14-3L20 1L14 6C15 13 7 17 1 14L-5 19L-8 13C-15 12-18 5-14 0L-20-5L-13-8C-10-15-4-17 0-16Z",
  1: "M-2-17L4-13C10-17 16-11 14-5L21-2L15 4C18 10 10 17 4 14L0 20L-5 14C-12 16-18 9-15 3L-21 0L-14-5C-13-12-7-17-2-17Z",
  2: "M1-17L6-12C13-13 17-6 13-1L20 4L13 7C12 14 4 17-1 13L-7 19L-9 12C-16 11-19 3-14-2L-19-8L-11-9C-8-16-3-18 1-17Z",
  3: "M-1-16L5-13C11-16 17-9 14-3L21 1L14 6C16 13 8 18 2 14L-4 20L-8 13C-15 14-19 6-15 0L-20-6L-12-8C-10-15-5-17-1-16Z",
};

function BasicCell(props: { variant: CellVariant }): JSX.Element {
  return (
    <g>
      <path class="cell-membrane" d={BASIC_MEMBRANES[props.variant]} />
      <ellipse class="cell-highlight" cx="-5" cy="-8" rx="5" ry="3" />
      <path class="cell-nucleus" d="M-7-2C-6-8 2-10 6-5C10 0 6 7 0 8C-7 8-10 3-7-2Z" />
      <circle class="cell-vacuole" cx="9" cy="6" r="2.4" />
      <circle class="cell-vacuole cell-vacuole-small" cx="8" cy="-8" r="1.5" />
    </g>
  );
}

function FastCell(props: { variant: CellVariant }): JSX.Element {
  return (
    <g>
      <path class="cell-pseudopod" d="M-10-9Q-19-18-23-12" />
      <path class="cell-pseudopod" d="M-14 5Q-23 12-25 5" />
      <path class="cell-membrane" d={FAST_MEMBRANES[props.variant]} />
      <ellipse class="cell-highlight" cx="-5" cy="-9" rx="7" ry="2.6" />
      <ellipse class="cell-nucleus" cx="1" cy="1" rx="7" ry="5" />
      <path class="cell-striation" d="M8-8Q13-5 15-2M9 6Q14 4 16 1" />
    </g>
  );
}

function ToughCell(props: { variant: CellVariant }): JSX.Element {
  return (
    <g>
      <path class="cell-membrane" d={TOUGH_MEMBRANES[props.variant]} />
      <path class="cell-membrane-ridge" d="M-12-9C-2-16 12-10 14 1C15 10 5 16-5 13" />
      <ellipse class="cell-highlight" cx="-6" cy="-10" rx="6" ry="3" />
      <path
        class="cell-nucleus cell-nucleus-lobed"
        d="M-9-1C-8-8-1-10 3-6C8-9 12-3 9 2C12 8 3 12-1 8C-7 11-12 5-9-1Z"
      />
      <circle class="cell-granule" cx="11" cy="9" r="2.2" />
      <circle class="cell-granule" cx="11" cy="-7" r="1.8" />
      <circle class="cell-granule" cx="-11" cy="8" r="1.6" />
    </g>
  );
}

function DividingCell(props: { variant: CellVariant }): JSX.Element {
  return (
    <g>
      <path class="cell-membrane" d={DIVIDING_MEMBRANES[props.variant]} />
      <ellipse class="cell-highlight" cx="-11" cy="-9" rx="4" ry="2.5" />
      <ellipse class="cell-highlight" cx="11" cy="-9" rx="4" ry="2.5" />
      <ellipse class="cell-nucleus" cx="-9" cy="1" rx="5.5" ry="6.5" />
      <ellipse class="cell-nucleus" cx="9" cy="1" rx="5.5" ry="6.5" />
      <path class="cell-cleavage-furrow" d="M0-10C-3-5-3 5 0 11M0-10C3-5 3 5 0 11" />
    </g>
  );
}

function ImmuneEvasiveCell(props: { variant: CellVariant }): JSX.Element {
  return (
    <g>
      <path class="cell-pseudopod" d="M-9-11Q-15-20-21-16M11-8Q20-15 23-8M-13 8Q-21 15-24 8" />
      <path class="cell-membrane" d={EVASIVE_MEMBRANES[props.variant]} />
      <ellipse class="cell-highlight" cx="-5" cy="-9" rx="6" ry="3" />
      <path class="cell-nucleus" d="M-8-2C-6-9 4-10 8-4C11 2 5 9-2 8C-8 8-11 3-8-2Z" />
      <g class="cell-shield">
        <path d="M-15-12A20 20 0 0 1 17-8" />
        <path d="M17 8A20 20 0 0 1-14 13" />
      </g>
    </g>
  );
}

function TumorMassCell(): JSX.Element {
  return (
    <g>
      <circle class="cell-membrane" r="35" />
      <circle class="tumor-mass-shell" r="31" />
      <circle class="tumor-mass-vein tumor-mass-vein-a" r="23" />
      <circle class="tumor-mass-vein tumor-mass-vein-b" r="17" />
      <circle class="tumor-mass-nodule tumor-mass-nodule-a" cx="-13" cy="11" r="6" />
      <circle class="tumor-mass-nodule tumor-mass-nodule-b" cx="14" cy="-12" r="7" />
      <circle class="tumor-mass-nodule tumor-mass-nodule-c" cx="4" cy="18" r="4" />
      <path class="tumor-mass-shed-cue" d="M-44 5C-58 13-58 29-43 34" />
    </g>
  );
}

function CancerCell(props: { type: EnemyId; variant: CellVariant }): JSX.Element {
  return (
    <g class="cell-organism">
      <Switch>
        <Match when={props.type === "basic"}>
          <BasicCell variant={props.variant} />
        </Match>
        <Match when={props.type === "fast"}>
          <FastCell variant={props.variant} />
        </Match>
        <Match when={props.type === "tough"}>
          <ToughCell variant={props.variant} />
        </Match>
        <Match when={props.type === "dividing"}>
          <DividingCell variant={props.variant} />
        </Match>
        <Match when={props.type === "immune_evasive"}>
          <ImmuneEvasiveCell variant={props.variant} />
        </Match>
        <Match when={props.type === "tumor_mass"}>
          <TumorMassCell />
        </Match>
      </Switch>
    </g>
  );
}

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
  const position = (): Point => getPathPosition(props.enemy.pathDistance, props.scene);
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
      data-visual-variant={variant()}
      style={{ "--cell-base": ENEMIES[props.enemy.type].color }}
      transform={`translate(${position().x} ${position().y})`}
      on:click={(event) => props.onPick(event, props.enemy)}
    >
      <CancerCell type={props.enemy.type} variant={variant()} />
      <Show when={marked()}>
        <circle class="marked-halo" r={radius() + 6} />
      </Show>
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
    </g>
  );
}

function ApoptosisEffect(): JSX.Element {
  return (
    <g>
      <g class="death-core">
        <circle class="death-membrane" r="14" />
        <path class="death-nucleus" d="M-8-3C-5-10 5-10 8-3C10 4 3 9-3 8C-9 7-11 2-8-3Z" />
        <circle class="death-bleb death-bleb-a" cx="-12" cy="-5" r="4" />
        <circle class="death-bleb death-bleb-b" cx="10" cy="-10" r="3.5" />
        <circle class="death-bleb death-bleb-c" cx="12" cy="8" r="4.5" />
      </g>
      <g class="apoptotic-body apoptotic-body-a">
        <circle class="death-membrane" r="4.5" />
        <circle class="death-nucleus" r="1.6" />
      </g>
      <g class="apoptotic-body apoptotic-body-b">
        <circle class="death-membrane" r="3.8" />
        <circle class="death-nucleus" r="1.2" />
      </g>
      <g class="apoptotic-body apoptotic-body-c">
        <circle class="death-membrane" r="5" />
        <circle class="death-nucleus" r="1.5" />
      </g>
      <g class="apoptotic-body apoptotic-body-d">
        <circle class="death-membrane" r="3.4" />
      </g>
    </g>
  );
}

function RuptureEffect(): JSX.Element {
  return (
    <g>
      <circle class="rupture-wave" r="13" />
      <path
        class="rupture-membrane"
        d="M0-14L4-8L11-10L10-3L17 1L10 5L11 12L4 9L0 16L-4 9L-12 12L-10 4L-17 0L-10-4L-12-11L-4-8Z"
      />
      <circle class="rupture-droplet rupture-droplet-a" r="3.4" />
      <circle class="rupture-droplet rupture-droplet-b" r="2.8" />
      <circle class="rupture-droplet rupture-droplet-c" r="3.8" />
      <circle class="rupture-droplet rupture-droplet-d" r="2.5" />
    </g>
  );
}

export function CellDeathEffect(props: { death: CellDeathVisual }): JSX.Element {
  return (
    <g
      class={`cell-death cell-death-${props.death.kind} cell-variant-${props.death.variant}`}
      data-death-kind={props.death.kind}
      style={{ "--death-fill": ENEMIES[props.death.type].color }}
      transform={`translate(${props.death.position.x} ${props.death.position.y})`}
      pointer-events="none"
      aria-hidden="true"
    >
      <Switch>
        <Match when={props.death.kind === "apoptosis"}>
          <ApoptosisEffect />
        </Match>
        <Match when={props.death.kind === "rupture"}>
          <RuptureEffect />
        </Match>
      </Switch>
    </g>
  );
}
