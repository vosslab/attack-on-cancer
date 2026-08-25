# T2 campaign visual matrix

**Result:** PASS - the settled built Playwright run completed 20 tests in 8.4 minutes, including both real UI campaign traversals and their 24 captures.

## Commands

```text
npx prettier --write tests/playwright/e2e/helper_campaign_browser_driver.ts tests/playwright/e2e/campaign.spec.ts tests/playwright/e2e/campaign_visual_matrix.spec.ts
npx eslint tests/playwright/e2e/helper_campaign_browser_driver.ts tests/playwright/e2e/campaign.spec.ts tests/playwright/e2e/campaign_visual_matrix.spec.ts
npx tsc --noEmit
git diff --check
./run_playwright_tests.sh --build
```

All static checks passed. The final full built suite completed **20 passed in 8.4m**. The T2 normal-motion and reduced-motion players ran in parallel, each through Level 1 to terminal Level 10 containment. `test-results/.last-run.json` records `status: "passed"` with no failed tests.

## Assertions

At each clean Level 3, 6, 8, and 10 entry, before placing that level's treatments, both modes asserted visible campaign/map context and briefing; unique SVG IDs; route layers in `bed`, `membrane`, `flow`, `current` order with matching nonzero segment counts; group-level shadow and no individual bed filter; solid flow; no `.world-landmark-marker` overlays; and the authored world-art/theme pairing.

The world pairings were Level 3 `capillary_crossroads` / `capillary-crossroads`, Level 6 `ductal_delta` / `ductal_delta`, Level 8 `fibrotic_sieve` / `fibrotic_sieve`, and Level 10 `metastatic_confluence` / `metastatic-confluence`.

Normal motion required an active `.route-current` animation; reduced motion required no such animation. Every size had no horizontal overflow, a visible readable playfield, and both DOM and visual planning order: the treatment tray precedes wave controls. The constrained desktop checks also retain compact Level 3 and Level 10 status presentation.

At 1280x800 and 1600x1000, the whole browser shell stays 16:10 while the interior battlefield uses its intentional 9:5 presentation. It has no vertical overflow, a completely in-viewport playfield, and occupies more than 73% and 82% of the shell width, respectively, on the fresh Level 1 stress case; the late-level matrix applies the same thresholds. Narrow 680px uses intentionally vertical responsive flow, so its no-clipping evidence is a truthful full-page image.

## Artifacts

The names below are exact paths and measured PNG dimensions. `680w_fullpage` identifies full-page narrow responsive evidence; all 1280x800 and 1600x1000 files are viewport captures.

| Level | Normal motion                                                                                                                                                                                                                                                                                                                                                                                       | Reduced motion                                                                                                                                                                                                                                                                                                                                                                                         |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 3     | `test-results/e2e-campaign_visual_matrix-eb6d6-visual-matrix-normal-motion/campaign_level_03_680w_fullpage_normal.png` - 680x1455<br>`test-results/e2e-campaign_visual_matrix-eb6d6-visual-matrix-normal-motion/campaign_level_03_1280x800_normal.png` - 1280x800<br>`test-results/e2e-campaign_visual_matrix-eb6d6-visual-matrix-normal-motion/campaign_level_03_1600x1000_normal.png` - 1600x1000 | `test-results/e2e-campaign_visual_matrix-42636-isual-matrix-reduced-motion/campaign_level_03_680w_fullpage_reduced.png` - 680x1455<br>`test-results/e2e-campaign_visual_matrix-42636-isual-matrix-reduced-motion/campaign_level_03_1280x800_reduced.png` - 1280x800<br>`test-results/e2e-campaign_visual_matrix-42636-isual-matrix-reduced-motion/campaign_level_03_1600x1000_reduced.png` - 1600x1000 |
| 6     | `test-results/e2e-campaign_visual_matrix-eb6d6-visual-matrix-normal-motion/campaign_level_06_680w_fullpage_normal.png` - 680x1424<br>`test-results/e2e-campaign_visual_matrix-eb6d6-visual-matrix-normal-motion/campaign_level_06_1280x800_normal.png` - 1280x800<br>`test-results/e2e-campaign_visual_matrix-eb6d6-visual-matrix-normal-motion/campaign_level_06_1600x1000_normal.png` - 1600x1000 | `test-results/e2e-campaign_visual_matrix-42636-isual-matrix-reduced-motion/campaign_level_06_680w_fullpage_reduced.png` - 680x1424<br>`test-results/e2e-campaign_visual_matrix-42636-isual-matrix-reduced-motion/campaign_level_06_1280x800_reduced.png` - 1280x800<br>`test-results/e2e-campaign_visual_matrix-42636-isual-matrix-reduced-motion/campaign_level_06_1600x1000_reduced.png` - 1600x1000 |
| 8     | `test-results/e2e-campaign_visual_matrix-eb6d6-visual-matrix-normal-motion/campaign_level_08_680w_fullpage_normal.png` - 680x1439<br>`test-results/e2e-campaign_visual_matrix-eb6d6-visual-matrix-normal-motion/campaign_level_08_1280x800_normal.png` - 1280x800<br>`test-results/e2e-campaign_visual_matrix-eb6d6-visual-matrix-normal-motion/campaign_level_08_1600x1000_normal.png` - 1600x1000 | `test-results/e2e-campaign_visual_matrix-42636-isual-matrix-reduced-motion/campaign_level_08_680w_fullpage_reduced.png` - 680x1439<br>`test-results/e2e-campaign_visual_matrix-42636-isual-matrix-reduced-motion/campaign_level_08_1280x800_reduced.png` - 1280x800<br>`test-results/e2e-campaign_visual_matrix-42636-isual-matrix-reduced-motion/campaign_level_08_1600x1000_reduced.png` - 1600x1000 |
| 10    | `test-results/e2e-campaign_visual_matrix-eb6d6-visual-matrix-normal-motion/campaign_level_10_680w_fullpage_normal.png` - 680x1499<br>`test-results/e2e-campaign_visual_matrix-eb6d6-visual-matrix-normal-motion/campaign_level_10_1280x800_normal.png` - 1280x800<br>`test-results/e2e-campaign_visual_matrix-eb6d6-visual-matrix-normal-motion/campaign_level_10_1600x1000_normal.png` - 1600x1000 | `test-results/e2e-campaign_visual_matrix-42636-isual-matrix-reduced-motion/campaign_level_10_680w_fullpage_reduced.png` - 680x1499<br>`test-results/e2e-campaign_visual_matrix-42636-isual-matrix-reduced-motion/campaign_level_10_1280x800_reduced.png` - 1280x800<br>`test-results/e2e-campaign_visual_matrix-42636-isual-matrix-reduced-motion/campaign_level_10_1600x1000_reduced.png` - 1600x1000 |

## Gaps

None for the automated T2 matrix. These `test-results` images remain browser-test evidence rather than promoted documentation assets; independent visual review is separate evidence.

## Development-note corrections

Earlier T2 development attempts used an inner-SVG ratio oracle and encountered content-wrap failures. Those were test-development findings, not final failures: the settled evidence validates the whole 16:10 shell and the intended 9:5 battlefield width-share contract, together with compact constrained-desktop status and the corrected treatment-before-wave ordering.
