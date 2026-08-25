# Plan: expand Attack on Cancer to a ten-level branching campaign

## Context

Attack on Cancer currently has two hard-coded scenes: the 15-wave Skin Tissue route and
the six-wave Cluster Corridor. Each scene has exactly one path, and the simulation models an
enemy only by its distance along that path. The next campaign must add eight original levels
without duplicating geometry between the simulation, placement rules, and rendered SVG route.

The player asked for creative tower-defense positioning, with branches as a required map
feature. The existing game already proves the right foundation: one pure deterministic
simulation, a 16:10 SolidJS playfield, visible UI placement, generated editable SVG artwork,
and production-shaped browser checks. This plan turns the two-scene special case into a
ten-level campaign model before adding content.

## Objectives

- Deliver a ten-level campaign that retains the first two maps and adds eight original,
  branch-driven maps with distinct tower-placement problems.
- Make an ordered typed campaign registry and independently readable level definitions the source
  of truth for routes, waves, landmarks, placement obstacles, redeployment economy, player-facing
  copy, and accessible map descriptions.
- Preserve deterministic simulation, readable 16:10 presentation, pointer/touch/keyboard
  placement, reduced-motion support, and the editable SVG asset workflow.
- Validate level progression and every multi-route rule with behavior-focused simulation,
  real-UI browser, generated-asset, and rendered screenshot evidence.

## Design philosophy

Use "Fix the design, not the symptom": replace the `scene === 1 ? ... : ...` special cases
with a campaign catalog rather than layering eight more conditionals on the two-scene model.
Maps teach placement through visible splits, rejoining lanes, crossing coverage zones, and
biologically meaningful obstacles. Each map uses original art and clear legal spaces to express one
positioning lesson before its wave counts are tuned. This follows "Polish over expansion."

- Evidence strategy for uncertain methods: deterministic simulation is the authoritative proof of
  route and progression behavior; a real-browser build proves the same campaign is reachable
  through controls. Use coverage-aware and branch-ignoring layouts as diagnostic probes, then
  tune until several reasonable multi-route strategies are viable and ignoring a branch creates
  visible pressure.

## Scope

- Migrate the existing two scenes into a data-driven ten-level campaign catalog.
- Add Levels 3-10, each with at least two playable enemy routes and a distinct placement lesson.
- Extend simulation, rendering, UI progression, tests, generated world artwork, CSS, screenshots,
  README, and changelog documentation for the campaign.
- Balance reinforcements, rewards, refunds, and wave pressure as one whole-campaign economy.

## Non-goals

- Exclude a player-facing level-select screen and arbitrary replay; the linear campaign is enough.
- Exclude new treatment types, enemy species, microtransactions, and clinical-treatment claims.
- Exclude Bloons TD 6 maps, artwork, characters, UI, names, and route geometry.
- Exclude in-progress campaign persistence and a server-side profile system.

## Current state summary

- `SceneId` is `1 | 2`; `GameState.scene`, `getScenePath()`, `startClusterScene()`, HUD copy,
  landmark rendering, and win logic encode the two-scene boundary directly.
- Every enemy, spawn, repair effect, target decision, visual lane, and escape check assumes one
  route per scene. Raw path distance currently defines the front-most target.
- `src/world_landmarks.tsx` draws one route three times from the same sampled points. This is
  the correct rendering pattern to retain, but it needs to iterate a level's complete route set.
- `assets/visuals/` and `generate_visual_assets.py` are the editable, validated world-art source;
  generated TSX is ignored build output. `src/world_visuals.css` owns route and tissue paint.
- The worktree already contains unrelated visual-system changes. Campaign work preserves and
  incorporates those changes rather than reverting or overwriting them.

## Architecture boundaries and ownership

The campaign registry is the canonical content model, but it remains small: it owns level order
and imports one readable typed definition per level. Each definition owns its title, briefing,
theme tokens, route geometry, source and exit landmarks, waves, branch cycles, placement
obstacles, probes, and redeployment parameters. A central validator checks every definition in
its own level context before play begins, including route IDs, segment continuity, wave cycles,
and obstacle and landmark references. No TypeScript declaration alone is treated as proof that an
authored map is coherent.

`LevelId` replaces the two-value `SceneId`; a `RouteId` identifies one complete source-to-exit
route inside a level. `Enemy`, pending spawn, and repair-event records carry `routeId`. Routes
are ordered lists of reusable `RouteSegmentDefinition` IDs. A shared trunk, split, or merge uses
the exact same segment point sequence, sampled once, instead of visually similar duplicate
polylines. The assembled route points are the only geometry used for simulation, clearance,
actors, and route paint.

The campaign uses an explicit `routeCycle` on each wave entry. Spawns repeat that cycle, so the
upper/lower or multi-source distribution is authored, deterministic, and visible in tests.
"Front-most" targeting means least remaining arc length to escape, not greatest percentage of a
route completed; this makes an enemy on the physically nearer path the priority. Stable IDs break
ties. Route IDs govern movement and inherited descendants only. Attack range, splash, beams, and
other area effects use battlefield coordinates, so a tower beside a crossing can affect enemies
on different routes when they are physically in range. Divided cells, Tumor Mass shed cells,
rupture fragments, repair effects, and escapes retain their parent route.

Every level also names representative legal strategic placement probes and illegal route or
obstacle probes. They test the authored lesson without turning open-tissue placement into a
fixed-pad system. Level transitions keep the current fresh-build-field idea: towers clear and
metastases persist. A typed entry purchasing-power envelope sets the intended affordable strength
for each level; reinforcements and carryover caps are then tuned primarily to keep a normally
successful player inside that envelope rather than as unrelated controls.

### Visual contract

- Audience and state: a player planning a placement on a 16:10 microscopic battlefield at 680,
  1280, and 1600 pixel viewports, with normal and reduced motion.
- Hierarchy: a level-and-wave HUD labels the map; route splits, merges, landmarks, legal open
  tissue, and blocked biological structures remain legible behind towers and cells.
- Route semantics: spatial separation, joins, and labeled landmarks identify every branch; color
  supports the route surface alongside those durable cues.
- CSS surface: `src/world_visuals.css` gains scoped per-theme custom properties on
  `.playfield[data-level-theme]`; `src/style.css` owns the responsive campaign HUD and overlay.
  `src/combat_visuals.css` remains the combat-only surface.
- Motion: circulation can clarify route direction; branch identity remains clear while motion is
  disabled. The existing `prefers-reduced-motion` and catalog preview contracts extend to every
  new landmark.
- SVG delivery: editable source sheets use stable viewBoxes, semantic groups, unique IDs, and
  namespaced generated instances. Labels and progress copy remain typed DOM text, not flattened
  into the decorative artwork.

### Level roster and placement lessons

| Level | Map | Routes and sources | Primary placement lesson |
| --- | --- | --- | --- |
| 1 | Skin Tissue | Existing curve, one source | Open-tissue baseline |
| 2 | Cluster Corridor | Existing long curve, one source | Rebuild and staged coverage |
| 3 | Capillary Crossroads | 2 split/merge routes, one source | Shared crossings |
| 4 | Lymph Node Loop | 2 counter-loops, one source | Central hub repetition |
| 5 | Alveolar Switchbacks | 2 hairpins, one source | Parallel coverage |
| 6 | Ductal Delta | 3 routes, two sources | Independent early threats |
| 7 | Vascular Bypass | 2 unequal routes, one source | Asymmetric escape risk |
| 8 | Fibrotic Sieve | 4 lanes, one source | Constrained placement |
| 9 | Marrow Lattice | 3 feeders, one source | Repeated exposure zones |
| 10 | Metastatic Confluence | 4 routes, four sources | Timed convergence |

- Level 1 preserves the existing introductory open-tissue baseline. Level 2 preserves its
  existing long-route geometry but uses fresh-field redeployment, staggered fast/armored waves,
  and a blocked central cluster to teach planned long-range and late-bend coverage rather than
  repeat Level 1's open-placement lesson.
- Level 3 splits into two branches, then merges twice, rewarding coverage at the crossings rather
  than a tower that chases one arm.
- Level 4 sends two routes in opposite directions around a lymph follicle, rewarding the central
  loop hub where both receive repeated exposure.
- Level 5 places upper and lower hairpins around air spaces, rewarding long range across parallel
  switchbacks and protection of late bends.
- Level 6 starts from two independent duct sources with distinct early threats. Their routes split
  across three ducts and rejoin late, so the player must cover early origins before the delta neck
  offers shared fire; route cycles make the two-source timing deterministic and inspectable.
- Level 7 pairs a short fast bypass with a long armored route, forcing a choice between immediate
  interception and durable coverage.
- Level 8 uses visible scar tissue to remove the obvious tower positions. Its named placement
  probes establish awkward but intentional legal pockets; route count provides context, while
  constrained placement is the defining challenge.
- Level 9 threads three feeders through recurring marrow-node combat zones. Each route revisits
  the same zone later in its journey, rewarding persistent splash and beam coverage instead of
  merely maximizing the number of simultaneously overlapping lanes.
- Level 10 begins with four independent sources, then uses scheduled first and second merges to
  create progressively denser traffic before one exit. Wave timing makes early interception and
  later convergence coverage separate decisions, including during branch-aware Tumor Mass waves.

The catalog encodes each level's topology contract alongside its placement lesson: source landmark
references, ordered shared segments, named recurring combat zones, timed merge landmarks, and
named legal and illegal placement probes. Validator fixtures assert that Level 6 has two distinct
source landmarks; Level 8's named strategic pockets remain legal while scar and route probes do
not; Level 9's routes revisit its declared combat zones; and Level 10 preserves independent early
segments before each declared merge. These are structural checks, not a prescribed tower layout.

The Bloons TD 6 image survey informs only the broad spatial vocabulary of winding routes,
intersections, and alternate paths, including the [Bloonarius Prime alternate-path guide]
(https://steamcommunity.com/sharedfiles/filedetails/?id=2572643018). Every level above remains
an original microscopic-tissue composition with original biology art and route geometry.

### Mapping (milestones / workstreams -> components / patches)

| Milestone / Workstream | Component | Review boundary |
| --- | --- | --- |
| M1-M3 / WS-Campaign | Types, catalog, simulation | Deterministic topology and combat tests |
| M4-M6 / WS-World | Art, generator, world CSS | Generated SVG and browser render fixtures |
| M7-M8 / WS-Play | UI, campaign economy, copy | Synthetic transitions and balance probes |
| M9-M10 / WS-Proof | Tests, captures, docs | Built-artifact E2E and documented gates |

## Milestone plan

| M | Title | Summary | Goal |
| --- | --- | --- | --- |
| M1 | Contract types | Define map data contract | Safe authoring |
| M2 | Catalog migration | Move existing maps to data | Preserve behavior |
| M3 | Route simulation | Generalize combat and transition | Correct branches |
| M4 | Level 3 slice | Prove one complete branch map | Reusable world pipeline |
| M5 | Mid-campaign worlds | Build Levels 4-6 | Distinct spatial lessons |
| M6 | Late-campaign worlds | Build Levels 7-10 | Distinct final challenges |
| M7 | Campaign UI | Generalize visible flow | Reachable level sequence |
| M8 | Economy and waves | Tune campaign power | Viable varied strategies |
| M9 | Integrated proof | Run real built campaign | Automated release evidence |
| M10 | Close-out | Publish and integrate | Complete material tree |

### Status tracker

| Milestone | Status | Completion record |
| --- | --- | --- |
| M1 | planned | CP1 contract |
| M2 | planned | Catalog compatibility |
| M3 | planned | CP2 topology and R1 |
| M4 | planned | CP3 Level 3 slice |
| M5 | planned | Level 4-6 worlds |
| M6 | planned | Level 7-10 worlds |
| M7 | planned | UI and transition fixtures |
| M8 | planned | CP5 economy and R2 |
| M9 | planned | Browser, visual, and R3 proof |
| M10 | planned | Final integration gate |

### Define the campaign contract

- Milestone: M1.
- Depends on: none -- the shared type contract is the first stable input.
- Deliverables: `LevelId`, segment, route, placement-probe, economy-envelope, and level
  interfaces plus a central structural validator.
- Workstreams: WS-Campaign.
- Entry criteria: none.
- Exit criteria: C1 rejects invalid route IDs, segment continuity, branch cycles, landmarks,
  obstacles, and placement probes; manager records CP1.
- Parallel-plan ready: no -- one owner must establish the shared interfaces and test fixture.

### Migrate the existing campaign

- Milestone: M2.
- Depends on: M1 / CP1 -- all definitions import the shared contract.
- Deliverables: ordered registry plus independently readable Level 1 and Level 2 definitions.
- Workstreams: WS-Campaign.
- Entry criteria: C1 and CP1 pass.
- Exit criteria: C2-C11 validate independently; C12's compatibility fixtures preserve Levels 1-2.
- Parallel-plan ready: yes -- max parallel doers: 10, one fresh owner per level definition.

### Generalize deterministic route simulation

- Milestone: M3.
- Depends on: M2 / C12 -- catalog order and local references must be settled first.
- Deliverables: reusable shared segments, route-aware actors and effects, least-remaining-distance
  targeting, generic level advance, and pure simulation fixtures.
- Workstreams: WS-Campaign, WS-Review.
- Entry criteria: C12 compatibility fixtures pass.
- Exit criteria: C13-C14 pass unequal-route, descendant, spatial-splash, clearance, and all-level
  transition fixtures; R1 independently checks the migration contract.
- Parallel-plan ready: no -- C13 and C14 both own the central simulation module in sequence.

### Prove the Level 3 branching vertical slice

- Milestone: M4.
- Depends on: M3 / CP2 -- the generic route behavior must be proved before rendering a branch.
- Deliverables: Capillary Crossroads geometry, SVG, generator entry, generic renderer, CSS tokens,
  accessibility copy, placement probes, and an automated browser scenario.
- Workstreams: WS-World, WS-Proof.
- Entry criteria: CP2 and R1 pass.
- Exit criteria: W1-W4 validate generated SVG, route rendering, legal placement, blocked probes,
  accessible copy, and built-artifact interaction; manager records CP3.
- Parallel-plan ready: yes -- max parallel doers: 2, because W1 and W2 own separate files.

### Add mid-campaign branching worlds

- Milestone: M5.
- Depends on: M4 / CP3 -- the Level 3 asset contract is the reusable authoring baseline.
- Deliverables: Level 4-6 geometry, original editable SVG sheets, landmarks, obstacles, and theme
  tokens using the proved Level 3 pipeline.
- Workstreams: WS-World.
- Entry criteria: W4 passes.
- Exit criteria: W5-W7 produce valid SVG and target-width fixtures for Levels 4-6.
- Parallel-plan ready: yes -- max parallel doers: 3, with one world sheet per owner.

### Add late-campaign branching worlds

- Milestone: M6.
- Depends on: M4 / CP3 -- the Level 3 asset contract is the reusable authoring baseline.
- Deliverables: Level 7-10 geometry, original editable SVG sheets, landmarks, obstacles, and
  theme tokens using the proved Level 3 pipeline.
- Workstreams: WS-World.
- Entry criteria: W4 passes.
- Exit criteria: W8-W11 produce valid SVG and target-width fixtures for Levels 7-10.
- Parallel-plan ready: yes -- max parallel doers: 4, with one world sheet per owner.

M5 and M6 dispatch concurrently after M4 because they own disjoint level definitions and SVG
sheets. Their final shared CSS fixture task waits for both.

### Generalize campaign UI and progression

- Milestone: M7.
- Depends on: M3-M4 / CP3 -- it consumes generic catalog data, not later SVG files.
- Deliverables: catalog-fed HUD, briefings, overlays, and Level N of 10 transition controls.
- Workstreams: WS-Play, WS-Proof.
- Entry criteria: W4 and C14 pass.
- Exit criteria: P1-P2 pass catalog UI, synthetic transitions, and visible-control fixtures.
- Parallel-plan ready: yes -- max parallel doers: 2, because UI and test harness files have
  independent ownership.

### Balance waves and campaign economy

- Milestone: M8.
- Depends on: M5-M7 / W12 and P1-P2 -- final terrain and player flow define meaningful balance.
- Deliverables: Level 3-10 waves, route cycles, reinforcement, carryover caps, and purchasing-
  power envelope data.
- Workstreams: WS-Play, WS-Review.
- Entry criteria: W12, P1, and P2 pass.
- Exit criteria: P3 reports viable coverage-aware layouts and entry buying power inside every
  envelope; R2 independently confirms several layouts remain viable.
- Parallel-plan ready: no -- P3 edits all level definitions as one coherent economy pass.

### Run integrated automated campaign proof

- Milestone: M9.
- Depends on: M8 / CP5 and R2 -- the evidence must exercise the final balance data.
- Deliverables: behavior tests, production-built browser walkthrough, and viewport captures.
- Workstreams: WS-Proof, WS-Review.
- Entry criteria: P3 and R2 pass.
- Exit criteria: T1-T2, B1, V1, and R3 prove the real UI reaches Level 10 through visible controls
  and all visual assertions plus audit findings pass.
- Parallel-plan ready: yes -- max parallel doers: 2, for independent E2E and visual fixture tasks.

### Complete documentation and release checks

- Milestone: M10.
- Depends on: M9 / automated evidence reports -- documentation must describe final artifacts.
- Deliverables: README, changelog, screenshots, plan progress record, and closure report.
- Workstreams: WS-Proof, WS-Integrate.
- Entry criteria: T1-T2 and independent review reports pass.
- Exit criteria: D1 documents final evidence; I1 passes all named gates and archives the plan.
- Parallel-plan ready: no -- documentation needs the final capture paths, then integration owns the
  material tree.

## Workstream breakdown

The manager completes this plan autonomously. It establishes the shared model contract, then
dispatches each ready task to a fresh subagent with exclusive file ownership. Every task receives a
collision-safe report path under a manager-chosen temporary run directory and returns the compact
handoff required by the parallel-plan workflow. The manager integrates each dependency layer, runs
its checkpoint, and redispatches the owner task when a fixture identifies a failure.

### Workstream WS-Campaign: catalog and simulation

- Goal: replace two-scene special cases with validated level definitions and deterministic branches.
- Owner: `expert_coder`.
- Work packages: C1-C14.
- Interfaces: needs current route/wave behavior; provides `CAMPAIGN_LEVELS`, route geometry, and
  public simulation transitions to every other workstream.
- Review boundary: `src/game_types.ts`, `src/levels/`, `src/config.ts`, and simulation behavior.

### Workstream WS-World: original editable worlds

- Goal: turn canonical routes and landmarks into original responsive SVG worlds without geometry
  duplication.
- Owner: `expert_coder` using the SVG and CSS expert skills.
- Work packages: W1-W12.
- Interfaces: needs validated level definitions and generic path helpers; provides generated world
  components, route rendering, placement visuals, and theme tokens to UI and proof workstreams.
- Review boundary: `assets/visuals/`, `generate_visual_assets.py`, `src/world_landmarks.tsx`, and
  `src/world_visuals.css` / `src/style.css` only.

### Workstream WS-Play: campaign flow and economy

- Goal: make every catalog level reachable and strategically distinct through real controls.
- Owner: `coder`.
- Work packages: P1 and P3.
- Interfaces: needs final routes, world rendering, and simulation transitions; provides catalog UI,
  briefings, progression, and balanced wave/economy data to proof work.
- Review boundary: `src/app.tsx` and Level 3-10 definition economy/wave fields; Solid state reads
  the shared simulation rules.

### Workstream WS-Proof: automated evidence

- Goal: provide deterministic, browser, asset, and documentation proof from the integrated game.
- Owner: `tester` for test packages, `playwright_operator` for browser capture, and `planner` for
  documentation.
- Work packages: P2, T1, T2, B1, V1, and D1.
- Interfaces: needs final integrated gameplay; provides test reports, built-artifact captures, and
  final documentation to integration.
- Review boundary: `tests/`, capture helpers, `README.md`, `docs/CHANGELOG.md`, and screenshots.

### Workstream WS-Review: independent agent assessment

- Goal: independently assess contract conformance, balance evidence, and rendered map readability.
- Owner: `reviewer`, with `image_evaluator` for screenshot assessment.
- Work packages: R1-R3.
- Interfaces: needs immutable task reports and captures; provides pass/fail review reports without
  production edits.
- Review boundary: read-only assessment and run-specific report artifacts only.

### Workstream WS-Integrate: final material tree

- Goal: merge completed work, resolve conflicts, and run the named release gates.
- Owner: `integrator`.
- Work packages: I1.
- Interfaces: needs accepted work package reports and documentation; provides the final closure
  report and archived plan.
- Review boundary: integration sequencing and final validation; no feature redesign.

## Work packages

Tasks in the same `Parallel` group start together after all listed dependencies pass. Each task has
an exclusive file boundary and delivers a complete implementation with its verification evidence.
Milestones govern integration checkpoints, not idle time: the manager dispatches every package as
soon as its own dependencies pass, then marks its milestone complete only at the declared gate.

### Campaign contract

- Work package: C1 -- define contract types.
- Owner: `expert_coder`; depends on: none.
- Owns: `src/game_types.ts`, `src/levels/level_definition.ts`, and
  `tests/test_level_catalog.mjs`.
- Outcome: defines level, segment, route, obstacle, landmark, probe, and economy-envelope types;
  validates every local reference.
- Verification: `node --test tests/test_level_catalog.mjs`.
- Obvious follow-on: publish the validated interfaces, then dispatch C2-C11 and W1.

### Level definitions

- Work packages: C2-C11 -- author one complete level definition per fresh owner in parallel.
- C2 owner: `expert_coder`; depends on C1; owns `src/levels/level_01_skin_tissue.ts`; preserves
  the complete current Skin Tissue geometry, waves, landmarks, and economy. Verify with the Level
  1 fixture.
- C3 owner: `expert_coder`; depends on C1; owns `src/levels/level_02_cluster_corridor.ts`;
  preserves the complete Cluster Corridor data and adds its staged-coverage lesson. Verify with the
  Level 2 fixture.
- C4 owner: `expert_coder`; depends on C1; owns `src/levels/level_03_capillary_crossroads.ts`;
  creates exact shared-segment topology, landmarks, probes, waves, and economy. Verify with its
  local validator.
- C5 owner: `expert_coder`; depends on C1; owns `src/levels/level_04_lymph_node_loop.ts`; creates
  central repetition around the lymph follicle. Verify with its local validator fixture.
- C6 owner: `expert_coder`; depends on C1; owns `src/levels/level_05_alveolar_switchbacks.ts`;
  creates parallel long-range coverage decisions. Verify with its local validator fixture.
- C7 owner: `expert_coder`; depends on C1; owns `src/levels/level_06_ductal_delta.ts`; creates
  two-source early threats before the late delta neck. Verify with its local validator fixture.
- C8 owner: `expert_coder`; depends on C1; owns `src/levels/level_07_vascular_bypass.ts`; creates
  unequal route risk. Verify with its local validator fixture.
- C9 owner: `expert_coder`; depends on C1; owns `src/levels/level_08_fibrotic_sieve.ts`; creates
  constrained legal pockets among scar and route probes. Verify with its local validator fixture.
- C10 owner: `expert_coder`; depends on C1; owns `src/levels/level_09_marrow_lattice.ts`; creates
  recurring marrow-node combat zones. Verify with its local validator fixture.
- C11 owner: `expert_coder`; depends on C1; owns `src/levels/level_10_metastatic_confluence.ts`;
  creates four independent sources and staged merges. Verify with its local validator fixture.
- Obvious follow-on: hand all validated definitions to C12; each task stays within its named file.

### Campaign registry

- Work package: C12 -- assemble the campaign registry.
- Owner: `expert_coder`; depends on: C2-C11 -- every definition is required for ordered validation.
- Owns: `src/levels/campaign.ts`, `src/config.ts`, and `tests/test_level_catalog.mjs`.
- Outcome: assembles the ordered registry, validates it at startup, and removes scene-specific
  route and wave lookups.
- Verification: `node --test tests/test_level_catalog.mjs`.
- Obvious follow-on: release `CAMPAIGN_LEVELS` to C13 and W3.

### Route movement and targeting

- Work package: C13 -- migrate path movement and targeting.
- Owner: `expert_coder`; depends on: C12 -- the registry supplies canonical assembled points.
- Owns: `src/simulation.ts` and `tests/test_simulation.mjs`.
- Outcome: samples segments once; migrates movement, clearance, escapes, and targeting to
  `(level, routeId)`; uses least remaining arc length with stable ID ties.
- Verification: the unequal-route targeting fixture.
- Obvious follow-on: preserve this geometry contract when C14 adds all effects.

### Route-aware effects and transitions

- Work package: C14 -- generalize effects and transitions.
- Owner: `expert_coder`; depends on: C13 -- movement and targeting behavior is now stable.
- Owns: `src/simulation.ts`, `src/enemy_visuals.ts`, `src/enemy_actor.tsx`,
  `tests/test_enemy_visuals.mjs`, and `tests/test_simulation.mjs`.
- Outcome: preserves route IDs in descendants and effects, keeps range/splash coordinate-based,
  and replaces `startClusterScene()` with `advanceLevel()`.
- Verification: branch-descendant, cross-route-splash, and synthetic-transition fixtures.
- Obvious follow-on: submit C1-C14 to independent R1 review before world expansion.

### Generated-art foundation

- Work packages: W1-W2 -- build independent generator and Level 3 SVG inputs in parallel.
- W1 owner: `expert_coder`; depends on C1; owns `generate_visual_assets.py` and
  `tests/test_generate_visual_assets.py`; derives `WorldArtworkId` and component emission from the
  validated artwork catalog. Verify with the generator pytest test under `source_me.sh`.
- W2 owner: `expert_coder`; depends on C4; owns `assets/visuals/world_capillary_crossroads.svg`;
  creates the complete Level 3 SVG sheet with semantic groups, local IDs, and no learner text.
  Verify with the SVG validator and `rsvg-convert`.
- Obvious follow-on: hand generated-art and Level 3 sheet reports to W3/W4.

### Level 3 vertical slice

- Work packages: W3-W4 -- render and prove the reference branch map.
- W3 owner: `expert_coder`; depends on C12-C13; owns `src/world_landmarks.tsx`,
  `src/world_visuals.css`, and `src/style.css`; renders canonical segments and landmarks with
  scoped route/theme hooks and reduced-motion support. Verify the Level 3 render fixture at 680,
  1280, and 1600 pixels.
- W4 owner: `tester`; depends on W1-W3 and C14; owns `tests/playwright/visual_assets.spec.ts`;
  automates legal crossing placement, route/obstacle rejection, branch rendering, and accessible
  map copy. Verify with the focused Level 3 `./run_playwright_tests.sh --build` spec.
- Obvious follow-on: CP3 permits W5-W11 to use the validated asset and renderer contract.

### Remaining world sheets

- Work packages: W5-W11 -- create the remaining independent SVG sheets in parallel.
- W5 owner: `expert_coder`; depends on W1, W3, and C5; owns
  `assets/visuals/world_lymph_node_loop.svg`. Creates the complete Level 4 world sheet. Verify SVG
  validation and thumbnail rendering.
- W6 owner: `expert_coder`; depends on W1, W3, and C6; owns
  `assets/visuals/world_alveolar_switchbacks.svg`. Creates the complete Level 5 world sheet.
  Verify SVG validation and thumbnail rendering.
- W7 owner: `expert_coder`; depends on W1, W3, and C7; owns
  `assets/visuals/world_ductal_delta.svg`. Creates the complete Level 6 world sheet. Verify SVG
  validation and thumbnail rendering.
- W8 owner: `expert_coder`; depends on W1, W3, and C8; owns
  `assets/visuals/world_vascular_bypass.svg`. Creates the complete Level 7 world sheet. Verify
  SVG validation and thumbnail rendering.
- W9 owner: `expert_coder`; depends on W1, W3, and C9; owns
  `assets/visuals/world_fibrotic_sieve.svg`. Creates the complete Level 8 world sheet. Verify SVG
  validation and thumbnail rendering.
- W10 owner: `expert_coder`; depends on W1, W3, and C10; owns
  `assets/visuals/world_marrow_lattice.svg`. Creates the complete Level 9 world sheet. Verify SVG
  validation and thumbnail rendering.
- W11 owner: `expert_coder`; depends on W1, W3, and C11; owns
  `assets/visuals/world_metastatic_confluence.svg`. Creates the complete Level 10 world sheet.
  Verify SVG validation and thumbnail rendering.
- Obvious follow-on: pass all sheet reports to W12; W12 owns the shared CSS integration.

### All-world presentation fixtures

- Work package: W12 -- finalize world presentation fixtures.
- Owner: `expert_coder`; depends on W5-W11 -- every sheet needs final shared CSS coverage.
- Owns: `src/world_visuals.css`, `src/style.css`, and `tests/playwright/visual_assets.spec.ts`.
- Outcome: finalizes per-level tokens and asserts route, obstacle, overflow, and reduced-motion
  states for every world.
- Verification: the three-width visual fixture suite.
- Obvious follow-on: give final terrain fixtures to P3 and T2.

### Player flow and transition fixtures

- Work packages: P1-P2 -- implement catalog UI and independent test harnesses in parallel.
- P1 owner: `coder`; depends on C14 and W3; owns `src/app.tsx`. Replaces scene strings with catalog
  titles, a Level N of 10 HUD, briefings, aria labels, and visible controls. Verify the focused
  browser selector test.
- P2 owner: `tester`; depends on C14; owns `tests/test_simulation.mjs` and
  `tests/playwright/game.spec.ts`, plus the new `tests/helpers/campaign_debug_harness.mjs`.
  The debug harness starts real waves, advances the real simulation to intermission, and calls the
  public transition API. It supplies synthetic transition fixtures and a real-control browser
  harness that advances real frames. Verify all-boundary and focused browser fixtures.
- Obvious follow-on: hand P1-P2 results to P3 after W12.

### Final waves and economy

- Work package: P3 -- balance final waves and economy.
- Owner: `coder`; depends on C5-C14, W5-W12, P1, and P2.
- Owns: Level 3-10 definition files and `tests/test_simulation.mjs`.
- Outcome: tunes waves and economy so awkward pockets, recurring exposure, and convergence demand
  distinct strategies rather than one overlap solution.
- Verification: the deterministic campaign-balance report fixture.
- Obvious follow-on: submit the final strategy report to R2 before launching production proof.

### Independent agent reviews

- Work package: R1 -- review the campaign contract.
- Owner: `reviewer`; depends on C1-C14; owns a run-specific read-only review report. It compares
  catalog and simulation behavior against exact shared segments, remaining-distance targeting,
  descendant route identity, and spatial cross-route effects. Verification: no unresolved blocker
  in the report before CP2 is accepted.
- Work package: R2 -- review balance evidence.
- Owner: `reviewer`; depends on P3; owns a run-specific read-only review report. It confirms each
  diagnostic layout is a probe rather than a required solution and every economy envelope has
  deterministic evidence. Verification: no one-layout requirement or missing envelope evidence.
- Work package: R3 -- audit the integrated campaign.
- Owner: `reviewer` using `audit-code-reviewer`; depends on B1, V1, and R2; owns a run-specific
  audit report. It checks final code, test, and capture evidence for plan conformance and release
  blockers. Verification: all findings are resolved or explicitly out of scope before I1.
- Obvious follow-on: hand the accepted reports to D1 and I1; reviews produce read-only evidence.

### Production proof and close-out

- Work package: T1 -- automate the full campaign walkthrough.
- Owner: `tester`; depends on P3 and W12; owns `tests/playwright/e2e/campaign.spec.ts` and
  capture helpers. It drives all ten levels through the built real UI. Verify full-campaign E2E.
- Work package: T2 -- automate visual fixtures.
- Owner: `tester`; depends on P3 and W12; owns `tests/playwright/visual_assets.spec.ts` and
  capture helpers. It captures Levels 3, 6, 8, and 10 in both motion modes at all widths. Verify
  the visual capture suite. T1 and T2 run in parallel.
- Work package: B1 -- capture browser evidence.
- Owner: `playwright_operator`; depends on T1-T2; owns run-specific browser report artifacts. It
  executes the built E2E and visual suites, records console and capture paths, and returns evidence
  for both passing test reports.
- Work package: V1 -- assess captured visual evidence.
- Owner: `image_evaluator`; depends on B1; owns a run-specific visual assessment report. It checks
  routes, landmarks, legal pockets, labels, clipping, and reduced motion against the visual
  contract. Verification: all mandatory criteria pass.
- Work package: D1 -- publish documentation.
- Owner: `planner`; depends on B1 and V1; owns `README.md`, `docs/CHANGELOG.md`,
  `docs/screenshots/`, and this plan. It publishes captures, controls, validations, and closure
  status. Verify the Markdown link test.
- Work package: I1 -- integrate and close.
- Owner: `integrator`; depends on D1 and R3; owns final integration only. It resolves conflicts,
  runs named gates, archives this plan, and writes the closure report. Verify the final command
  matrix.
- Obvious follow-on: archive the plan only after every named gate and review report passes.

### Dispatch checkpoints

- CP1 contract needs C1. Pass when local malformed-data tests reject every invalid reference
  class. On failure, redispatch C1 with its failing fixture and block downstream work.
- CP2 topology needs C2-C14 and R1. Pass when Level 1-2 compatibility, unequal-route targeting,
  exact merge geometry, inheritance, spatial splash, synthetic transitions, and independent review
  pass. On failure, redispatch the owning C-task and repeat CP2.
- CP3 vertical slice needs W1-W4. Pass when generated Level 3 art, canonical route rendering,
  placement probes, accessibility, and browser interaction pass. On failure, fix the W-task before
  dispatching W5-W11.
- CP4 world and flow needs W5-W12 and P1-P2. Pass when every asset renders at three widths with
  reduced motion and the catalog UI plus synthetic transitions pass. On failure, serialize only
  conflicting files and redispatch their atomic task.
- CP5 balance needs P3 and R2. Pass when multiple coverage-aware diagnostic layouts remain viable,
  entry buying power stays inside every authored envelope, and R2 confirms layout diversity. On
  failure, redispatch P3 with the failing level report.
- CP6 release needs T1-T2, B1, V1, R3, D1, and I1. Pass when all final gates and agent reviews
  pass and evidence describes final balance data. On failure, reopen the smallest failing task and
  repeat CP6.

## Acceptance criteria and gates

- Per-patch gate: `npx tsc --noEmit -p tsconfig.json`, ESLint, Prettier, and focused Node or
  generator tests pass for every touched contract.
- Integration gate: `./run_fast_checks.sh`, `./build_github_pages.sh`, and
  `source source_me.sh && python3 -m pytest tests/` pass on the complete material tree.
- Browser gate: `./run_playwright_tests.sh --build` passes after stale economy literals are
  replaced by behavior-based assertions.
- Visual gate: built-artifact screenshots at 680, 1280, and 1600 pixels show readable branches,
  normal and reduced motion, no clipping, no horizontal page overflow, and no duplicate SVG IDs.
- Topology gate: catalog fixtures prove one route geometry source, exact shared segments, the
  Level 6 multi-source contract, Level 8 constrained legal pockets, Level 9 recurring combat
  zones, and Level 10 staged merges. This replaces any manual design-review gate.
- Independent agent gate: R1, R2, V1, and R3 reports pass; the reviewer and image-evaluator roles
  are separate from the agents that implemented the reviewed work.

## Test and verification strategy

Fast tests stay deterministic, offline, and behavior-focused. They test malformed campaign data,
branch identity, least remaining escape distance, exact shared segments, spatial cross-route
combat, clearance, transitions, and route inheritance rather than exact CSS pixels, arbitrary
timing, collection counts, or hand-tuned TP literals. Synthetic transition fixtures construct
completed-wave state through the test-only debug harness: it starts a real wave and advances real
simulation ticks until the normal intermission, then calls the same `advanceLevel()` used by the
UI. This provides fast diagnosis without mutating browser state or creating a mock game.

Generated SVG validation stays in the Python 3.12 lane and runs through
`source source_me.sh && python3`. It checks XML, allowed vocabulary, catalog generation, reference
integrity, type emission, and namespaced instances. `rsvg-convert` produces retained thumbnail and
playfield fixtures, while automated browser assertions verify CSS-dependent presentation; neither
requires manual inspection to pass the plan.

Playwright builds and serves `dist/`, selects visible controls, performs real map clicks or
keyboard actions, and uses web-first readiness assertions. The full ten-level walkthrough is a
bounded browser E2E/capture lane; it uses the existing accelerated real simulation frame driver
and visible game controls. Screenshot evidence covers Levels 3, 6, 8, and 10, all target widths,
and reduced motion.

## Migration and compatibility policy

- Replace `SceneId`, scene-specific path helpers, and fixed wave indexing only in C12-C14, after
  C2-C11 prove the existing two levels through their captured behavior fixtures.
- Preserve the existing settings storage contract unchanged: it stores sound, speed, and best
  results, not transient `GameState`, so no in-progress campaign migration is required.
- Keep the first two map titles and baseline path/wave behavior unless P3 changes only the stated
  Level 2 staging and economy values with deterministic evidence.
- Resolve a compatibility failure in its owner task using the canonical catalog and route geometry.

## Risk register

| Risk | Impact | Trigger | Owner | Mitigation |
| --- | --- | --- | --- | --- |
| Unequal route order | High | Short route nears exit | C13 | Test remaining arc length first. |
| Geometry drift | High | Actor and path disagree | C13/W3 | Reuse exact segments directly. |
| TP snowball | High | Early win trivializes late maps | P3 | Enforce entry power envelopes. |
| Constrained map | Medium | Legal pocket rejected | C9/W12 | Test named probes. |
| Late-map blur | Medium | One layout dominates | C9-C11/P3 | Test topology contracts. |
| SVG catalog failure | Medium | Bad sheet or duplicate ID | W1/W2/W5-W11 | Validate captures. |
| E2E instability | Medium | Walkthrough over budget | T1/B1 | Use real simulation harness. |
| Scope creep | Medium | Unrelated system enters work | Manager | Apply stated non-goals. |

## Rollout and release checklist

- [ ] Land the campaign catalog and simulation migration before rendering new world content.
- [ ] Complete the Level 3 vertical slice before dispatching Levels 4-10 world-sheet tasks.
- [ ] Land original world sheets and their generated consumer after XML and automated render checks.
- [ ] Run deterministic strategy probes for every level before final balance sign-off.
- [ ] Refresh README screenshots from the real built artifact after the final balance pass.
- [ ] Run all named gates and `git diff --check` on the final material tree.
- [ ] Archive the captured topology, visual, and browser fixture evidence with the closure report.

## Documentation close-out requirements

- Active plan / progress tracker updates: update this plan after each milestone, then move it to
  `docs/archive/` with `git mv` on completion.
- `docs/CHANGELOG.md` entry: record additions, interface changes, balance decisions, failures,
  and developer test evidence under the implementation date.
- Archive / closure notes: record the final validation commands, screenshot paths, and any
  intentional evidence gap in the archived plan or closure report.

## Patch plan and reporting format

- Patch 1: campaign types, validated catalog, and route-aware deterministic simulation.
- Patch 2: eight editable SVG landmark sheets, generated catalog support, and generic world/CSS
  rendering.
- Patch 3: level UI, generic progression, authored branch waves, and whole-campaign balance.
- Patch 4: Node/Python/browser proof, documentation captures, README, changelog, and closure.

Each report names the patch, owned files, branch lesson verified, commands run, browser versus
static evidence, and pass/fail result. The manager uses the checkpoint matrix to redispatch a
failed atomic task and concludes with the integrated automated evidence set.

## Resolved decisions

- Levels 1 and 2 remain campaign content, so the expansion adds exactly eight new levels rather
  than replacing the existing first two.
- Levels 3-10 all use two to four authored deterministic routes; branches are gameplay paths,
  not background decoration.
- Targeting means least remaining physical route distance to escape; ties use stable IDs. Route
  identity controls movement and inheritance, while all attack range and splash remain spatial.
- Shared trunks, splits, and merges use reusable exact route segments sampled once.
- Level 6 is the two-source map; Level 8 tests constrained placement, Level 9 tests recurring
  combat zones, and Level 10 tests independently timed sources and staged convergence.
- The game retains its original microscopic-tissue world and generated editable SVG approach;
  Bloons TD references inspire spatial challenge patterns only.
- Level transitions retain fresh-build-field planning and metastasis continuity. Level-local entry
  purchasing-power envelopes, carryover caps, and reinforcements jointly prevent ten-level
  snowballing.
- Replay and level-select are explicitly out of scope for this release: the linear campaign and
  deterministic transition fixtures fully satisfy the ten-level learning progression without them.

## Open questions and decisions needed

- Manager/subagent decision procedure:
  - Decision owner or dedicated class: the manager accepts checkpoints; `reviewer`,
    `playwright_operator`, and `image_evaluator` provide independent evidence in their named tasks.
  - Evidence and decision rule: accept the economy only when P3/R2 prove every entry-power
    envelope and multiple viable coverage-aware probes; accept world/UI evidence only when CP3/CP4
    and V1 pass; accept release only when CP6 passes on the integrated material tree.
- Non-blocking follow-up: none. Replay and level select are explicit non-goals, not pending work.
