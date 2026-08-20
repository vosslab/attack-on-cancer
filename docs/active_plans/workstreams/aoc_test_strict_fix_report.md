# Playwright Inspect Strict-Mode Fix

## Scope

Updated only `tests/playwright/game.spec.ts`; game source was not changed.

## Change

The placement-and-inspection test now scopes its Doctor description assertion to
the `.inspect` panel. The description is intentionally rendered both in the
selected tower card and in Inspect, so the prior page-wide text locator violated
Playwright strict mode despite correct UI behavior.

## Verification

- PASS: `npx tsc --noEmit -p tsconfig.json`
- PASS: `bash run_playwright_tests.sh --build tests/playwright/game.spec.ts`
  outside the browser sandbox — 3 passed, including the corrected Inspect
  assertion.
