# AOC campaign R1 re-review

## Decision

**BLOCKER: do not accept CP2 yet.** The prior R1 findings named in this
re-review are resolved: `startClusterScene()` is absent, the application calls
`advanceLevel()`, the Level 2 source is formatted, and deterministic tests now
cover both stable-ID target ties and shared segment identity. The current
contract nevertheless retains a parallel two-scene model that C1 and C12 say
must be replaced, and P1/P2 lack a current browser-level transition fixture.

## Scope and current evidence

This review checks C1-C14 and P1 in
`docs/active_plans/active/aoc_ten_level_branching_campaign.md:403-469,530-540`
against the current tree, not the earlier R1 report.

Visual contract route: the display is inline SVG in the playfield. Canonical
segments render once each from catalog data in
`src/world_landmarks.tsx:147-168`; theme tokens are scoped to the playfield in
`src/world_visuals.css:1-118`; route motion is disabled under reduced motion in
`src/world_visuals.css:387-400`; the P1 HUD and briefing use catalog data in
`src/app.tsx:408-435`. This satisfies the requested SVG/CSS review surface for
the campaign contract; no new artwork judgment is required for R1.

## Resolved findings

- **PASS -- C14 public transition migration.** `startClusterScene` has no
  current source or test reference. The single public transition is
  `advanceLevel()` in `src/simulation.ts:396-418`; `App` imports and calls it
  at `src/app.tsx:25-40,145-155`. The synthetic test exercises all nine
  boundaries at `tests/test_simulation.mjs:380-415`, and it passed.
- **PASS -- catalog-led, level-based behavior.** The ordered ten-definition
  registry and cached route assembly are in `src/levels/campaign.ts:20-31,43-107`.
  Wave scheduling, clearance, escapes, targeting, splash, and transition all
  use `state.level` and `routeId` at
  `src/simulation.ts:200-205,343-417,518-544,637-645,717-730`.
- **PASS -- C13 exact shared geometry and targeting.** Level 3 references
  `shared-central-crossing` from both routes, asserted structurally at
  `tests/test_level_catalog.mjs:175-184`; canonical coordinate sampling is
  covered at `tests/test_simulation.mjs:523-529`. Least-remaining-distance and
  exact stable-ID ties are independently covered at
  `tests/test_simulation.mjs:531-565,567-602`.
- **PASS -- C14 route inheritance and coordinate effects.** Descendants and
  Tumor Mass shedding preserve their parent `routeId` at
  `src/simulation.ts:690-714,733-788`, with branch fixtures at
  `tests/test_simulation.mjs:456-520`. Cross-route range/splash is coordinate
  based at `src/simulation.ts:522-544,637-645`, covered at
  `tests/test_simulation.mjs:604-637`.
- **PASS -- C3 formatting.** `src/levels/level_02_cluster_corridor.ts` passes
  the current Prettier gate.
- **PASS -- P1 app data flow.** The HUD shows Level N of 10 and title,
  briefing, route count, accessible description, current theme, and generic
  `WorldLandmarks level` from catalog data at `src/app.tsx:408-435`; the
  intermission control is generic at `src/app.tsx:477-508`.

## Remaining blockers

1. **C1/C12 architectural drift: `SceneId` has not actually been replaced.**
   The plan specifies "`LevelId` replaces the two-value `SceneId`" at
   `docs/active_plans/active/aoc_ten_level_branching_campaign.md:80-85` and
   requires C12 to remove scene-specific route/wave lookups at `:442-447`.
   Current code still makes `scene` required game state
   (`src/game_types.ts:6-8,105-120`), initializes it in the generic simulation
   (`src/simulation.ts:210-227`), and retains `getScenePath()` plus scene-era
   compatibility exports in `src/config.ts:25-36`. `WorldLandmarks` and
   `EnemyActor` also expose optional scene props at
   `src/world_landmarks.tsx:10-14,38-41` and `src/enemy_actor.tsx:42-52`.
   The transition fixture codifies that obsolete value at
   `tests/test_simulation.mjs:380-403`. This leaves a misleading, redundant
   campaign state dimension after the planned migration.

2. **P1/P2 browser proof is stale and does not exercise the generic UI
   transition.** P1 requires a focused browser selector test and P2 requires a
   real-control harness that calls the public transition API
   (`docs/active_plans/active/aoc_ten_level_branching_campaign.md:532-540`).
   `tests/playwright/game.spec.ts:21-111` only covers initial Level 1 controls;
   it contains no campaign HUD, briefing, or Continue-to-Level assertion.
   Moreover, `tests/playwright/visual_assets.spec.ts:352-385` still seeks an
   absent `Enter Cluster Corridor` button and uses scene-era wave numbers
   16-21. That selector is inconsistent with the current generic control in
   `src/app.tsx:505-507`, so the browser suite cannot be evidence for P1/P2
   until it is updated.

## Gates run in this re-review

- `node --import tsx --test tests/test_level_catalog.mjs tests/test_simulation.mjs tests/test_enemy_visuals.mjs` -- **PASS**, 39 tests.
- `npx tsc --noEmit -p tsconfig.json` -- **PASS**.
- `npx eslint --max-warnings 0 'src/**/*.{ts,tsx}' 'tests/test_level_catalog.mjs' 'tests/test_simulation.mjs' 'tests/test_enemy_visuals.mjs'` -- **PASS**.
- `npx prettier --check 'src/**/*.{ts,tsx}' 'tests/test_level_catalog.mjs' 'tests/test_simulation.mjs' 'tests/test_enemy_visuals.mjs'` -- **PASS**.
- `git diff --check` -- **PASS**.

## Residual risks and handoff

- Resolve the remaining SceneId compatibility surface in the C1/C12 owner
  boundary, then update all affected fixtures rather than preserving it as a
  second state model.
- Resolve the P1/P2 browser fixture in its owner boundary: drive real waves to
  intermission, click the visible generic Continue control, and assert catalog
  Level 2 title, briefing, map description, and Level N of 10 HUD. Remove or
  migrate the stale scene-era visual test at the same time.
- Re-run this R1 review's five gates plus the focused built Playwright selector
  test after those two fixes. No other C1-C14 contract blocker was found.
