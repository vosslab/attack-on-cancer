## 2026-08-24

### Additions and New Features

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

### Decisions and Failures

- Chose a rig-first hybrid boundary: editable semantic SVG geometry is canonical, CSS owns internal
  choreography, and TypeScript owns gameplay positions and visual state. Apoptosis alone uses a
  short frame strip because distinct poses improve biological readability.
- Used stylized microscopy rather than gore. Type identity comes from both silhouette and internal
  structure, while color remains a supporting cue.
- Kept route rendering, movement, placement clearance, HUD, collision, and save-format behavior
  stable. The sixth treatment uses the existing cooldown, targeting, upgrade, and visual-state
  systems rather than introducing a separate gameplay timer or decorative frame loop.
- An initial accelerated Wave 21 browser strategy used a `0.1 s` simulation step and lost in Wave
  17. Matching the production simulation test's `0.025 s` step preserved combat behavior and then
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

- `./run_fast_checks.sh` regenerated and built the visual catalog, passed the reset-safe five-step
  vendored codebase gate with 19 Node tests, and passed all 787 pytest cases, including 13 visual
  generator tests.
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
