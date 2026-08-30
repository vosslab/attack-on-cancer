import { For, Show, createSignal } from "solid-js";
import type { JSX } from "solid-js";
import { render } from "solid-js/web";

import {
  ApoptosisArtwork,
  EnemyArtwork,
  RepairArtwork,
  RuptureArtwork,
  TowerArtwork,
  UpgradeBurstArtwork,
} from "../generated/visual_assets";
import type { ApoptosisFrame, VisualTier, VisualVariant } from "../generated/visual_assets";
import { AttackEffect } from "./attack_effect";
import { ENEMIES, TOWERS } from "./config";
import type { EnemyId, RepairOutcome, Tower, TowerId } from "./game_types";
import { CAMPAIGN_LEVELS } from "./levels/campaign";
import { WorldLandmarks } from "./world_landmarks";

const ENEMY_IDS: readonly EnemyId[] = [
  "basic",
  "fast",
  "tough",
  "dividing",
  "immune_evasive",
  "tumor_mass",
];
const TOWER_IDS: readonly TowerId[] = [
  "doctor",
  "chemotherapy",
  "t_cell",
  "radiation",
  "antibody",
  "macrophage",
  "crispr",
];
const VARIANTS: readonly VisualVariant[] = [0, 1, 2, 3];
const TIERS: readonly VisualTier[] = [0, 1, 2, 3];
const APOPTOSIS_FRAMES: readonly ApoptosisFrame[] = [0, 1, 2, 3, 4];

function displayName(value: string): string {
  if (value === "crispr") return "CRISPR";
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function EnemyPreview(props: {
  type: EnemyId;
  variant: VisualVariant;
  size: "thumbnail" | "game";
}): JSX.Element {
  return (
    <svg class={`catalog-artboard catalog-artboard-${props.size}`} viewBox="-50 -50 100 100">
      <g
        class={`enemy enemy-${props.type} cell-variant-${props.variant}`}
        data-enemy-type={props.type}
        data-visual-state="idle"
        data-visual-variant={props.variant}
        style={{
          "--actor-phase": `-${props.variant * 0.19}s`,
          "--cell-base": ENEMIES[props.type].color,
        }}
      >
        <EnemyArtwork
          type={props.type}
          variant={props.type === "tumor_mass" ? 0 : props.variant}
          instanceKey={`catalog-enemy-${props.type}-${props.variant}-${props.size}`}
        />
      </g>
    </svg>
  );
}

function TowerPreview(props: { type: TowerId; tier: VisualTier }): JSX.Element {
  return (
    <svg class="catalog-artboard catalog-artboard-game" viewBox="-48 -48 96 96">
      <g
        class={`tower tower-${props.type}`}
        data-tower-type={props.type}
        data-visual-state="attacking"
        data-visual-tier={props.tier}
        style={{ "--actor-phase": `-${props.tier * 0.23}s` }}
      >
        <circle class="tower-aura" r="29" />
        <TowerArtwork
          type={props.type}
          tier={props.tier}
          instanceKey={`catalog-tower-${props.type}-${props.tier}`}
        />
      </g>
      <g
        class="tower-tier-badge"
        data-tier={props.tier}
        aria-hidden="true"
        transform="translate(18 18)"
      >
        <path class="tower-tier-glyph" d="M0-9L9 0L0 9L-9 0Z" />
        <text class="tower-tier-number" x="0" y="4" text-anchor="middle">
          {props.tier + 1}
        </text>
      </g>
    </svg>
  );
}

function sampleTower(type: TowerId, id: number, outcome?: RepairOutcome): Tower {
  const tower = {
    id,
    type,
    position: { x: 30, y: 50 },
    tier: 3,
    cooldownRemaining: 0,
    attackPoint: { x: 126, y: 50 },
    attackFlashUntil: 1,
    attackOutcome: outcome ?? (type === "crispr" ? "mismatch" : undefined),
  };
  return tower;
}

function AttackPreview(props: {
  type: TowerId;
  index: number;
  outcome?: RepairOutcome;
}): JSX.Element {
  return (
    <svg class="catalog-attack-artboard" viewBox="0 0 160 100">
      <AttackEffect tower={sampleTower(props.type, props.index + 1, props.outcome)} />
    </svg>
  );
}

function UpgradeBurstPreview(props: { tier: 1 | 2 | 3 }): JSX.Element {
  return (
    <svg class="catalog-artboard catalog-artboard-game" viewBox="-54 -54 108 108">
      <g class="tower-upgrade-burst">
        <UpgradeBurstArtwork
          tier={props.tier}
          instanceKey={`catalog-upgrade-burst-${props.tier}`}
        />
      </g>
    </svg>
  );
}

function DeathPreview(): JSX.Element {
  return (
    <div class="catalog-death-grid">
      <For each={APOPTOSIS_FRAMES}>
        {(frame) => (
          <figure>
            <svg class="catalog-artboard catalog-artboard-game" viewBox="-42 -42 84 84">
              <g class="cell-death" style={{ "--death-fill": ENEMIES.basic.color }}>
                <ApoptosisArtwork frame={frame} instanceKey={`catalog-apoptosis-frame-${frame}`} />
              </g>
            </svg>
            <figcaption>Frame {frame + 1}</figcaption>
          </figure>
        )}
      </For>
      <figure>
        <svg class="catalog-artboard catalog-artboard-game" viewBox="-42 -42 84 84">
          <g class="cell-death" style={{ "--death-fill": ENEMIES.basic.color }}>
            <ApoptosisArtwork instanceKey="catalog-apoptosis-animated" />
          </g>
        </svg>
        <figcaption>Animated apoptosis</figcaption>
      </figure>
      <figure>
        <svg class="catalog-artboard catalog-artboard-game" viewBox="-42 -42 84 84">
          <g class="cell-death" style={{ "--death-fill": ENEMIES.dividing.color }}>
            <RuptureArtwork instanceKey="catalog-rupture" />
          </g>
        </svg>
        <figcaption>Rupture</figcaption>
      </figure>
      <figure>
        <svg class="catalog-artboard catalog-artboard-game" viewBox="-42 -42 84 84">
          <g class="cell-repair cell-repair-catalog">
            <RepairArtwork instanceKey="catalog-repair" />
          </g>
        </svg>
        <figcaption>Successful repair</figcaption>
      </figure>
    </div>
  );
}

function MotionComparison(): JSX.Element {
  return (
    <div class="catalog-motion-grid">
      <figure>
        <div class="catalog-motion-sample">
          <EnemyPreview type="fast" variant={2} size="game" />
          <TowerPreview type="radiation" tier={3} />
        </div>
        <figcaption>Normal motion</figcaption>
      </figure>
      <figure class="reduced-motion-preview">
        <div class="catalog-motion-sample">
          <EnemyPreview type="fast" variant={2} size="game" />
          <TowerPreview type="radiation" tier={3} />
        </div>
        <figcaption>Reduced motion</figcaption>
      </figure>
    </div>
  );
}

export function VisualCatalog(): JSX.Element {
  const [paused, setPaused] = createSignal(false);
  let catalogElement: HTMLElement | undefined;

  function catalogAnimations(): Animation[] {
    if (catalogElement === undefined) return [];
    return catalogElement.getAnimations({ subtree: true });
  }

  function playAnimations(): void {
    for (const animation of catalogAnimations()) animation.play();
    setPaused(false);
  }

  function pauseAnimations(): void {
    for (const animation of catalogAnimations()) animation.pause();
    setPaused(true);
  }

  function replayAnimations(): void {
    for (const animation of catalogAnimations()) {
      animation.cancel();
      animation.play();
    }
    setPaused(false);
  }

  return (
    <main
      class="visual-catalog"
      data-catalog-motion={paused() ? "paused" : "playing"}
      ref={(element) => {
        catalogElement = element;
      }}
    >
      <header class="catalog-header">
        <div>
          <p class="eyebrow">Generated production components</p>
          <h1>Combat visual catalog</h1>
          <p>Editable SVG geometry rendered through the same components and CSS as the game.</p>
        </div>
        <nav class="catalog-controls" aria-label="Animation controls">
          <button type="button" onClick={playAnimations}>
            Play
          </button>
          <button type="button" onClick={pauseAnimations}>
            Pause
          </button>
          <button type="button" onClick={replayAnimations}>
            Replay
          </button>
        </nav>
      </header>

      <section>
        <h2>Enemy variants</h2>
        <For each={ENEMY_IDS}>
          {(type) => (
            <article class="catalog-row">
              <h3>{ENEMIES[type].name}</h3>
              <div class="catalog-asset-grid">
                <For each={type === "tumor_mass" ? ([0] as const) : VARIANTS}>
                  {(variant) => (
                    <figure>
                      <div class="catalog-size-pair">
                        <EnemyPreview type={type} variant={variant} size="thumbnail" />
                        <EnemyPreview type={type} variant={variant} size="game" />
                      </div>
                      <figcaption>Variant {variant + 1}</figcaption>
                    </figure>
                  )}
                </For>
              </div>
            </article>
          )}
        </For>
      </section>

      <section>
        <h2>Treatment tiers and attack states</h2>
        <For each={TOWER_IDS}>
          {(type, index) => (
            <article class="catalog-row">
              <h3>{TOWERS[type].name}</h3>
              <div class="catalog-asset-grid catalog-tower-grid">
                <For each={TIERS}>
                  {(tier) => (
                    <figure>
                      <TowerPreview type={type} tier={tier} />
                      <figcaption>Tier {tier + 1}</figcaption>
                    </figure>
                  )}
                </For>
                <figure>
                  <AttackPreview type={type} index={index()} />
                  <figcaption>{displayName(type)} attack</figcaption>
                </figure>
                <Show when={type === "doctor"}>
                  <For each={[1, 2, 3] as const}>
                    {(tier) => (
                      <figure>
                        <UpgradeBurstPreview tier={tier} />
                        <figcaption>Upgrade burst tier {tier + 1}</figcaption>
                      </figure>
                    )}
                  </For>
                </Show>
                <For
                  each={
                    type === "crispr"
                      ? (["repair", "tumor_suppressed"] as const)
                      : ([] as readonly RepairOutcome[])
                  }
                >
                  {(outcome) => (
                    <figure>
                      <AttackPreview type={type} index={index() + 20} outcome={outcome} />
                      <figcaption>{displayName(outcome)}</figcaption>
                    </figure>
                  )}
                </For>
              </div>
            </article>
          )}
        </For>
      </section>

      <section>
        <h2>Cell death and repair</h2>
        <DeathPreview />
      </section>

      <section>
        <h2>World landmarks and tissue regions</h2>
        <div class="catalog-world-grid">
          <For each={CAMPAIGN_LEVELS}>
            {(level) => (
              <figure data-catalog-level={level.id}>
                <svg class="catalog-world" viewBox="0 0 960 600">
                  <WorldLandmarks level={level.id} />
                </svg>
                <figcaption>
                  Level {level.id}: {level.title}
                </figcaption>
              </figure>
            )}
          </For>
        </div>
      </section>

      <section>
        <h2>Motion modes</h2>
        <MotionComparison />
      </section>
    </main>
  );
}

const root = document.getElementById("catalog-app");
if (root === null) {
  throw new Error("The visual catalog needs a #catalog-app element.");
}
render(() => <VisualCatalog />, root);
