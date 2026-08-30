## 2026-08-30

### Additions and New Features

- Added reproducible documentation captures for the in-game Tier 3 Chemotherapy Command deck
  and the all-treatment upgrade palette, then embedded both progression views in the README.
- Expanded the reproducible documentation capture set with the inline Tier 4 Doctor signature
  review and the Primary tumor's in-map learning tooltip, then embedded both views in the README.
- Added tower-specific upgrade-material palettes. Doctor doses, Chemotherapy reservoirs, T Cell
  granules, Radiation energy cores, Antibody binding molecules, CAR Macrophage lysosomes, and
  CRISPR guide/RNA hardware each change color through their upgrade tiers.
- Replaced the shared treatment-upgrade list with validated per-treatment paths that own their
  costs, biology facts, game roles, and tier-4 signature abilities.
- Added the seven bounded signature mechanics, tier-aware upgrade burst artwork, upgrade-card
  previews, signature confirmation, milestone banner, and upgrade/signature sound cues.

### Behavior or Interface Changes

- Rebalanced Cluster Corridor's first wave for its fresh-field handoff: it now introduces five
  widely spaced basic cells before later waves reintroduce faster and mixed threats.
- Rebuilt the selected-treatment interface as a contextual Command deck: placement now has its
  own labeled tray, tiers and upgrade evidence stay together, selling remains secondary, and the
  tier-4 signature decision is an inline review rather than a screen-blocking modal. Selected
  cancer cells now receive their own concise context card, replacing the generic Inspect
  accordion. Chemotherapy's liquid shifts from purple toward blue across upgraded visual tiers.
- Tier-4 upgrades now require a visible confirm/cancel decision; ordinary upgrades remain
  one-click actions. The Fibrotic Sieve entry reinforcement now supports its constrained mixed
  defense under the new treatment-specific upgrade costs.
- Made LINGERING CLOUD damage time-based so its balance is independent of frame rate, and removed
  obsolete upgrade-state and CRISPR guarantee configuration ownership.
- Made treatment identity, tiers, and treatment-specific configuration requirements explicit
  TypeScript contracts. Saved settings now have their own persistence-owned boundary.
- Routed player-command feedback through accepted simulation state changes, so rejected keyboard or
  stale UI actions no longer clear selection, play action audio, or announce a signature unlock.

### Developer Tests and Notes

- Added deterministic signature-contract tests and built-browser coverage for tier-4 cancellation
  and confirmation. Added deterministic time-partition coverage for LINGERING CLOUD damage.
  Generated-art validation accepts the new editable upgrade-burst sheet.
- Updated the existing browser interaction contracts for the Command deck and inline signature
  review; no new snapshot or one-off visual test was retained.
- Extended the existing visual-evolution browser contract to confirm each tower's designated
  material changes paint when it reaches Tier 2.
- Added a deterministic real-simulation balance contract showing the minimum Challenge rebuild
  clears Cluster Corridor's introductory wave without reaching metastasis capacity.

## 2026-08-25

### Additions and New Features

- Added a crisp, editable SVG favicon that combines the game's cancer-cell art
  with treatment-target brackets and ships in the GitHub Pages build.
- Replaced the two-scene game model with a validated, typed Level 1-10 campaign
  catalog. Definitions own routes, shared segments, waves and route cycles,
  landmarks, obstacles, placement probes, economy envelopes, and player-facing
  map copy.
- Made simulation route-aware. Enemies, descendants, repair effects, and
  escapes retain route identity; targeting uses least remaining route distance;
  range and splash remain coordinate-based across nearby routes.
- Added eight editable SVG world sheets for Levels 3-10: Capillary Crossroads,
  Lymph Node Loop, Alveolar Switchbacks, Ductal Delta, Vascular Bypass,
  Fibrotic Sieve, Marrow Lattice, and Metastatic Confluence. The validated
  generator publishes their type-safe Solid consumers during the production
  build.
- Added catalog-led HUD, briefings, accessible map descriptions, and an
  optional map-microenvironment card. This is original game-orientation
  context, not clinical advice or a patient model.
- Added pointer and keyboard tower selection. A focused treatment receives a
  visible static focus ring; Enter and Space open its named inspector without
  also activating global map or wave shortcuts.
- Expanded the generated visual catalog to exercise all ten authored worlds,
  including their route layers, landmarks, themes, and reduced-motion states.
- Added in-scene learning tooltips for the canonical route network, biological
  landmarks, tumor sources, circulation exits, and placement-blocking tissue.
  Concise copy connects each named object to both its biological context and
  its role in the simplified game model.
- Made the learning contract canonical in typed level definitions. Every
  exposed route network, landmark, and obstacle now owns a required biological
  fact and simplified game role; catalog validation rejects either field when
  it is missing.

### Behavior or Interface Changes

- Replaced scene-specific intermission logic with generic Level 1-10
  progression. Advancing deliberately clears the build field and active cells,
  preserves metastases, and applies each next level's carryover cap plus
  reinforcement. Level 10 ends in the campaign win state.
- Restored the browser-sized 16:10 layout as a battlefield-first composition.
  On desktop, the 9:5 battlefield uses the remaining viewport budget inside
  that whole-shell 16:10 view. A compact status/map-context band sits above
  it, and treatment, wave, pause, speed, and cells-in-play controls sit
  together below it. The selected-treatment inspector is a compact conditional
  row rather than a permanent desktop rail.
- Compressed the Level 3 and Level 10 desktop status presentation after visual
  review so the dense route context does not reclaim battlefield width.
- Kept the stable treatment order and placed the primary Start Wave action next
  to Pause/Resume and speed controls. The mobile layout reflows controls while
  retaining the playfield and core actions; it also keeps the treatment tray
  before the wave controls so planning precedes the commit action at every
  width.
- Split continuous combat motion into `src/combat_motion.css` while retaining
  world presentation in `src/world_visuals.css` and general layout in
  `src/style.css`; production publishing includes all three authored CSS
  surfaces.
- Added pointer, touch-focus, Tab-focus, and Escape behavior for scene objects.
  The deduplicated hotspot layer does not alter vessel geometry, does not turn
  repeated cells or segments into excessive Tab stops, and stops exploration
  events from placing treatments or activating global game shortcuts.
- During treatment placement, the battlefield now owns pointer input while
  learning objects remain keyboard-focusable. This lets generous learning
  targets coexist with legal open-tissue placement.

### Fixes and Maintenance

- Closed the low-risk findings from the six-pass scene-tooltip audit: public
  player controls and the design interaction contract now document how to
  discover and dismiss learning tooltips, and scene-learning copy now follows
  the repository's TypeScript line-length limit.
- Closed the audit's two design findings prospectively. The authorized
  remediation plan records the forward work without inventing retrospective
  approval, and label-substring inference plus generic fallback copy were
  replaced by validated, per-object learning metadata for all ten levels.
- Repaired two interaction defects found by the expanded campaign proof. A
  pericyte learning hotspot no longer steals a legal Level 3 placement click,
  and Escape keeps a focused tooltip dismissed while the pointer remains over
  that object.
- Narrowed the tooltip-category selector so biological facts and game roles
  retain readable normal-case body typography instead of inheriting the
  uppercase green category style.
- Repainted campaign routes in four global layers (all vessel beds, then all
  membranes, solid lumens, and circulation traces) and moved the drop shadow
  to the unified bed layer.
  Segment joins, branch splits, and merges now read as one continuous vessel
  network without overlapping endpoint borders or per-segment shadow seams.
- Replaced the thick dashed route interior with a solid lumen and a separate
  thin circulation trace. Motion still indicates travel direction, including a
  reduced-motion fallback, without exposing round dash caps as target-like
  patches at vessel junctions.
- Removed redundant circular split, merge, and combat-zone overlays from the
  top of vessel lumens. The typed landmark model and authored world art remain;
  the canonical branch geometry now communicates topology without target-like
  rings interrupting the vessel wall.
- Removed two-scene gameplay and documentation assumptions. Shared route
  geometry now drives rendering, movement, placement clearance, and spatial
  combat rather than decorative duplicate curves.
- Refreshed documentation-capture tooling for the campaign and removed the
  retired Cluster Corridor screenshot. It refreshes Level 1 documentation
  views and builds the all-world catalog; the real-UI matrix supplies the
  promoted Level 3 and Level 10 branch-map views.
- Added deterministic catalog, topology, transition, balance, asset-generation,
  visual-layout, and tower-interaction tests. The focused test suites include
  exact Level 1/2 carry-forward fixtures, multi-route topology contracts, and
  mixed L8/L10 defenses. Browser interaction proof now clicks both Upgrade and
  Sell and verifies the visible tier, TP, tower-removal, and inspector feedback.
- Repaired the visible Level 1-to-2 browser fixture to use a player-visible,
  affordable opening defense, inspector upgrades between waves, and a
  terminal-outcome wait rather than a wall-clock settling assumption.
- Updated the original smoke interactions to scale canonical map coordinates
  into the rendered full-width battlefield, select difficulty by its visible
  label, and inspect the named selected-treatment panel. This removes stale
  CSS-pixel and retired generic-inspector assumptions from the full browser
  gate.
- Repaired test oracles exposed by the integrated browser run: campaign helpers
  now live with their E2E consumers, the treatment tray precedes the wave
  controls in source as it does visually, and assertions measure the wide
  battlefield rather than assuming its former fixed pixels.
- Replaced one non-ISO-8859-1 reporter glyph in the earlier B1 browser report
  with its ASCII equivalent so the material-tree compliance gate remains clean.

### Decisions and Failures

- The independent scene-tooltip audit found no test, dead-code, dependency,
  ownership, naming, control-flow, or ASCII defect. Its two design-level
  concerns are resolved by the explicit forward remediation plan and the
  canonical typed learning-content contract.
- Kept the linear campaign, no level-select or replay screen, fresh-field
  transitions, editable SVG workflow, and non-clinical medical boundary.
- R1's earlier failed review artifacts remain historical records:
  `docs/active_plans/reports/aoc_campaign_r1_review.md` and
  `docs/active_plans/reports/aoc_campaign_r1_rereview.md`. The accepted final
  contract result is
  `docs/active_plans/reports/aoc_campaign_r1_final_contract_review.md`.
- T1, T2, B1, V1, and R3 are complete. The final built UI traverses Level 1 through
  Level 10 through visible controls; the visual matrix covers Levels 3, 6, 8,
  and 10 at 680, 1280, and 1600 pixels in normal and reduced-motion modes.
  V1 accepts the widened 16:10 battlefield, continuous vessels, sensible
  control order, responsive reflow, and medical context. R3 accepts the
  integrated material with no release blocker; I1 records the final gates and
  archival move below.

### Developer Tests and Notes

- `npm run check:all` -- PASS: regenerated the visual catalog, built the app,
  passed TypeScript, ESLint, Prettier, 45 Node tests, and 893 Python tests.
- T1/B1 production-browser proof -- PASS: a fresh built real-UI run used only
  visible treatment, map, inspector, wave, and continuation controls to reach
  `CANCER CONTAINED` after Level 10. The focused B1 run completed its four
  browser tests in about 8 minutes; its report records the clean runner result.
- T2 visual matrix -- PASS: normal and reduced-motion real-UI traversals
  produced 24 Level 3, 6, 8, and 10 captures across 680, 1280, and 1600 pixel
  viewports. Desktop frames remain inside the viewport without vertical or
  horizontal overflow; narrow frames intentionally retain truthful full-page
  responsive capture.
- The final complete browser gate -- PASS: after the display-only compact
  Level 3/10 status adjustment, `./run_playwright_tests.sh --build` completed
  exactly 20 tests in 8.4 minutes. Its settled matrix artifacts supplied the
  promoted 1600-pixel Capillary Crossroads and Metastatic Confluence captures.
- I1 final material-tree integration -- PASS: `./run_fast_checks.sh`,
  `./build_github_pages.sh`, and `source source_me.sh && python3 -m pytest tests/`
  passed (895 Python tests); both staged and unstaged `git diff --check` gates
  passed before and after close-out documentation. The accepted closure record
  is `docs/active_plans/reports/aoc_ten_level_branching_campaign_closure.md`.
- Focused R1 contract gates passed 43 Node tests, 17 generator pytest tests,
  TypeScript, and `git diff --check`; its Level 1/2 carry-forward addendum
  passes 13 catalog tests.
- Focused R2 balance gates passed. Its addendum records durable mixed-defense
  fixtures for Fibrotic Sieve and Metastatic Confluence.
- Scene-learning validation -- PASS: all ten levels produce non-empty educational
  copy; the focused built-browser interaction proves hover, pointer focus, Tab
  order, Escape dismissal, and immediate return to placement. Tooltip text
  contrast ranges from 9.97:1 to 13.11:1, the exploration hint is 6.89:1, and
  the two-tone focus pair is 11.29:1.
- Final tooltip integration gates -- PASS: `./run_fast_checks.sh` completed the
  production build, TypeScript, ESLint, Prettier, 46 Node tests, and 920 Python
  tests; the affected built-browser set completed all 16 game and visual tests
  in 1.5 minutes.
- Post-audit tooltip cleanup -- PASS: `./run_fast_checks.sh` rebuilt the
  production app and passed TypeScript, ESLint, Prettier, 46 Node tests, and
  946 Python tests. The focused built-browser tooltip interaction passed again,
  and both staged and unstaged diff checks remained clean.
- Scene-learning remediation focused gates -- PASS: both TypeScript projects,
  focused ESLint, and all 15 level-catalog tests passed. The focused built UI
  passed its pointer/keyboard tooltip interaction, and the complete visible
  campaign verified every route, landmark, and obstacle tooltip at all ten
  level entries before reaching the Level 10 win in 8.6 minutes.
- Scene-learning remediation final gates -- PASS: `./run_fast_checks.sh`
  rebuilt the app and passed both TypeScript projects, ESLint, Prettier,
  47 Node tests, and 951 Python tests. The affected visual suite passed all
  10 tests in 1.5 minutes.

## 2026-08-24

### Additions and New Features

- Added an active ten-level branching-campaign plan with typed shared-route geometry, distinct
  placement lessons, autonomous subagent dispatch, independent agent review, and automated gates.
- Added durable human guidance for positive, action-led agent prompts and task briefs.
- Added 27 editable SVG authoring sheets under `assets/visuals/`: four variants for each ordinary
  enemy, four tiers for every treatment, five apoptosis frames, attack effects, rupture, the Tumor
  Mass, the repaired healthy-cell transition, tissue cells, tumor landmarks, and the blood exit.
- Added a Python 3.12 standard-library generator that validates the closed asset catalog, panel
  layout, safe SVG vocabulary, IDs, and local references before emitting type-safe SolidJS
  components under the ignored `generated/visual_assets/` directory.
- Added generated enemy, tower, attack-effect, death, repair-transition, and world-landmark
  components with stable per-instance namespacing for gradients, masks, clip paths, filters, and
  references.
- Added a temporary browser contact sheet built from the real generated components and production
  CSS. It covers every variant, tier, attack, death frame, landmark, scene background, size, and
  motion mode with play, pause, and replay controls.
- Added focused generator tests and production-shaped browser tests for tier evolution,
  deterministic variants, both death modes, reduced motion, responsive layouts, and unique SVG IDs
  during Wave 21 in the Cluster Corridor.
- Added simulation and real-UI coverage for deterministic CRISPR mismatch, sequence confidence,
  ordinary-cell priority, successful repair, TP reward, Dividing-cell containment, Tumor Mass
  safeguards, and the smiling-cell departure.
- Added an experimental CAR Macrophage as the sixth treatment with four editable upgrade tiers,
  a phagocytic-cup attack effect, a distinct sound cue, and keyboard shortcut `6`.
- Added the CRISPR Repair Editor as a seventh treatment with four editable tiers, a guide-RNA
  targeting rig, three readable attempt outcomes, a smiling healthy-cell transition, a distinct
  sound cue, and keyboard shortcut `7`.

### Behavior or Interface Changes

- Replaced identical round, face-like enemies with editable irregular membranes, pseudopods,
  membrane folds, cleavage furrows, lobed nuclei, vacuoles, granules, and immune-evasion shielding
  arcs.
- Replaced generic treatment circles and inline effects with visually distinct generated Doctor,
  Chemotherapy, Cytotoxic T Cell, Radiation Bot, Antibody Therapy, and CAR Macrophage rigs. All
  four upgrade tiers now visibly evolve.
- Gave the CAR Macrophage a slow, very short-range, high-damage engulfing role and a larger damage
  boost against antibody-marked cells, making Antibody Therapy plus macrophage a deliberate
  antibody-dependent cellular phagocytosis pairing.
- Gave the CRISPR Repair Editor deterministic, identity-seeded repair attempts at 12%, 16%, 22%,
  and 30% by tier. Failed sequence matches add a visible confidence step; after seven consecutive
  failures, the next repair is guaranteed. Successful ordinary-cell repairs award normal TP without
  apoptosis, rupture, or Dividing-cell children.
- Prevented instant Tumor Mass conversion: CRISPR prioritizes ordinary cells, and a successful boss
  attempt can only remove one bounded health segment and postpone its next shedding point.
- Moved the tissue cells, tumor sources, and blood exit into generated landmark artwork while
  retaining route geometry, actor positions, health bars, ranges, selection, and targeting in code.
- Reconciled enemy view state by enemy ID so each SVG actor stays mounted while its simulation
  position changes, allowing transitions and internal animations to continue across frames.
- Kept the established Tumor Mass double-heartbeat and event-only shedding as the readable
  large-enemy motion signature.
- Replaced the former inline death drawing with five original vector apoptosis frames and a
  separate rig-based rupture. CSS schedules both within the existing visual-effect lifetime.
- Consolidated actor artwork and animation selectors in `src/combat_visuals.css`, with tissue,
  route, and landmark presentation in `src/world_visuals.css`; reduced-motion mode removes
  continuous ambient animation while preserving short combat and death states.
- Reworked both tissue-region backgrounds with layered illumination, extracellular-matrix fibers,
  soft tissue folds, scene-specific palettes, and more ambient cells.
- Replaced the coarse angular routes with sampled cubic pathways shared by rendering, enemy
  movement, and placement clearance, giving both scenes organic bends without geometry drift.
- Rebuilt every treatment around a directional delivery silhouette: syringe turret, infusion
  sprayer, immune-synapse launcher, linear accelerator, and antibody fork launcher. Live towers
  now turn the complete rig toward their most recent target.
- Spread dense enemy waves across seven visual lanes with small seeded irregular offsets across the
  tissue route and shoulders so each illustrated membrane and nucleus remains readable without
  changing wave timing or movement speed.
- Hid pristine-cell health bars until a cell takes damage, preserving combat feedback without
  covering the artwork at the crowded tumor source.

### Fixes and Maintenance

- Required visual generation in the production build and consumer-owned full-check wrapper, while
  preserving the reset-safe vendored `check_codebase.sh`. Ignored generated TSX and the temporary
  catalog bundle remain outside authored-source linting.
- Used deterministic actor animation offsets so large waves do not move in synchronized phases.
- Verified and enforced unique per-instance SVG IDs in the real densest wave, preventing shared
  definitions from colliding when many copies of one sheet render together.
- Extended screenshot capture to rebuild the production-component catalog, exercise its controls,
  reject browser errors and duplicate IDs, and save a review contact sheet under `test-results/`.
- Replaced two stale Playwright Treatment Point literals with behavioral difficulty and spending
  assertions so economy tuning does not break unrelated browser workflows.
- Added `run_fast_checks.sh` as the consumer-owned build-and-check front door after refreshing
  vendored template content; the generated-output ignore rule remains consumer-owned.
- Added explicit validator coverage for executable SVG attributes and DTD/entity declarations, a
  browser selector-contract note, and removed an unused enemy artwork wrapper.
- Split world presentation from combat styling after the repository line-limit gate caught the
  combined stylesheet, and made screenshot tower selection use the visible map coordinate so
  rotated SVG weapon rigs remain reliably selectable.
- Kept the accelerated Cluster Corridor screenshot playthrough at 1x simulation speed after its
  former 4x setting skipped too much tower cadence on the longer curved route.
- Anchored live weapon rotation at each tower's local origin after visual capture exposed an
  antibody rig orbiting away from its stationary base at steep targeting angles.
- Kept deployment environment-only: GitHub Actions pins Python 3.12, uses the lockfile through
  `npm ci`, and delegates generation to the same consumer-owned production build used locally.
- Hardened SVG reference validation so a valid local `url(#id)` cannot hide an external URL in the
  same attribute, with a compact regression test for the mixed-reference case.
- Added a stable SVG tower hit target so production-shaped upgrade tests use ordinary actionable
  clicks instead of bypassing browser hit testing.
- Resolved the repository root with `git rev-parse --show-toplevel` from the caller's working tree
  and sourced the required Python 3.12 environment inside the production build.
- Clarified that production builds emit generated visual components, while screenshot capture
  separately builds the temporary browser contact sheet.

### Decisions and Failures

- Chose a rig-first hybrid boundary: editable semantic SVG geometry is canonical, CSS owns internal
  choreography, and TypeScript owns gameplay positions and visual state. Apoptosis alone uses a
  short frame strip because distinct poses improve biological readability.
- Used stylized microscopy rather than gore. Type identity comes from both silhouette and internal
  structure, while color remains a supporting cue.
- Kept route rendering, movement, placement clearance, HUD, collision, and save-format behavior
  stable. The sixth treatment uses the existing cooldown, targeting, upgrade, and visual-state
  systems rather than introducing a separate gameplay timer or decorative frame loop.
- An initial accelerated Wave 21 browser strategy used a `0.1 s` simulation step and lost in Wave 17. Matching the production simulation test's `0.025 s` step preserved combat behavior and then
  reached the Tumor Mass with no fixture or direct state mutation.
- The first contact-sheet screenshot fast-forwarded animated apoptosis to its transparent end.
  The capture now seeks and pauses all catalog animations at a deterministic mid-sequence frame.
- Kept the route samples as the canonical gameplay path instead of drawing a decorative curve over
  the former collision polyline; enemies, placement checks, attack targeting, and artwork therefore
  agree on the same geometry.
- Kept range checks, splash damage, movement, and escape progress on the canonical route centerline;
  only actor paint, weapon endpoints, health bars, and death effects follow the visual lane offset.
- Framed CRISPR repair as speculative game fiction informed by cell-culture and xenograft research,
  not as an approved therapy, a clinical recommendation, or a claim that edited tumors become
  healthy patient tissue.

### Developer Tests and Notes

- `./run_fast_checks.sh` regenerated and built the visual components, passed the reset-safe
  five-step vendored codebase gate with 19 Node tests, and passed all 802 pytest cases, including
  14 visual generator tests.
- `./build_github_pages.sh` generated 27 sheets and produced the Pages artifact with all three
  source stylesheets.
- `./run_playwright_tests.sh --build` passed all 12 browser tests.
- `./capture_screenshots.sh` refreshed the three real-game captures and produced the generated
  component contact sheet without browser errors or duplicate IDs.
- Real-browser inspection covered 680, 1280, and 1600 pixel viewports, normal and reduced motion,
  every treatment tier, all enemy variants, attack effects, both tissue regions, apoptosis,
  rupture, CRISPR mismatch and repair, the smiling-cell transition, and the Wave 21 Tumor Mass.
- `git diff --check` passed.

## 2026-08-21

### Additions and New Features

- Added three current gameplay captures under `docs/screenshots/`: a paused Wave 1 overview, an
  Antibody Therapy targeting close-up, and the dense Cluster Corridor.
- Added `capture_screenshots.sh` and its Playwright helper for reproducible screenshot refreshes.

### Behavior or Interface Changes

- Added a visual proof section to the README and clarified the local preview behavior.

### Decisions and Failures

- Chose three static views so the route, HUD, targeting range, Antibody mark, and second scene remain
  inspectable without autoplay motion.
- The first sandboxed Chromium launch failed at the macOS Mach-port boundary; the approved browser
  run completed successfully.
- The first automated Cluster Corridor strategies lost before the transition. A deterministic
  simulation pass tuned a capture-only tower layout that then cleared the real browser flow.
- The existing Playwright suite still contains two stale economy expectations: Standard 500 TP and
  560 TP after placing a Doctor. The current game correctly renders Standard 380 TP and 410 TP after
  that Practice placement.

### Developer Tests and Notes

- `./capture_screenshots.sh` rebuilt the Pages artifact and refreshed all three captures successfully.
- `./check_codebase.sh` passed all five checks, including eight Node tests.
- `source source_me.sh && python3 -m pytest tests/` passed all 639 tests against the complete
  three-screenshot tree.
- `./run_playwright_tests.sh --build --timeout=10000` passed the browser smoke test and exposed the
  two stale value assertions above.
- The local preview and live GitHub Pages URL both served the expected game entry page.

## 2026-08-19

### Additions and New Features

- Documented the Attack on Cancer v1 game experience, controls, roster, and SolidJS model.
- Added the v1 game design reference with fixed difficulty, wave, treatment, and enemy boundaries.
- Tuned the playfield for 16:10 landscape framing and added optional circulation and cell motion.
- Added gesture-activated, bounded Web Audio cues for placement, waves, treatments, and outcomes.
- Reworked treatment effects into distinct syringe, burst, immune-strike, beam, and antibody-chain visuals.
- Made cancer cells inspectable and corrected 16:10 placement, combat-audio, and range ownership issues.
- Tightened Challenge to 260 starting TP and 7 allowed metastases for a sharper resource constraint.
- Added a persisted 4x simulation speed control for fast wave cleanup.
- Increased Challenge wave groups by 40 percent while retaining their fixed enemy composition.
- Added a beating Wave 15 Tumor Mass that sheds Basic cells as it travels and ruptures into fragments.
- Strengthened Tumor Mass motion with rhythmic pulse, rotating vascular rings, shifting nodules, and shed cues.
- Simplified Tumor Mass motion to one readable double heartbeat and an event-only shed cue.
- Added the confirmed GitHub Pages play link to the README landing page.
- Added the Cluster Corridor second scene: a multi-tumor source, longer winding route, clean
  rebuild field, 200 TP grant, and six high-density waves after Skin Tissue wave 15.
- Tightened the economy: lower opening TP, smaller cell rewards, 55% sale refunds, and a 200 TP
  Cluster Corridor field grant make each treatment purchase matter.
- Enabled sound by default for new players while retaining gesture-activated browser audio.
- Refreshed the README landing page with a newcomer quick start, project promise, and documentation map.

### Decisions and Failures

- Kept v1 focused on one Skin Tissue level, five treatments, five enemy types, and 15 manual waves.
- Kept biology optional and non-clinical; the game does not model patient outcomes or treatment decisions.
## 2026-08-29

### Additions and New Features

- Replaced subtle tower tier pips with a high-contrast lower-right Tier 1-4 crest and geometric glyphs.
- Added tier-scaled attack durations, impact emphasis, and shared electric accent progression.
- Chemotherapy splash radius now grows by tier (48, 58, 72, 90); all other combat rules remain unchanged.
- Added a four-step upgrade ladder to the selected-treatment inspector.

### Validation

- `./run_fast_checks.sh` passes build, typecheck, lint, format, Node tests, and 958 pytest cases.
