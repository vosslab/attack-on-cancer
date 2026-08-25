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
- Make one typed level definition the source of truth for routes, waves, landmarks, placement
  obstacles, redeployment economy, player-facing copy, and accessible map descriptions.
- Preserve deterministic simulation, readable 16:10 presentation, pointer/touch/keyboard
  placement, reduced-motion support, and the editable SVG asset workflow.
- Validate level progression and every multi-route rule with behavior-focused simulation,
  real-UI browser, generated-asset, and rendered screenshot evidence.

## Design philosophy

Use "Fix the design, not the symptom": replace the `scene === 1 ? ... : ...` special cases
with a campaign catalog rather than layering eight more conditionals on the two-scene model.
Maps teach placement through visible splits, rejoining lanes, crossing coverage zones, and
biologically meaningful obstacles; they do not hide arbitrary tower restrictions or copy
another game's art. This also follows "Polish over expansion": each new map gets one clear
positioning lesson and visual identity before its wave counts are tuned.

- Evidence strategy for uncertain methods: play deterministic simulations and one real-browser
  build on each map, compare coverage of the intended junction versus a single-branch placement,
  and tune only maps where the intended spatial decision is visible and consequential.

## Scope

- Migrate the existing two scenes into a data-driven ten-level campaign catalog.
- Add Levels 3-10, each with at least two playable enemy routes and a distinct placement lesson.
- Extend simulation, rendering, UI progression, tests, generated world artwork, CSS, screenshots,
  README, and changelog documentation for the campaign.
- Balance reinforcements, rewards, refunds, and wave pressure as one whole-campaign economy.

## Non-goals

- Add a player-facing level-select screen or allow arbitrary map replay in this campaign pass.
- Add new treatment types, enemy species, microtransactions, or clinical-treatment claims.
- Copy Bloons TD 6 maps, artwork, characters, UI, names, or route geometry.
- Persist an in-progress campaign or introduce a server-side profile system.

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

The campaign catalog is the canonical content model. It owns level order, titles, short map
briefings, theme tokens, route geometry, source and exit landmark positions, wave entries,
branch assignment cycles, placement obstacles, and redeployment parameters. Sampled route points
remain the only geometry used for simulation, clearance, actors, and route paint.

`LevelId` replaces the two-value `SceneId`; a `RouteId` identifies one complete source-to-exit
route inside a level. `Enemy`, pending spawn, and repair-event records carry `routeId`. A route
can share points with another route before a split or after a merge, keeping branch behavior
simple and deterministic without inventing a second decorative path system.

The campaign uses an explicit `routeCycle` on each wave entry. Spawns repeat that cycle, so the
upper/lower or multi-source distribution is authored, deterministic, and visible in tests.
Targeting compares normalized progress on the enemy's own route, not raw distance from paths of
different lengths. Divided cells, Tumor Mass shed cells, rupture fragments, repair effects, and
escapes retain their parent route.

Level transitions keep the current fresh-build-field idea: towers clear, metastases persist, and
the next level applies its typed reinforcement and carryover cap. The balance work owns the exact
values, so a ten-map campaign cannot snowball from a single early surplus.

### Visual contract

- Audience and state: a player planning a placement on a 16:10 microscopic battlefield at 680,
  1280, and 1600 pixel viewports, with normal and reduced motion.
- Hierarchy: a level-and-wave HUD labels the map; route splits, merges, landmarks, legal open
  tissue, and blocked biological structures remain legible behind towers and cells.
- Route semantics: every branch is visible through spatial separation, joins, and labeled
  landmarks; color reinforces the route surface but never carries the information alone.
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

| Level | Map | Routes | Primary placement lesson |
| --- | --- | --- | --- |
| 1 | Skin Tissue | Existing curve | Open-tissue baseline |
| 2 | Cluster Corridor | Existing long curve | Long-range rebuild |
| 3 | Capillary Crossroads | 2 split/merge | Shared crossings |
| 4 | Lymph Node Loop | 2 counter-loops | Central hub |
| 5 | Alveolar Switchbacks | 2 hairpins | Parallel coverage |
| 6 | Ductal Delta | 3 ducts | Delta neck |
| 7 | Vascular Bypass | 2 unequal routes | Risky bypass |
| 8 | Fibrotic Sieve | 4 braided lanes | Few legal pads |
| 9 | Marrow Lattice | 3 feeders | Repeated contacts |
| 10 | Metastatic Confluence | 4 sources | Final merges |

- Level 1 preserves the existing introductory open-tissue baseline, and Level 2 retains its
  existing long-route rebuild challenge.
- Level 3 splits into two branches, then merges twice, rewarding coverage at the crossings rather
  than a tower that chases one arm.
- Level 4 sends two routes in opposite directions around a lymph follicle, rewarding the central
  loop hub where both receive repeated exposure.
- Level 5 places upper and lower hairpins around air spaces, rewarding long range across parallel
  switchbacks and protection of late bends.
- Level 6 divides one trunk into three ducts that rejoin late, so the delta neck needs coverage
  while separated feeders require a reserve response.
- Level 7 pairs a short fast bypass with a long armored route, forcing a choice between immediate
  interception and durable coverage.
- Level 8 braids four lanes through visible scar islands, so only a few junction pads are legal
  and visually desirable.
- Level 9 weaves three feeder routes through two common marrow nodes, rewarding splash and beam
  coverage at repeated contacts.
- Level 10 crosses four sources into two merges before one exit, creating the final multi-branch
  defense against converging Tumor Mass waves.

The Bloons TD 6 image survey informs only the broad spatial vocabulary of winding routes,
intersections, and alternate paths, including the [Bloonarius Prime alternate-path guide]
(https://steamcommunity.com/sharedfiles/filedetails/?id=2572643018). Every level above remains
an original microscopic-tissue composition with original biology art and route geometry.

### Mapping (milestones / workstreams -> components / patches)

| Milestone / Workstream | Component | Review boundary |
| --- | --- | --- |
| M1 / WS-Campaign | Types, config, simulation | Deterministic route behavior |
| M2 / WS-World | Art, generator, world CSS | Editable responsive worlds |
| M3 / WS-Play | UI, campaign economy, copy | Visible progression and controls |
| M4 / WS-Proof | Tests, captures, docs | Real-game release evidence |

## Milestone plan

| M | Title | Summary | Goal |
| --- | --- | --- | --- |
| M1 | Campaign model | Generalize levels and routes | One source for ten maps |
| M2 | Branching worlds | Add original art and route paint | Readable map choices |
| M3 | Playable campaign | Generalize UI and economy | Ten placement challenges |
| M4 | Campaign proof | Run complete evidence | Shippable final build |

### Milestone M1: Establish campaign model

- Depends on: none -- this is the source contract for all later work.
- Deliverables: `LevelId`, level and route interfaces, a validated `CAMPAIGN_LEVELS` catalog,
  generic level advance, branch-aware simulation, and behavior tests.
- Workstreams: WS-Campaign.
- Entry criteria: existing two-scene behavior is documented by current tests.
- Exit criteria:
  - Levels 1 and 2 reproduce their present routes and wave behavior through the catalog.
  - A simulated branch enemy moves, targets, escapes, divides, sheds, and renders on its route.
- Parallel-plan ready: no -- the contract must settle before other patches consume it.

### Milestone M2: Build branching worlds

- Depends on: WP-C1 -- level IDs, themes, and landmark identifiers are stable.
- Deliverables: eight editable landmark sheets, generator support, generic route/obstacle renderer,
  per-level world CSS tokens, and rendered asset evidence.
- Workstreams: WS-World-Art and WS-World-CSS.
- Entry criteria: M1 catalog names each new level and its theme.
- Exit criteria:
  - Every new map shows every branch, obstacle, source, exit, and intended coverage junction.
  - Normal and reduced-motion renders remain unclipped and readable at all target widths.
- Parallel-plan ready: yes -- max parallel doers: 2, because SVG art and renderer/CSS touch
  separate sources after the campaign contract is fixed.

### Milestone M3: Make campaign playable

- Depends on: WP-C2, WP-W2 -- simulation routes and rendered level metadata are available.
- Deliverables: generic Level N of 10 HUD and intermission UI, ten-level progression, level
  briefings, responsive copy, redeployment budget tuning, and wave compositions.
- Workstreams: WS-Play-UI and WS-Balance.
- Entry criteria: at least one branch level runs end-to-end in the simulation and renderer.
- Exit criteria:
  - Clearing any non-final level presents a visible next-level action and resets only the intended
    build field state.
  - Every added level has at least one wave where spreading coverage across branches matters.
- Parallel-plan ready: yes -- max parallel doers: 2, because UI consumes stable catalog data while
  balance work runs deterministic playthroughs against the same data.

### Milestone M4: Prove the complete campaign

- Depends on: WP-P1, WP-P2, WP-P3 -- final data, rendering, UI, and balance are integrated.
- Deliverables: behavior tests, production-built browser playthrough evidence, viewport captures,
  README updates, changelog entry, and plan closure report.
- Workstreams: WS-Proof.
- Entry criteria: M1-M3 pass their focused checks.
- Exit criteria:
  - The full named validation suite passes on the final material tree.
  - A real-UI browser run reaches Level 10 with no direct game-state mutation.
- Parallel-plan ready: no -- final evidence must use the integrated campaign tree.

## Workstream breakdown

### Workstream WS-Campaign: model and simulation

- Goal: express all map content and branch behavior through typed deterministic state.
- Owner: expert_coder.
- Work packages: WP-C1, WP-C2.
- Interfaces:
  - Needs: existing routes, waves, difficulty data, and transition rules.
  - Provides: validated level catalog and route-aware simulation APIs.
- Review boundary, when modifying the repository: game rules and geometry only; no presentation
  or handcrafted SVG edits.

### Workstream WS-World: SVG maps and CSS presentation

- Goal: deliver editable original landmarks and responsive, readable multi-route worlds.
- Owner: expert_coder using `svg-creator-expert` and `css-creative-expert`.
- Work packages: WP-W1, WP-W2.
- Interfaces:
  - Needs: level theme, landmark, route, and obstacle records from WP-C1.
  - Provides: generated world-art components and map rendering that consume the catalog.
- Review boundary, when modifying the repository: `assets/visuals/`, generator, landmarks, and
  world/style CSS; preserve combat visual behavior.

### Workstream WS-Play: player flow and balance

- Goal: make branch choices understandable and challenging from real controls.
- Owner: coder.
- Work packages: WP-P1, WP-P2.
- Interfaces:
  - Needs: generic simulation transitions and world renderer.
  - Provides: HUD, briefing, next-level interaction, tuned waves, and redeployment values.
- Review boundary, when modifying the repository: `app.tsx`, campaign content, and user-visible
  copy; do not duplicate simulation logic in Solid state.

### Workstream WS-Proof: validation and documentation

- Goal: establish durable behavior evidence and player-facing documentation.
- Owner: tester.
- Work packages: WP-P3, WP-P4.
- Interfaces:
  - Needs: integrated campaign and approved real-UI placement plans.
  - Provides: final gates, captures, README updates, changelog entry, and closure notes.
- Review boundary, when modifying the repository: tests and documentation; no production feature
  changes except a narrowly approved testability selector.

## Work packages

### Work package WP-C1: Define the campaign catalog

- Owner: expert_coder.
- Touch points: `src/game_types.ts`, `src/config.ts`, existing config tests.
- Depends on: none.
- Acceptance criteria:
  - `CAMPAIGN_LEVELS` contains Levels 1-10 in one explicit order and validates contiguous IDs,
    route references, route geometry, source/exit definitions, branch cycles, obstacle bounds,
    and level wave availability at startup.
  - Level 1 and Level 2 data preserve the current path and wave compositions before new content
    is introduced.
  - Every Level 3-10 definition declares two to four routes, visible landmarks, an obstacle or
    spatial constraint where the roster calls for one, and the level's placement lesson.
- Evidence or review, when useful:
  - Add malformed-catalog tests that fail loudly for missing routes, bad branch IDs, degenerate
    geometry, or invalid obstacle boundaries.
- Obvious follow-ons:
  - Replace `SceneId`, `SCENE_ONE_WAVE_COUNT`, `CLUSTER_PATH`, and `WAVES` indexing only after
    their catalog equivalents compile.

### Work package WP-C2: Generalize route-aware simulation

- Owner: expert_coder.
- Touch points: `src/simulation.ts`, `src/game_types.ts`, `src/enemy_visuals.ts`,
  `src/enemy_actor.tsx`, `tests/test_simulation.mjs`, `tests/test_enemy_visuals.mjs`.
- Depends on: WP-C1.
- Acceptance criteria:
  - All path helpers accept `(level, routeId)` and derive positions, lengths, clearance, visual
    lanes, targeting, splash, attack effects, death effects, repair effects, escapes, and win
    behavior from the same route geometry.
  - Branch descendants retain `routeId`, and targeting chooses the enemy nearest escape by
    normalized own-route progress, then existing stable ID tie-breaking.
  - Placement rejects every route bed and visible placement obstacle while retaining intentional
    junction pads as legal tower positions.
  - `advanceLevel()` replaces `startClusterScene()` and produces `intermission` until Level 10,
    then the existing win state.
- Evidence or review, when useful:
  - Run deterministic branch-route, obstacle, transition, escape, and descendant-route tests.
- Obvious follow-ons:
  - Expose only the generic level and route helpers required by actor and world components.

### Work package WP-W1: Author original level landmarks

- Owner: expert_coder using `svg-creator-expert`.
- Touch points: `assets/visuals/world_*.svg`, `generate_visual_assets.py`,
  `tests/test_generate_visual_assets.py`, generated catalog consumer tests.
- Depends on: WP-C1.
- Acceptance criteria:
  - Add eight editable one-panel world sheets for Capillary Crossroads, Lymph Node Loop,
    Alveolar Switchbacks, Ductal Delta, Vascular Bypass, Fibrotic Sieve, Marrow Lattice, and
    Metastatic Confluence.
  - Each sheet has a stable viewBox, semantic groups, descriptive IDs, local references only,
    original microscopic-tissue silhouettes, and no learner-facing text baked into the art.
  - Make `WorldArtworkId` derive from the validated world catalog rather than maintaining a
    second hand-written union in the generator.
  - Parse each SVG, resolve all references, and inspect generated use at thumbnail and playfield
    scale. Use `rsvg-convert` first and the production Playwright consumer when CSS affects it.
- Evidence or review, when useful:
  - Retain validator tests for unsafe nodes, references, unique namespacing, and generated
    exhaustiveness; add behavior tests for dynamic world catalog type generation.
- Obvious follow-ons:
  - Record the final source sheet, component type, target scale, and render evidence in the
    visual capture report.

### Work package WP-W2: Render branching worlds responsively

- Owner: expert_coder using `css-creative-expert`.
- Touch points: `src/world_landmarks.tsx`, `src/world_visuals.css`, `src/style.css`,
  `tests/playwright/visual_assets.spec.ts`.
- Depends on: WP-C1.
- Acceptance criteria:
  - Render every route from catalog points and apply `data-level`, `data-route-id`, and
    `data-level-theme` hooks without drawing an independent decorative curve.
  - Render catalog landmarks and obstacle silhouettes behind actors while preserving one useful
    accessible map name in `src/app.tsx`.
  - Define small per-level color and surface token sets, preserve 16:10 geometry, avoid overflow
    at 680, 1280, and 1600 pixels, and keep map information legible with circulation disabled.
  - Preserve source order, focus visibility, touch placement, CSS selector scope, and existing
    reduced-motion treatment for ambient world animation.
- Evidence or review, when useful:
  - Capture narrow, standard, and wide normal/reduced-motion screenshots; assert computed route
    display, overflow, theme-token resolution, and disabled route-flow animation.
- Obvious follow-ons:
  - Keep combat rules in `src/combat_visuals.css`; route a measured contrast failure to
    `color-accessibility-expert` rather than changing theme colors by intuition.

### Work package WP-P1: Generalize campaign UI and progression

- Owner: coder.
- Touch points: `src/app.tsx`, `src/world_landmarks.tsx`, `tests/playwright/game.spec.ts`.
- Depends on: WP-C2, WP-W2.
- Acceptance criteria:
  - HUD reads `Level N of 10`, the catalog title, and the level-local wave count.
  - Map aria-label, briefing, overlay heading, explanatory copy, and next-level button come from
    the active level instead of hard-coded Skin Tissue and Cluster Corridor strings.
  - Players reach every level through visible `Start Wave` and next-level controls; new field
    behavior clears towers, preserves metastases, and follows the catalog economy rule.
- Evidence or review, when useful:
  - Use role/label selectors and real pointer or keyboard placement, following the existing
    selector-contract comments.
- Obvious follow-ons:
  - Update any capture helper that names Scene 2 or Wave 21.

### Work package WP-P2: Balance the campaign as one economy

- Owner: coder.
- Touch points: level wave data and redeployment fields in `src/config.ts`, simulation tests,
  real-browser placement plans.
- Depends on: WP-C2.
- Acceptance criteria:
  - Levels 3-9 have three authored waves and Level 10 has a four-wave finale; each contains
    a route-distribution moment tied to its stated placement lesson.
  - Wave pressure, cell rewards, sale refunds, carryover caps, and reinforcements are tuned
    together so a successful early map does not trivialize later maps.
  - The Level 10 finale uses existing enemy contracts, including branch-aware Tumor Mass behavior,
    instead of adding a special-case boss system.
- Evidence or review, when useful:
  - Compare at least two deterministic tower layouts per added level: one coverage-aware layout
    reaches the intended late wave, while a single-branch-only layout exposes the map's pressure.
- Obvious follow-ons:
  - Preserve the winning layouts as browser-capture input, not as hidden production assistance.

### Work package WP-P3: Validate campaign behavior and real UI

- Owner: tester.
- Touch points: Node tests, generator pytest tests, Playwright specs, screenshot harnesses.
- Depends on: WP-C2, WP-W1, WP-W2, WP-P1, WP-P2.
- Acceptance criteria:
  - Unit tests cover catalog rejection, route assignment, normalized targeting, clearance across
    branches and obstacles, inherited descendant routes, all-level progression, and Level 10 win.
  - Browser tests create and mutate campaign state using visible UI actions. A dedicated real-UI
    full-campaign walkthrough starts waves, places treatments, and enters all ten levels without
    direct state mutation or a parallel mock app.
  - Browser checks prove a branch map renders all routes, legal and illegal placement behavior is
    visible, map labels update, no console errors occur, and SVG IDs remain unique in the densest
    final encounter.
- Evidence or review, when useful:
  - Keep long full-campaign browser evidence in `tests/playwright/e2e/` or the capture workflow,
    outside the fast pytest lane; use web-first waits rather than sleeps.
- Obvious follow-ons:
  - Re-run captures after final balance so screenshots never describe stale waves or TP values.

### Work package WP-P4: Publish campaign documentation

- Owner: tester.
- Touch points: `README.md`, `docs/CHANGELOG.md`, `docs/screenshots/`,
  `docs/active_plans/active/`.
- Depends on: WP-P3.
- Acceptance criteria:
  - README explains the ten-level campaign, original branching-map premise, and controls without
    overstating clinical biology.
  - Screenshot documentation uses built-artifact real-game captures that show a readable branch
    level and the Metastatic Confluence finale.
  - Changelog records the catalog migration, eight new levels, visual assets, balance decisions,
    test outcomes, and any browser permission evidence.
- Evidence or review, when useful:
  - Check local Markdown links and inspect the final captures at their displayed size.
- Obvious follow-ons:
  - Move this plan to `docs/archive/` with `git mv` after the campaign is complete.

## Acceptance criteria and gates

- Per-patch gate: `npx tsc --noEmit -p tsconfig.json`, ESLint, Prettier, and focused Node or
  generator tests pass for every touched contract.
- Integration gate: `./run_fast_checks.sh`, `./build_github_pages.sh`, and
  `source source_me.sh && python3 -m pytest tests/` pass on the complete material tree.
- Browser gate: `./run_playwright_tests.sh --build` passes after stale economy literals are
  replaced by behavior-based assertions.
- Visual gate: built-artifact screenshots at 680, 1280, and 1600 pixels show readable branches,
  normal and reduced motion, no clipping, no horizontal page overflow, and no duplicate SVG IDs.
- Independent review gate: a reviewer checks that route geometry has one source of truth and that
  each added level presents its listed placement lesson without copied Bloons TD content.

## Test and verification strategy

Fast tests stay deterministic, offline, and behavior-focused. They test malformed campaign data,
branch identity, normalized progress, clearance, transitions, and route inheritance rather than
exact CSS pixels, arbitrary timing, collection counts, or hand-tuned TP literals.

Generated SVG validation stays in the Python 3.12 lane and runs through
`source source_me.sh && python3`. It checks XML, allowed vocabulary, catalog generation, reference
integrity, type emission, and namespaced instances. The asset owner inspects each sheet through
the real component consumer, at playfield and thumbnail sizes, using the SVG rendering contract.

Playwright builds and serves `dist/`, selects visible controls, performs real map clicks or
keyboard actions, and uses web-first readiness assertions. The full ten-level walkthrough is a
bounded browser E2E/capture lane; it may use the existing accelerated real simulation frame
driver but never injects game state or substitutes a mock map. Screenshot evidence covers Levels
3, 6, 8, and 10, all target widths, and reduced motion.

## Risk register

| Risk | Impact | Trigger | Owner | Mitigation |
| --- | --- | --- | --- | --- |
| Unequal-route ordering | High | Short route nears exit | WP-C2 | Normalize target progress |
| Geometry/render drift | High | Actor and route disagree | WP-C1 | Share sampled points |
| TP snowball | High | Early win trivializes late maps | WP-P2 | Tune economy together |
| Ambiguous map | Medium | Junction or pad is obscured | WP-W2 | Test widths and real clicks |
| SVG catalog failure | Medium | Bad sheet or duplicate ID | WP-W1 | Derive types and validate XML |
| Long E2E instability | Medium | Walkthrough exceeds budget | WP-P3 | Deterministic real-UI plan |
| Scope creep | Medium | Unrelated systems enter work | Manager | Keep stated non-goals |

## Rollout and release checklist

- [ ] Land the campaign catalog and simulation migration before rendering new world content.
- [ ] Land original world sheets and their generated consumer after XML and render inspection.
- [ ] Play every level in a production build before final balance sign-off.
- [ ] Refresh README screenshots from the real built artifact after the final balance pass.
- [ ] Run all named gates and `git diff --check` on the final material tree.
- [ ] Have an independent reviewer inspect the campaign catalog, branch behavior, and map art.

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
static evidence, and any remaining result. It does not claim a green focused suite proves the
browser or production build.

## Resolved decisions

- Levels 1 and 2 remain campaign content, so the expansion adds exactly eight new levels rather
  than replacing the existing first two.
- Levels 3-10 all use two to four authored deterministic routes; branches are gameplay paths,
  not background decoration.
- The game retains its original microscopic-tissue world and generated editable SVG approach;
  Bloons TD references inspire spatial challenge patterns only.
- Level transitions retain fresh-build-field planning and metastasis continuity, with an explicit
  typed economy cap to prevent ten-level snowballing.

## Open questions and decisions needed

- Manager/subagent decision procedure:
  - Decision owner or dedicated class: manager with an `architect` review of the campaign catalog.
  - Evidence and decision rule: accept a reinforcement/carryover schedule only when deterministic
    coverage-aware layouts and the real UI show that each map's intended branch decision matters
    without making a standard-difficulty completion implausible.
- Non-blocking follow-up: decide after release whether completed maps need a future replay or
  level-select interface; it is intentionally absent from this campaign implementation.
