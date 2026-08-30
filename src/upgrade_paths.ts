import { TOWERS } from "./config";
import type { SignatureUpgradeConfig, TowerId, UpgradeConfig } from "./game_types";
import { TOWER_IDS } from "./tower_ids";

export type UpgradePath = readonly [UpgradeConfig, UpgradeConfig, SignatureUpgradeConfig];

function upgradeCost(type: TowerId, multiplier: number): number {
  const cost = Math.round(TOWERS[type].cost * multiplier);
  return cost;
}

interface OrdinaryUpgradeStats {
  damageMultiplier: number;
  rangeBonus: number;
  cooldownMultiplier: number;
}

function ordinaryUpgrade(
  type: TowerId,
  name: string,
  costMultiplier: number,
  stats: OrdinaryUpgradeStats,
  description: string,
  biologicalFact: string,
  gameRole: string,
): UpgradeConfig {
  return {
    name,
    cost: upgradeCost(type, costMultiplier),
    ...stats,
    description,
    biologicalFact,
    gameRole,
  };
}

function signatureUpgrade(
  type: TowerId,
  name: string,
  signature: SignatureUpgradeConfig["signature"],
  description: string,
  biologicalFact: string,
  gameRole: string,
): SignatureUpgradeConfig {
  return {
    name,
    cost: upgradeCost(type, 2.1),
    damageMultiplier: 1.5,
    rangeBonus: 20,
    cooldownMultiplier: 0.84,
    description,
    biologicalFact,
    gameRole,
    signature,
    signatureName: name,
  };
}

const TIER_TWO_STATS: OrdinaryUpgradeStats = {
  damageMultiplier: 1.28,
  rangeBonus: 10,
  cooldownMultiplier: 0.94,
};

const TIER_THREE_STATS: OrdinaryUpgradeStats = {
  damageMultiplier: 1.35,
  rangeBonus: 14,
  cooldownMultiplier: 0.9,
};

export const UPGRADE_PATHS: Readonly<Record<TowerId, UpgradePath>> = {
  doctor: [
    ordinaryUpgrade(
      "doctor",
      "Calibrated Dose",
      0.7,
      TIER_TWO_STATS,
      "Sharper dose delivery.",
      "Dose calibration controls how much drug reaches a target.",
      "Improves reliable nearby damage.",
    ),
    ordinaryUpgrade(
      "doctor",
      "Combination Protocol",
      1.25,
      TIER_THREE_STATS,
      "A coordinated treatment protocol.",
      "Drug combinations can attack cancer through complementary mechanisms.",
      "Adds stronger follow-up damage and reach.",
    ),
    signatureUpgrade(
      "doctor",
      "DOUBLE TAP",
      "double_tap",
      "Every third shot follows with a second dose.",
      "Combination dosing can use sequential exposures to reach more than one cancer cell.",
      "Every third shot also damages a second in-range cell.",
    ),
  ],
  chemotherapy: [
    ordinaryUpgrade(
      "chemotherapy",
      "Wider Infusion",
      0.7,
      TIER_TWO_STATS,
      "A broader treatment spread.",
      "Infused drugs disperse through local tissue fluid.",
      "Expands splash coverage.",
    ),
    ordinaryUpgrade(
      "chemotherapy",
      "Dose-Dense Cycle",
      1.25,
      TIER_THREE_STATS,
      "A tighter chemotherapy schedule.",
      "Dose-dense chemotherapy reduces time for some tumors to regrow between cycles.",
      "Improves repeated area damage.",
    ),
    signatureUpgrade(
      "chemotherapy",
      "LINGERING CLOUD",
      "lingering_cloud",
      "Leaves a short-lived toxic field.",
      "Some chemotherapy exposure persists locally after delivery.",
      "Damages cells that enter the treatment field.",
    ),
  ],
  t_cell: [
    ordinaryUpgrade(
      "t_cell",
      "Priming Boost",
      0.7,
      TIER_TWO_STATS,
      "A faster immune response.",
      "T cells need activation signals before a strong cytotoxic response.",
      "Improves rapid immune strikes.",
    ),
    ordinaryUpgrade(
      "t_cell",
      "Memory Clone",
      1.25,
      TIER_THREE_STATS,
      "A persistent trained clone.",
      "Activated T cells can proliferate into memory populations.",
      "Adds stronger sustained targeting.",
    ),
    signatureUpgrade(
      "t_cell",
      "CLONAL SURGE",
      "clonal_surge",
      "Repeated hits intensify on one cell.",
      "Clonal immune expansion increases pressure on a recognized target.",
      "Same-target hits ramp damage until the target changes.",
    ),
  ],
  radiation: [
    ordinaryUpgrade(
      "radiation",
      "Tighter Collimation",
      0.7,
      TIER_TWO_STATS,
      "A more focused radiation field.",
      "Collimation shapes radiation to limit dose outside the target.",
      "Improves long-range precision.",
    ),
    ordinaryUpgrade(
      "radiation",
      "Fractionation",
      1.25,
      TIER_THREE_STATS,
      "A planned sequence of radiation doses.",
      "Fractionated radiation distributes treatment across depth and time.",
      "Adds stronger beam delivery.",
    ),
    signatureUpgrade(
      "radiation",
      "PIERCING BEAM",
      "piercing_beam",
      "The beam continues down the route.",
      "Radiation can deposit dose beyond the first target along a tissue depth.",
      "Hits one further cell on the same route for reduced damage.",
    ),
  ],
  antibody: [
    ordinaryUpgrade(
      "antibody",
      "Higher Affinity",
      0.7,
      TIER_TWO_STATS,
      "A tighter molecular match.",
      "Antibody affinity describes how strongly an antibody binds its antigen.",
      "Improves marking pressure.",
    ),
    ordinaryUpgrade(
      "antibody",
      "Longer Half-Life",
      1.25,
      TIER_THREE_STATS,
      "A mark that lasts longer.",
      "Antibody half-life affects how long useful concentrations remain in circulation.",
      "Extends useful target support.",
    ),
    signatureUpgrade(
      "antibody",
      "BISPECIFIC LINK",
      "bispecific_link",
      "One new mark reaches a nearby cell.",
      "Bispecific antibodies can bind two different targets or cells.",
      "New marks spread to one nearby unmarked cell.",
    ),
  ],
  macrophage: [
    ordinaryUpgrade(
      "macrophage",
      "Bigger Gulp",
      0.7,
      TIER_TWO_STATS,
      "A stronger phagocytic cup.",
      "Macrophages engulf targets by extending an actin-supported phagocytic cup.",
      "Improves close-range engulfing damage.",
    ),
    ordinaryUpgrade(
      "macrophage",
      "Chemotaxis Boost",
      1.25,
      TIER_THREE_STATS,
      "A more responsive immune navigator.",
      "Chemotaxis guides immune cells toward chemical signals from damaged tissue.",
      "Improves sustained close-range targeting.",
    ),
    signatureUpgrade(
      "macrophage",
      "TROGOCYTOSIS",
      "trogocytosis",
      "Kills refund part of the cell reward.",
      "Trogocytosis transfers membrane material during immune-cell contact.",
      "A kill refunds treatment points and clears cooldown.",
    ),
  ],
  crispr: [
    ordinaryUpgrade(
      "crispr",
      "Better Guide RNA",
      0.7,
      TIER_TWO_STATS,
      "A more selective guide.",
      "Guide RNA directs a CRISPR editor toward a matching DNA sequence.",
      "Improves repair attempts.",
    ),
    ordinaryUpgrade(
      "crispr",
      "Proofreading",
      1.25,
      TIER_THREE_STATS,
      "A more careful sequence check.",
      "Proofreading steps reduce incorrect molecular edits.",
      "Improves repair reliability.",
    ),
    signatureUpgrade(
      "crispr",
      "BASE EDITOR",
      "base_editor",
      "A faster guaranteed-edit safety net.",
      "Base editors change individual DNA bases without making a full double-strand break.",
      "Guarantees repair after four mismatches and strengthens Tumor Mass edits.",
    ),
  ],
};

export function validateUpgradePaths(): void {
  for (const type of TOWER_IDS) {
    const path = UPGRADE_PATHS[type];
    if (path.length !== 3) throw new Error(`${type} needs exactly three upgrades.`);
    for (const upgrade of path) {
      if (
        upgrade.cost <= 0 ||
        upgrade.biologicalFact.trim() === "" ||
        upgrade.gameRole.trim() === ""
      ) {
        throw new Error(`${type} has incomplete upgrade learning content.`);
      }
    }
  }
}

validateUpgradePaths();
