import { For, Show } from "solid-js";
import type { JSX } from "solid-js";

import { TowerArtwork, UpgradeBurstArtwork } from "../generated/visual_assets";
import type { VisualTier } from "../generated/visual_assets";
import { TOWERS } from "./config";
import { upgradeBurstTier } from "./game_types";
import type { Point, Tower, TowerId, TowerTier, UpgradeBurstTier } from "./game_types";
import { getTowerRange } from "./simulation";
import { actorAnimationDelay } from "./enemy_visuals";

export function towerVisualTier(tier: TowerTier): VisualTier {
  return tier;
}

function towerAimDegrees(tower: Tower): number {
  if (tower.attackPoint === undefined) return 0;
  const horizontal = tower.attackPoint.x - tower.position.x;
  const vertical = tower.attackPoint.y - tower.position.y;
  return (Math.atan2(vertical, horizontal) * 180) / Math.PI;
}

function towerAccessibleName(tower: Tower): string {
  return `${TOWERS[tower.type].name} treatment, tier ${tower.tier + 1}, id ${tower.id}`;
}

export function TowerActor(props: {
  tower: Tower;
  time: number;
  selected: boolean;
  onPick: (tower: Tower) => void;
}): JSX.Element {
  const attacking = (): boolean =>
    props.tower.attackFlashUntil !== undefined && props.tower.attackFlashUntil > props.time;
  const tier = (): VisualTier => towerVisualTier(props.tower.tier);
  const aim = (): string => `${towerAimDegrees(props.tower)}deg`;
  const upgrading = (): boolean =>
    props.tower.upgradeFlashUntil !== undefined && props.tower.upgradeFlashUntil > props.time;
  const burstTier = (): UpgradeBurstTier | undefined => upgradeBurstTier(tier());

  return (
    <g
      class={`tower tower-${props.tower.type}`}
      data-tower-id={props.tower.id}
      data-tower-type={props.tower.type}
      data-visual-state={attacking() ? "attacking" : "idle"}
      data-visual-tier={tier()}
      data-signature={props.tower.tier === 3 ? "unlocked" : undefined}
      data-attack-outcome={props.tower.attackOutcome}
      data-repair-misses={props.tower.repairMisses}
      style={{ "--actor-phase": actorAnimationDelay(props.tower.id) }}
      transform={`translate(${props.tower.position.x} ${props.tower.position.y})`}
      role="button"
      tabIndex={0}
      aria-label={towerAccessibleName(props.tower)}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation();
        props.onPick(props.tower);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          event.stopPropagation();
          props.onPick(props.tower);
        }
      }}
    >
      <circle class="tower-aura" r="29" />
      <Show when={upgrading() && burstTier()}>
        {(upgradeTier) => (
          <g class="tower-upgrade-burst" aria-hidden="true">
            <UpgradeBurstArtwork
              tier={upgradeTier()}
              instanceKey={`upgrade-${props.tower.id}-${props.tower.upgradeFlashUntil ?? 0}`}
            />
          </g>
        )}
      </Show>
      <g class="tower-artwork-aim" style={{ "--tower-aim": aim() }}>
        <TowerArtwork
          type={props.tower.type}
          tier={tier()}
          instanceKey={`tower-${props.tower.id}`}
        />
      </g>
      <g
        class="tower-tier-badge"
        data-tier={tier()}
        aria-hidden="true"
        transform="translate(18 18)"
      >
        <path class="tower-tier-glyph" d="M0-9L9 0L0 9L-9 0Z" />
        <text class="tower-tier-number" x="0" y="4" text-anchor="middle">
          {props.tower.tier + 1}
        </text>
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
