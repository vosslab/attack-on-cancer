# SolidJS model

## Client boundary

Attack on Cancer is a client-only SolidJS application bundled as static files
for GitHub Pages. The browser owns the game run. There is no backend, account,
analytics service, or saved in-progress game state.

## State ownership

The game separates pure simulation from interface state.

- The simulation owns deterministic movement, targeting, damage, division,
  rewards, metastasis, waves, and terminal state.
- Typed configuration tables own treatment, upgrade, enemy, difficulty, and
  wave balance values.
- The Solid UI owns SVG rendering, controls, pointer and keyboard placement,
  overlays, and panels.
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
Each frame calculates elapsed time, applies 1x or 2x speed, and advances the
pure simulation only while playing. Pause prevents simulation advancement.

`onCleanup` cancels the outstanding animation frame when the game component is
removed. This prevents the loop from continuing after teardown and gives each
mounted game one lifecycle owner.

## Browser storage

Local storage uses a versioned settings record. Boundary validation accepts only
sound preference, preferred speed, and the best result per difficulty. Invalid
or unknown data falls back to safe defaults. A game run is never restored.

## Sound feedback

Sound uses the browser Web Audio API only after the player enables it. Short
semantic cues distinguish placement, waves, each treatment attack, victory,
and defeat. The game never creates or resumes an audio context while sound is
off, and it rate-limits rapid treatment sounds so busy waves remain readable.
