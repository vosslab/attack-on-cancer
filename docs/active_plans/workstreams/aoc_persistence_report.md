# Persistence workstream report

## Scope

Implemented `src/persistence.ts` as the versioned browser-settings boundary.

## Decisions

- Storage key: `attack-on-cancer.settings.v1`.
- Only sound, preferred simulation speed, and non-negative integer best results persist.
- Missing, malformed, inaccessible, or incompatible storage produces safe defaults.
- Browser storage failures never block a new game; run state is intentionally absent.
- `recordBestResult()` keeps the larger value for its difficulty.

## Changed files

- `src/persistence.ts`
- `docs/active_plans/workstreams/aoc_persistence_report.md`

## Validation

- `npx tsc --noEmit -p tsconfig.json`
