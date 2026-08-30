import { For, Show } from "solid-js";
import type { JSX } from "solid-js";

import { TOWERS } from "./config";
import type { Tower, UpgradeConfig } from "./game_types";
import {
  getRepairChance,
  getSellValue,
  getTowerCooldown,
  getTowerDamage,
  getTowerRange,
} from "./simulation";
import { UPGRADE_PATHS } from "./upgrade_paths";
import { nextTowerTier } from "./game_types";
import type { UpgradePath } from "./upgrade_paths";

function formatValue(value: number): string {
  const text = value.toFixed(1);
  return text.endsWith(".0") ? text.slice(0, -2) : text;
}

export function TowerInspector(props: {
  tower: Tower;
  treatmentPoints: number;
  onUpgrade: () => void;
  onRequestSignature: () => void;
  onSell: () => void;
}): JSX.Element {
  const path = (): UpgradePath => UPGRADE_PATHS[props.tower.type];
  const upgrade = (): UpgradeConfig | undefined =>
    props.tower.tier === 3 ? undefined : path()[props.tower.tier];
  const nextTower = (): Tower => {
    const nextTier = nextTowerTier(props.tower.tier);
    if (nextTier === undefined) return props.tower;
    return { ...props.tower, tier: nextTier };
  };
  const signatureUpgrade = (): boolean => props.tower.tier === 2;
  const canAfford = (): boolean => {
    const next = upgrade();
    return next !== undefined && props.treatmentPoints >= next.cost;
  };

  return (
    <aside class="tower-card" aria-label="Selected treatment inspector" aria-live="polite">
      <h2>
        {TOWERS[props.tower.type].name} - Tier {props.tower.tier + 1}
      </h2>
      <ol class="tier-ladder" aria-label="Treatment upgrade tiers">
        <For each={[0, 1, 2, 3]}>
          {(tier) => (
            <li
              classList={{ current: tier === props.tower.tier, complete: tier < props.tower.tier }}
            >
              <span>Tier {tier + 1}</span>
              <Show when={tier > 0}>
                <small>{path()[tier - 1]?.name ?? ""}</small>
              </Show>
            </li>
          )}
        </For>
      </ol>
      <p>{TOWERS[props.tower.type].description}</p>
      <Show when={upgrade()} keyed>
        {(next) => (
          <section class="upgrade-preview" aria-label={`Next upgrade: ${next.name}`}>
            <h3>{next.name}</h3>
            <p>{next.description}</p>
            <dl>
              <div>
                <dt>Damage</dt>
                <dd>
                  {formatValue(getTowerDamage(props.tower))} to{" "}
                  {formatValue(getTowerDamage(nextTower()))}
                </dd>
              </div>
              <div>
                <dt>Range</dt>
                <dd>
                  {formatValue(getTowerRange(props.tower))} to{" "}
                  {formatValue(getTowerRange(nextTower()))}
                </dd>
              </div>
              <div>
                <dt>Fire rate</dt>
                <dd>{formatValue(1 / getTowerCooldown(nextTower()))} / s</dd>
              </div>
            </dl>
            <p>
              <strong>Game role:</strong> {next.gameRole}
            </p>
            <p>
              <strong>Biology:</strong> {next.biologicalFact}
            </p>
          </section>
        )}
      </Show>
      <Show when={props.tower.type === "crispr"}>
        <p class="repair-status" aria-live="polite">
          Next repair chance: {Math.round(getRepairChance(props.tower) * 100)}% after{" "}
          {props.tower.repairMisses ?? 0} sequence mismatches.
        </p>
      </Show>
      <button
        type="button"
        disabled={upgrade() === undefined || !canAfford()}
        onClick={() => (signatureUpgrade() ? props.onRequestSignature() : props.onUpgrade())}
      >
        {upgrade() === undefined
          ? "Maximum tier"
          : `${signatureUpgrade() ? "Unlock signature" : "Upgrade"}: ${upgrade()?.name ?? ""} (${upgrade()?.cost ?? 0} TP)`}
      </button>
      <button type="button" onClick={props.onSell}>
        Sell for {getSellValue(props.tower)} TP
      </button>
    </aside>
  );
}
