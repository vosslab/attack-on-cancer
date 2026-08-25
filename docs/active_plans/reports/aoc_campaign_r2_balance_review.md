# AOC campaign R2 balance review

## Decision

**PASS -- CP5 balance evidence is sufficient to proceed.** The campaign has a
deterministic, catalog-led purchasing envelope at every level, legal coverage
on every branching field, and real-wave resolutions for two different probe
orders on Levels 3-10. The limited residual below is a durable-test coverage
gap, not a balance blocker: direct deterministic probes also clear Levels 8
and 10 with mixed, lower-cost selections.

## Scope and method

Reviewed the M8/R2 requirements in
`docs/active_plans/active/aoc_ten_level_branching_campaign.md`, the ten level
definitions, `src/levels/campaign.ts`, and route-aware combat in
`src/simulation.ts`. Graphify identified the catalog, economy envelope,
clearance, wave, targeting, and firing dependencies; conclusions below were
verified against the current source and focused deterministic tests.

This review assesses game-model behavior only. It does not make clinical
treatment claims or add a prescribed player strategy.

## Evidence

- **All ten economy envelopes are coherent.** Level 1 starts at each defined
  difficulty's 200/380/500 TP, inside its 200-500 envelope. Level 2 receives
  `min(carryover, 700) + 200`, therefore 200-900. Levels 3-10 declare the
  following entry ranges and transition values (`carryover cap +
  reinforcement`): L3 360-460 (420), L4 260-420 (380), L5 360-460 (420), L6
  470-650 (490), L7 390-460 (435), L8 900-1000 (960), L9 220-370 (285), and
  L10 1450-1550 (1500). `advanceLevel()` implements exactly that capped,
  fresh-field calculation in `src/simulation.ts`, while the catalog validator
  rejects non-finite or inverted envelopes.
- **The executable envelope and plausibility contract passes.**
  `campaign balance keeps authored entry envelopes and supports varied legal
  coverage layouts` in `tests/test_simulation.mjs` enters each Level 3-10
  through the public transition, uses forward and reversed legal probe orders,
  starts every authored wave, applies ordinary legal upgrades, and rejects a
  loss before intermission (or Level 10 victory). It passed together with the
  catalog suite: 34 tests, 34 passing.
- **Maps do not force a single route or a single fixed pad.** The level
  validator requires declared legal/blocked probes to match real route and
  obstacle geometry. The balance fixture uses each level's legal probes rather
  than a hidden placement exception. Multi-route counts are L3/L4/L5/L7: two,
  L6/L9: three, and L8/L10: four. Their source, segment, and merge contracts
  are additionally guarded in `tests/test_level_catalog.mjs`; range and
  splash use coordinates across routes, and clearance checks every route and
  obstacle, both covered by focused simulation fixtures.
- **Pressure varies with the intended topology.** Route lengths range from
  L7's 881-point fast bypass to L9's 2,323-2,745 recurring feeder routes;
  Level 6 has distinct early sources, Level 8 four constrained pockets, and
  Level 10 four independent arrivals before staged convergence. Authored wave
  mixes progress through fast, tough, dividing, immune-evasive, and Tumor Mass
  cells where appropriate. The deterministic route-cycle contract distributes
  each entry across its authored routes, so a passing layout is resolving real
  multi-route traffic rather than a collapsed representative lane.
- **L8/L10 mixed-defense check passes.** The committed fixture's high-investment
  radiation layouts are a useful stress probe, but do not alone demonstrate
  mixed-defense appeal. A read-only deterministic replay using the same public
  APIs did: on L8, two Radiation Bots plus a T Cell and Doctor cleared all
  seven waves from the four legal pockets (16 metastases remaining); reversing
  it also cleared (10 remaining). A two-Radiation/T-Cell/Antibody arrangement
  also cleared when the pocket order put the Antibody first (8 remaining).
  On L10, all three six-pocket patterns tested cleared the actual seven waves:
  T Cell/Chemotherapy/Doctor/Antibody repeated (0 metastases),
  T Cell/Chemotherapy/CAR Macrophage/Antibody repeated (0), and a six-treatment
  mix including CRISPR (6). These are materially below all-radiation spend and
  vary both tower role and placement order.

## Residual and remediation

**Non-blocking evidence gap:** the permanent balance test currently assigns
only Radiation Bots on L8 and L10, so its forward/reversed cases vary coverage
position but not treatment mix. Preserve the present diagnostic radiation
probe, and add one named mixed-defense fixture for each of L8 and L10 using
the passing public-API layouts above. Assert only resolution (and, if desired,
that the total initial spend is below all-radiation), not a particular remaining
TP, metastasis count, or upgrade sequence. This will make the mixed-strategy
evidence durable without turning it into a player prescription.

No blocker found. The review also finds no plan drift: the economy remains
catalog-owned, towers still clear at transitions, all findings use original
game-model behavior, and no new treatment, enemy, replay, or clinical feature
has been introduced.

## Gates run

- `node --import tsx --test tests/test_simulation.mjs tests/test_level_catalog.mjs` -- **PASS**, 34 tests.
- `git diff --check` -- **PASS**.

## Addendum -- mixed-layout contract closed

**Resolved. Final CP5 verdict remains PASS.** The former residual is now
durable evidence rather than a read-only review probe. The current
`tests/test_simulation.mjs` names and drives both layouts entirely through
public simulation actions and real authored waves:

- `Fibrotic Sieve resolves an illustrative mixed defense from constrained legal
  pockets` places two Radiation Bots, a T Cell, and a Doctor at the four named
  legal pockets, then reaches intermission.
- `Metastatic Confluence resolves an illustrative mixed convergence defense`
  places three Radiation Bots plus a T Cell, Chemotherapy, and a Doctor at all
  six named legal pockets, then reaches the Level 10 win state.

The helper asserts each named pocket remains legal before placing, applies
ordinary upgrade actions between waves, and fails on loss. The focused current
simulation lane passes all 24 tests, including both additions. The original
all-Radiation forward/reversed coverage diagnostic remains in place; the two
new tests close the distinct treatment-mix evidence gap without prescribing a
single optimal build.
