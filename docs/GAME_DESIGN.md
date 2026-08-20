# Attack on Cancer game design

## Purpose and tone

Attack on Cancer is a single-level, cartoon microscopic tower defense game.
Biology is optional flavor and a clear visual identity, not a quiz, medical
simulator, or statement about patient care. The v1 goal is a polished,
replayable Skin Tissue level for 16:10 landscape desktop and tablet play.

## Core loop

1. Choose a difficulty and place treatments on open tissue.
2. Start one of 15 manually started waves.
3. Earn Treatment Points (TP) by destroying cells.
4. Spend TP on more treatments or three linear upgrades.
5. Keep cells from reaching the blood-vessel exit.

Every escaping cell adds one metastasis point, including a basic cell released
by a destroyed Dividing cell. The game ends immediately at the selected
metastasis capacity. Clearing wave 15 and every remaining cell wins the run.

## Difficulty

Practice and Standard change only starting TP and metastasis capacity. Challenge also sends 40%
more cells in each fixed wave group while preserving the same enemy mix and release order.

| Difficulty | Starting TP | Metastasis capacity |
| ---------- | ----------: | ------------------: |
| Practice   |         650 |                  20 |
| Standard   |         500 |                  15 |
| Challenge  |         260 |                   7 |

## Treatments

Every treatment has three named, linear upgrades: Calibrated, Focused, and
Breakthrough. Costs, range, damage, cooldowns, and special values live in typed
configuration tables so balance changes do not alter simulation rules.

| Treatment        | Core role               | Special behavior                                      | Attack cue                         |
| ---------------- | ----------------------- | ----------------------------------------------------- | ---------------------------------- |
| Doctor           | Low-cost nearby target  | Fires a reliable syringe strike.                      | Dashed syringe shot.               |
| Chemotherapy     | Group control           | Damages the target and nearby cells.                  | Purple area burst.                 |
| Cytotoxic T Cell | Fast single target      | Immune-evasive cells resist it unless marked.         | Red rapid immune strike.           |
| Radiation Bot    | Long-range heavy damage | Trades high cost and slow attacks for strong hits.    | Heavy gold beam and target lock.   |
| Antibody Therapy | Support and control     | Marks, slows, sensitizes, and removes immune evasion. | Teal antibody chain and mark ring. |

## Cancer cells

| Cell type      | Identity                                           | First wave |
| -------------- | -------------------------------------------------- | ---------: |
| Basic          | Standard low-health cell.                          |          1 |
| Fast           | Low-health, high-speed cell.                       |          4 |
| Tough          | Slow, high-health cell.                            |          5 |
| Dividing       | Releases two Basic cells at its destruction point. |          7 |
| Immune-Evasive | Takes half T Cell damage until antibody-marked.    |         10 |

Cells stay on the fixed path from the primary tumor source to the blood-vessel
exit. A destroyed cell awards configured TP. No v1 enemy is a boss.

## Waves and outcomes

The level has 15 fixed waves. Early waves teach Basic cells; later waves
introduce each new type and progressively mix them. Wave 15 combines every type.

- `CANCER CONTAINED`: Wave 15 is clear and no cells remain.
- `CANCER HAS METASTASIZED`: Escapes reach the selected capacity.

## Interaction and access

- Treatments can be placed only on open tissue; invalid overlap never spends TP.
- A range preview appears during placement and selection.
- Players can pause, choose 1x or 2x speed, sell treatments, and inspect actors.
- Pointer, touch, and keyboard placement provide equivalent core actions.
- The inspect panel is collapsed by default and contains optional descriptions.
- Sound starts off by default; reduced-motion presentation remains readable.

## Persistence

The browser stores only validated, versioned preferences: sound preference,
preferred speed, and the best result per difficulty. A refresh begins a new run.

## V1 boundary

V1 ships one strong level rather than a partial campaign. It does not include:

- Additional maps, branching paths, campaign progression, or metastatic side maps.
- Bosses, Tumor Clusters, or in-progress run saves.
- NK Cells, Cancer Vaccine, Oncolytic Virus, Surgery, CAR-T, or Proton Therapy.
- Mutation, biomarkers, receptor matching, clinical decision-making, or outcomes.
- Accounts, analytics, backend services, routing, external art assets, or mandatory audio.

Future content begins with a separate plan after this vertical slice is stable and fun.
