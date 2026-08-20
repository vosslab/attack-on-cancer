# Attack on Cancer inspect test correction

## Change

- Updated `tests/playwright/game.spec.ts` so the test clicks the placed Doctor
  tower before opening Inspect. Placement intentionally clears treatment
  selection, while selecting the tower restores the Doctor's optional
  description.

## Verification

- `npx tsc --noEmit -p tsconfig.json` passed with exit 0 and no diagnostics.
- `PW_PORT=4179 ./run_playwright_tests.sh tests/playwright/game.spec.ts --workers=1`
  could not launch Chromium in this sandbox. Chromium exited before test
  execution with macOS Mach rendezvous permission denied
  (`bootstrap_check_in ... Permission denied (1100)`).
