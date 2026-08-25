# AOC campaign R1 contract review

## Decision

**BLOCKER: CP2 must not be accepted yet.** The catalog and route-aware simulation
substantially implement C1-C14 and their focused behavior suite passes, but C14 has
not replaced the scene-specific transition API as required and the changed campaign
tree fails the repository's formatter gate.

## Scope and evidence

- Reviewed C1-C14 against
  `docs/active_plans/active/aoc_ten_level_branching_campaign.md` (C1-C14 and CP2
  requirements).
- Used focused Graphify queries for the catalog, route geometry, targeting, effects,
  transitions, and their callers, then verified the current source and tests.
- Visual/cascade inventory (SVG/CSS skill route): canonical route geometry is rendered
  by segment in `src/world_landmarks.tsx:117-126`; theme tokens and reduced-motion
  route rules are in `src/world_visuals.css:13-61,280-290`. World expansion is not an
  R1 acceptance boundary, so no rendered-art decision is made here.

## Findings

1. **Blocker -- C14 generic transition replacement is incomplete.** C14 requires
   replacement of `startClusterScene()` with `advanceLevel()`. Instead,
   `src/simulation.ts:396-398` retains `startClusterScene()` as a public wrapper;
   `src/app.tsx:36,145-146` still imports and calls it, and
   `src/app.tsx:123-128,373-376` still derives the HUD from two scene cases.
   `GameState` also retains required `scene: SceneId` state at
   `src/game_types.ts:6,105-109`, and `src/config.ts:25-36,211-213` retains
   scene-specific path/wave compatibility exports. This creates an architectural
   split between the ten-level simulation and UI transition contract, so the planned
   generic public transition has not been delivered. The current fixture explicitly
   codifies the obsolete wrapper at `tests/test_simulation.mjs:447-450`.

   Impact: Levels 3-10 can advance inside the pure simulation, but the real
   application remains structurally constrained to the Skin/Cluster scene model;
   later P1 work cannot be treated as proof that C14 already met its replacement
   criterion. Resolve in the C14/P1 owner boundary by making the level-aware public
   API and application caller canonical, then invert the compatibility assertion to
   prove the generic API rather than preserve the obsolete one.

2. **Blocker -- repository formatter gate fails in a C3-owned level definition.**
   `npx prettier --check 'src/**/*.{ts,tsx}' ...` reports
   `src/levels/level_02_cluster_corridor.ts` as nonconforming. This violates the
   plan's per-patch Prettier gate and `docs/REPO_STYLE.md` / `docs/TYPESCRIPT_STYLE.md`
   formatter rule. The C3 file cannot pass its handoff gate until it is formatted and
   the focused test lane is rerun.

3. **Pass with test-coverage follow-up -- shared geometry, targeting, inheritance,
   coordinate effects, clearance, and validators are implemented.**
   - Routes refer to reusable segment IDs and cache assembled source-to-exit points
     in `src/levels/campaign.ts:43-58,84-107`; Level 3 uses the same
     `inlet-trunk`, `shared-central-crossing`, and `outlet-trunk` IDs in both routes
     at `src/levels/level_03_capillary_crossroads.ts:87-111`.
   - The validator rejects unknown IDs, discontinuity, cycles, invalid wave route
     cycles, and invalid probe/obstacle references in
     `src/levels/level_definition.ts:186-275,345-470`, with catalog fixtures at
     `tests/test_level_catalog.mjs:77-136` and the Level 6/8/9/10 topology probes at
     `tests/test_level_catalog.mjs:168-216`.
   - Target selection uses remaining arc length and ascending stable IDs on exact
     ties at `src/simulation.ts:525-550`. The unequal-route fixture passes at
     `tests/test_simulation.mjs:530-564`; add an exact-tie assertion, since its
     present inputs test unequal remaining distances rather than the tie clause.
   - Divisions, rupture fragments, shedding, repair records, and visual effects
     retain `routeId` at `src/simulation.ts:610-617,704-721,748-785` and
     `src/enemy_visuals.ts:72-99`; fixtures cover the descendants and visual effects
     at `tests/test_simulation.mjs:452-520` and
     `tests/test_enemy_visuals.mjs:66-85`.
   - Range and splash compare map coordinates rather than route identity at
     `src/simulation.ts:529-535,644-652`, covered by
     `tests/test_simulation.mjs:566-599`. Clearance iterates every assembled route
     plus level obstacles at `src/simulation.ts:181-205`, covered by
     `tests/test_simulation.mjs:601-607`.

## Commands

- `node --import tsx --test tests/test_level_catalog.mjs tests/test_simulation.mjs tests/test_enemy_visuals.mjs` -- PASS, 37 tests.
- `npx tsc --noEmit -p tsconfig.json` -- PASS.
- `npx eslint --max-warnings 0 'src/**/*.{ts,tsx}' 'tests/test_level_catalog.mjs' 'tests/test_simulation.mjs' 'tests/test_enemy_visuals.mjs'` -- PASS.
- `npx prettier --check 'src/**/*.{ts,tsx}' 'tests/test_level_catalog.mjs' 'tests/test_simulation.mjs' 'tests/test_enemy_visuals.mjs'` -- FAIL: `src/levels/level_02_cluster_corridor.ts`.
- `git diff --check` -- PASS.

## Residual risks and handoff

- The direct `node --test ...` command named in C1 does not load TS imports in this
  repository; it fails module resolution. The repository's canonical executable
  lane is the passing `node --import tsx --test ...` command documented in
  `docs/TYPESCRIPT_STYLE.md`.
- Add a stable-ID tie regression test and a structural assertion that a shared
  segment is referenced by both Level 3 routes; the current shared-geometry fixture
  demonstrates matching coordinates but would not independently reject duplicated
  point arrays.
- Handoff: return the C14/P1 scene-contract finding to the campaign owner or planner
  for a boundary decision, then return the isolated C3 formatting failure to its
  owner. Re-run this R1 focused lane after both blockers are resolved.
