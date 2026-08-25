# AOC campaign B1 production-browser report

## Verdict

**PASS.** A fresh production-built browser run completed all four requested
tests. It exercised the full visible-control Level 1 through Level 10 journey,
the normal and reduced-motion visual matrices, and pointer/keyboard treatment
interaction. The runner left no server on port 4173.

## Command and result

Executed on 2026-08-25 from the repository root:

```text
./run_playwright_tests.sh --build tests/playwright/e2e/campaign.spec.ts tests/playwright/e2e/campaign_visual_matrix.spec.ts tests/playwright/tower_interaction.spec.ts
```

The runner rebuilt `dist/` (including regenerated visual assets), served it
with its managed HTTP server on port 4173, and began with the reporter line
`Running 4 tests using 4 workers`. The first completed reporter result was:

```text
[OK]  tests/playwright/tower_interaction.spec.ts:45:1 > a placed treatment is a labeled SVG button with pointer and keyboard inspector access (2.6s)
```

The wrapper's streaming capture returned before the long campaign workers had
printed their final terminal summary. I therefore verified final status from
the runner's own post-run artifact, `test-results/.last-run.json`:

```json
{ "status": "passed", "failedTests": [] }
```

The managed process tree was active for about 8 minutes and 13 seconds before
exiting. No command failure, Playwright failure artifact, browser console
failure, or page-error artifact was produced. The only reporter noise was the
Node warning that `NO_COLOR` was ignored because `FORCE_COLOR` was set; it did
not affect the run.

## Browser-state evidence

- The full campaign test used only visible treatment buttons, SVG map clicks,
  named inspector controls, wave buttons, and visible continuation controls. It
  verifies every authored level context and ends on `CANCER CONTAINED` / `All
ten campaign levels`, with metastases below the loss limit.
- The matrix test passed for normal and reduced motion at Levels 3, 6, 8, and 10. Its passing contract verifies no `.world-landmark-marker` remains,
  route layers are exactly `bed`, `membrane`, `flow`, and `current`, the vessel
  bed receives the shared shadow while individual segments do not, the lumen
  is solid, animation is limited to the thin current trace, the current stops
  under reduced motion, IDs are unique, and no horizontal overflow occurs.
- At 1280 x 800 and 1600 x 1000 the test verifies the exact viewport dimensions
  and a whole viewport composition: playfield bounds remain inside the viewport
  and the document has no vertical overflow. The 680-pixel captures deliberately
  use truthful `fullPage` capture because their page heights exceed 900 pixels.
- The full campaign test asserts that the visible initial UI contains neither a
  Level Select/Choose Level control nor Replay. The pointer/keyboard test
  independently passed labeled SVG treatment selection via pointer, Space, and
  Enter, plus visible inspector opening and wave-start behavior.

## Capture manifest

All 24 PNGs exist under `test-results/`. Desktop frames are exact whole
viewports; narrow frames are full-page captures. The paths below are relative
to the repository root.

| Level | Motion  | 680 full-page                                                                                                                        | 1280 desktop                                                                                                                    | 1600 desktop                                                                                                                      |
| ----- | ------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 3     | normal  | `test-results/e2e-campaign_visual_matrix-eb6d6-visual-matrix-normal-motion/campaign_level_03_680w_fullpage_normal.png` (680 x 1455)  | `test-results/e2e-campaign_visual_matrix-eb6d6-visual-matrix-normal-motion/campaign_level_03_1280x800_normal.png` (1280 x 800)  | `test-results/e2e-campaign_visual_matrix-eb6d6-visual-matrix-normal-motion/campaign_level_03_1600x1000_normal.png` (1600 x 1000)  |
| 6     | normal  | `test-results/e2e-campaign_visual_matrix-eb6d6-visual-matrix-normal-motion/campaign_level_06_680w_fullpage_normal.png` (680 x 1424)  | `test-results/e2e-campaign_visual_matrix-eb6d6-visual-matrix-normal-motion/campaign_level_06_1280x800_normal.png` (1280 x 800)  | `test-results/e2e-campaign_visual_matrix-eb6d6-visual-matrix-normal-motion/campaign_level_06_1600x1000_normal.png` (1600 x 1000)  |
| 8     | normal  | `test-results/e2e-campaign_visual_matrix-eb6d6-visual-matrix-normal-motion/campaign_level_08_680w_fullpage_normal.png` (680 x 1439)  | `test-results/e2e-campaign_visual_matrix-eb6d6-visual-matrix-normal-motion/campaign_level_08_1280x800_normal.png` (1280 x 800)  | `test-results/e2e-campaign_visual_matrix-eb6d6-visual-matrix-normal-motion/campaign_level_08_1600x1000_normal.png` (1600 x 1000)  |
| 10    | normal  | `test-results/e2e-campaign_visual_matrix-eb6d6-visual-matrix-normal-motion/campaign_level_10_680w_fullpage_normal.png` (680 x 1499)  | `test-results/e2e-campaign_visual_matrix-eb6d6-visual-matrix-normal-motion/campaign_level_10_1280x800_normal.png` (1280 x 800)  | `test-results/e2e-campaign_visual_matrix-eb6d6-visual-matrix-normal-motion/campaign_level_10_1600x1000_normal.png` (1600 x 1000)  |
| 3     | reduced | `test-results/e2e-campaign_visual_matrix-42636-isual-matrix-reduced-motion/campaign_level_03_680w_fullpage_reduced.png` (680 x 1455) | `test-results/e2e-campaign_visual_matrix-42636-isual-matrix-reduced-motion/campaign_level_03_1280x800_reduced.png` (1280 x 800) | `test-results/e2e-campaign_visual_matrix-42636-isual-matrix-reduced-motion/campaign_level_03_1600x1000_reduced.png` (1600 x 1000) |
| 6     | reduced | `test-results/e2e-campaign_visual_matrix-42636-isual-matrix-reduced-motion/campaign_level_06_680w_fullpage_reduced.png` (680 x 1424) | `test-results/e2e-campaign_visual_matrix-42636-isual-matrix-reduced-motion/campaign_level_06_1280x800_reduced.png` (1280 x 800) | `test-results/e2e-campaign_visual_matrix-42636-isual-matrix-reduced-motion/campaign_level_06_1600x1000_reduced.png` (1600 x 1000) |
| 8     | reduced | `test-results/e2e-campaign_visual_matrix-42636-isual-matrix-reduced-motion/campaign_level_08_680w_fullpage_reduced.png` (680 x 1439) | `test-results/e2e-campaign_visual_matrix-42636-isual-matrix-reduced-motion/campaign_level_08_1280x800_reduced.png` (1280 x 800) | `test-results/e2e-campaign_visual_matrix-42636-isual-matrix-reduced-motion/campaign_level_08_1600x1000_reduced.png` (1600 x 1000) |
| 10    | reduced | `test-results/e2e-campaign_visual_matrix-42636-isual-matrix-reduced-motion/campaign_level_10_680w_fullpage_reduced.png` (680 x 1499) | `test-results/e2e-campaign_visual_matrix-42636-isual-matrix-reduced-motion/campaign_level_10_1280x800_reduced.png` (1280 x 800) | `test-results/e2e-campaign_visual_matrix-42636-isual-matrix-reduced-motion/campaign_level_10_1600x1000_reduced.png` (1600 x 1000) |

## Final-integration addendum (manager-reported)

This section is distinct from the independently executed focused four-test B1
run above. The manager reports that the later final complete browser gate,

```text
./run_playwright_tests.sh --build
```

completed with **exactly 20 passed in 8.4 minutes** after the second visible-
control upgrade/sell interaction test and stale game smoke selectors/click-
coordinate assumptions were fixed. I did not independently execute that later,
broader command and therefore do not recast it as B1-run evidence.

Read-only corroboration on the current tree supports the reported scope:

- `tests/playwright/tower_interaction.spec.ts` now contains the additional
  visible-inspector upgrade-and-sell test, checking the displayed upgrade cost,
  tier-two tower identity, displayed sell return, removal, and treatment-point
  changes.
- `tests/playwright/game.spec.ts` now resolves the public SVG playfield by
  accessible name and converts authored 960 x 600 map positions through the
  rendered bounding box before clicking, rather than retaining stale CSS-pixel
  assumptions.
- The current `test-results/.last-run.json` is `{ "status": "passed",
"failedTests": [] }`; it corroborates a clean latest runner outcome but
  intentionally does not supply a test count or elapsed time. The 24 capture
  artifacts listed above remain present.

## Cleanup and report checks

- After the run, `lsof -nP -iTCP:4173 -sTCP:LISTEN` returned no listener;
  no runner or managed `http.server 4173` process remained. No termination was
  necessary.
- `npx prettier --check docs/active_plans/reports/aoc_campaign_b1_browser_report.md` -- PASS.
- `git diff --check -- docs/active_plans/reports/aoc_campaign_b1_browser_report.md` -- PASS.
