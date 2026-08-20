# Attack on Cancer test workstream

## Delivered coverage

- `tests/test_simulation.mjs` covers deterministic path and wave scheduling,
  placement rejection, upgrading, selling, division, antibody-assisted T Cell
  damage, escape defeat, and final-wave victory.
- `tests/test_persistence.mjs` covers versioned-save validation, malformed data,
  supported preference updates, and monotonic best-result storage.
- `tests/playwright/game.spec.ts` covers a console-clean load, difficulty,
  manual wave start, pause/resume, 2x speed, treatment placement, and inspect.

## Verification

- `node --import tsx --test tests/test_simulation.mjs tests/test_persistence.mjs`
  passed: 7 tests.
- `npx tsc --noEmit -p tsconfig.json` passed after UI integration fixes.
- `npx prettier --check tests/test_simulation.mjs tests/test_persistence.mjs tests/playwright/game.spec.ts`
  passed.
- `npx eslint --max-warnings 0 tests/test_simulation.mjs tests/test_persistence.mjs tests/playwright/game.spec.ts`
  passed.
- `./run_playwright_tests.sh --build` passed: 3 browser tests.

## Browser build finding

The first Playwright run caught a blank-page production build caused by React
JSX output. The Solid build integration was corrected, then the full browser
suite passed against the rebuilt GitHub Pages artifact.
