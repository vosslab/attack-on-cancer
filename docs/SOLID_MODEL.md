# SolidJS model

## Client boundary

Attack on Cancer is a client-only SolidJS application bundled as static files
for GitHub Pages. The browser owns the game run. There is no backend, account,
analytics service, or saved in-progress game state.

## State ownership

The game separates pure simulation from interface state.

- The simulation owns deterministic movement, targeting, damage, repair attempts,
  division, rewards, metastasis, waves, and terminal state.
- Typed configuration tables own treatment, upgrade, enemy, difficulty, and
  wave balance values.
- Typed level definitions own each route network, landmark, and obstacle's
  required biological fact and simplified game role. Validation rejects
  incomplete learning metadata before the UI renders it.
- The Solid UI owns actor positions, route geometry, ranges, health bars,
  targeting endpoints, controls, pointer and keyboard placement, overlays, and
  panels.
- Editable SVG sheets own semantic combat and landmark geometry. Generated
  Solid components expose that geometry to the UI without taking ownership of
  gameplay state.
- The persistence boundary validates versioned browser settings before use.

## Reactivity model

- Signals hold scalar interface state such as selected treatment, pause state,
  speed, and panel visibility.
- A Solid store holds nested interface data such as placement and selection.
- Memos derive HUD text, affordability, selection labels, and related values.
- Dynamic SVG actors render with `<For>` so towers, cells, projectiles, and
  effects follow state.

The simulation remains testable without a DOM. The UI consumes rendered values
instead of owning combat rules.

## Animation lifecycle

The animation loop starts in `onMount`, where the client and SVG are available.
Each frame calculates elapsed time, applies 1x, 2x, or 4x speed, and advances the
pure simulation only while playing. Pause prevents simulation advancement.

`onCleanup` cancels the outstanding animation frame when the game component is
removed. This prevents the loop from continuing after teardown and gives each
mounted game one lifecycle owner.

## Generated combat visuals

Canonical artwork lives in `assets/visuals/` as human-editable SVG authoring
sheets. Enemy variants, treatment tiers, and apoptosis frames appear in
adjacent, named panels. Semantic groups such as membranes, nuclei, receptors,
and emitters remain visible in Inkscape's Objects panel.

`generate_visual_assets.py` validates the closed asset catalog, safe SVG
elements and attributes, panel sequences, local references, and unique IDs. It
then removes editor-only material, normalizes each panel around its runtime
origin, and emits type-safe Solid components under the ignored
`generated/visual_assets/` directory. The consumer-owned production build runs
the generator before TypeScript compilation. `run_fast_checks.sh` runs that
build before the reset-safe vendored `check_codebase.sh`; generated TSX is never
hand-edited or committed.

Each rendered artwork receives a stable `instanceKey`. The generated component
uses it to namespace gradients, masks, clip paths, filters, and references so a
dense wave can safely render many instances of the same sheet. Runtime wrappers
expose typed visual state and deterministic variants. TypeScript changes the
state; `src/combat_visuals.css` owns combat paint and applies animation to the
actors, `src/combat_motion.css` owns the shared keyframes and reduced-motion
policy, while `src/world_visuals.css` owns tissue, route, and landmark
presentation.

The apoptosis component overlays five generated vector panels during the
existing death-effect lifetime. Rupture uses a separate rig. Successful CRISPR
attempts emit a typed repair event so the UI can show the generated healthy-cell
transition without misclassifying the removed enemy as destroyed. None of these
effects adds a decorative simulation timer or changes collision geometry.
Reduced-motion rules remove continuous ambient motion while retaining short,
legible combat, death, and repair states.

## Visual review catalog

`tools/build_visual_catalog.mjs` bundles a temporary catalog from the same
generated Solid components and production CSS used by the game. It renders all
enemy variants, treatment tiers, attacks, death and repair transitions, landmarks, tissue
regions, sizes, and motion modes under `test-results/visual-assets/`.
`capture_screenshots.sh` drives its playback controls, verifies unique IDs and
browser errors, and captures the generated contact sheet. The catalog is
review output, not a second implementation of the game.

## Browser storage

Local storage uses a versioned settings record. Boundary validation accepts only
sound preference, preferred speed, and the best result per difficulty. Invalid
or unknown data falls back to safe defaults. A game run is never restored.

## Sound feedback

Sound is enabled by default, but the browser Web Audio API still waits for the
player's first sound-enabled interaction. Short semantic cues distinguish
placement, waves, each treatment attack, victory, and defeat. The game never
creates or resumes an audio context while sound is off, and it rate-limits rapid
treatment sounds so busy waves remain readable.
