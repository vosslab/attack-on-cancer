# AOC campaign R1 final contract review

## Decision

**PASS -- C1-C14 campaign-contract implementation is accepted.** The current
tree uses one ten-level catalog and route-aware simulation model; the former
two-scene compatibility surface is absent from `src/` and campaign tests.

This is a source-and-focused-test contract review. It is not the final
production-shaped browser release proof; that remains assigned to T1/B1.

## Evidence reviewed

- **C1/C12 catalog contract:** `src/game_types.ts` defines `LevelId` as levels
  1 through 10 and has no `SceneId` or `GameState.scene`. The ordered,
  import-time-validated `CAMPAIGN_LEVELS` registry, canonical route cache, and
  catalog lookup API are in `src/levels/campaign.ts`. The catalog test verifies
  the ordered ten definitions and level-specific topology lessons.
- **C2-C11 authored levels:** all ten level modules provide routes, landmarks,
  obstacles, placement probes, economy, and route-cycle waves. The catalog
  tests deep-compare the complete carried-forward Level 1/2 route coordinates,
  waves, and economy; Level 3 shares one `shared-central-crossing` segment
  identity; and Levels 6, 8, 9, and 10 have specific topology assertions.
- **C13 route-aware simulation:** `src/simulation.ts` carries `level` and
  `routeId` through spawning, movement, placement clearance, targeting,
  range/splash, escape checks, and visual coordinates. Focused tests cover
  shared geometry, least-remaining-route-distance targeting, stable-ID ties,
  coordinate-based cross-route effects, and deterministic route cycles.
- **C14 progression and effects:** the only campaign transition API is
  `advanceLevel()`; it preserves metastases and applies configured carryover
  caps. The final Level 10 resolution enters `won` rather than offering a
  further transition. Descendants, shedding, repair effects, and death effects
  retain the parent route identity.
- **Visual and generator contract:** `src/world_landmarks.tsx` selects
  catalog-derived SVG world artwork for Levels 3-10 while retaining the Level
  1/2 presentation. `generate_visual_assets.py` rejects DTD/entity input and
  generates its closed artwork type union from the approved world sheets. The
  editable `assets/visuals/world_*.svg` sources are present for all eight new
  level worlds.

## Gates run

- `node --import tsx --test tests/test_level_catalog.mjs tests/test_simulation.mjs tests/test_enemy_visuals.mjs` -- **PASS**, 43 tests.
- `source source_me.sh && python3 -m pytest tests/test_generate_visual_assets.py -q` -- **PASS**, 17 tests.
- `npx tsc --noEmit -p tsconfig.json` -- **PASS**.
- `git diff --check` -- **PASS**.

## Non-blocking evidence gaps

1. **Full real-UI campaign proof is still pending.** T1/B1 must still drive
   the built game from Level 1 through Level 10 using visible controls and
   record the release-proof result. The focused browser selector coverage does
   not replace that end-to-end proof.

## Addendum: resolved Level 1/2 carry-forward evidence

The catalog now deep-compares each pre-campaign Level 1/2 route coordinate,
wave entry, route cycle, and economy value against the complete expected
fixture. `node --import tsx --test tests/test_level_catalog.mjs` passes 13
tests, including that exact carry-forward contract. The previously noted
serialized-fixture evidence gap is resolved; the T1/B1 real-UI gap remains
pending.

## Handoff

Accept C1-C14 for integration. Keep the T1/B1 release-proof follow-up visible
in the final delivery; it is not a contract blocker.
