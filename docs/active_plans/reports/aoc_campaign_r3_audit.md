# AOC campaign R3 final integrated audit

## Verdict

**PASS for R3 acceptance.** The integrated tree matches the approved ten-level
branching-campaign plan and has current, production-built evidence for the
full campaign, responsive visual matrix, pointer/keyboard interaction, and
the repaired continuous-vessel presentation. No release blocker remains in
the material reviewed here.

This is not the I1 close-out: the active plan correctly remains in
`docs/active_plans/active/` until I1 runs the final material-tree gates and
archives it.

## Scope and evidence

This fresh, read-only review reconciled the active plan, working-tree diff,
the final R1/R2/T1/T2/B1/V1 records, the six independent R3 reviewer findings,
the current test sources, and the retained browser artifacts.

- R1 accepts the typed catalog, route-aware simulation, progression, and SVG
  asset contract; R2 accepts the whole-campaign economy and mixed L8/L10
  layouts.
- T1 drives the built UI through all ten levels using visible treatment, map,
  inspector, wave, and continuation controls, ending with `CANCER CONTAINED`.
- T2's normal and reduced-motion players each reached Level 10 and retained
  24 captures: Levels 3, 6, 8, and 10 at 680-wide full-page, 1280x800, and
  1600x1000.
- B1 records an independent four-test built run and clearly labels the later
  complete-suite result as manager-reported corroboration rather than its own
  execution.
- V1 independently inspected all 24 final images and passes the continuous
  vessel, wide-field, control-order, reflow, reduced-motion, and biological
  context criteria.
- `test-results/.last-run.json` currently records `passed` with no failed
  tests, and exactly 24 current matrix PNGs are present under `test-results/`.

## Six-reviewer findings and resolutions

### Major findings resolved

1. **Plan/status and wide-field contract.** The final visual-matrix assertions
   measure the whole 16:10 desktop shell, 9:5 battlefield, no desktop vertical
   overflow, and battlefield width shares greater than 73% at 1280px and 82%
   at 1600px. They also preserve the treatment-before-wave DOM and visual
   order. The compact Level 3/10 status treatment handles long titles without
   reclaiming the battlefield.
2. **Playwright organization and browser interaction.** The real-UI campaign
   driver now lives beside its E2E consumers at
   `tests/playwright/e2e/helper_campaign_browser_driver.ts`; both campaign
   suites import it there. The full browser gate adds visible upgrade/sell
   proof, while the legacy smoke test converts canonical map coordinates using
   the rendered playfield bounds.
3. **Documentation and evidence hygiene.** README includes current Level 3 and
   Level 10 real-UI screenshots and accurately distinguishes the Level 1
   documentation capture from the real-UI matrix. The changelog records the
   ten-level campaign, vessel repair, full-width presentation, 24-image
   matrix, and the final browser result. The obsolete R3 `NOT READY` decision
   is superseded by this report.
4. **Catalog coverage.** The visual catalog iterates `CAMPAIGN_LEVELS`, so its
   world preview exposes every authored level rather than only the original
   two. Browser capture assertions exercise each planned late-world target and
   its required artwork/theme pairing.

### Minor findings resolved

5. **Vessel-junction clutter and CSS cleanup.** Route paint is globally
   layered as beds, membranes, solid flows, and thin currents. The shadow is
   applied once to the bed group; no per-segment filter remains. The rendered
   landmark markers responsible for target-eye caps are absent, while typed
   landmark data, source/exit art, and obstacle semantics remain.
6. **Comments and stale test assumptions.** Selector ownership comments name
   stable source surfaces rather than stale line numbers. Dead layout values,
   duplicate declarations, and obsolete marker assumptions were removed; the
   remaining assertions describe the current responsive and route-paint
   contracts.

## Gate record

| Gate                  | Result | Evidence                                                                                                                    |
| --------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------- |
| Static material tree  | PASS   | `npm run check:all`: generated assets, production build, TypeScript, ESLint, Prettier, 45 Node tests, and 893 Python tests. |
| Real UI campaign      | PASS   | T1: `./run_playwright_tests.sh --build tests/playwright/e2e/campaign.spec.ts` - 1 passed in 8.7 minutes.                    |
| Visual matrix         | PASS   | T2 captures all required target levels, widths, and motion modes; 24 PNGs remain.                                           |
| Full browser suite    | PASS   | `./run_playwright_tests.sh --build` - exactly 20 passed in 8.4 minutes.                                                     |
| Documentation capture | PASS   | `./capture_screenshots.sh` refreshed the current Level 1 documentation views and all-world catalog output.                  |
| Visual acceptance     | PASS   | V1 independently inspected the final 24 images.                                                                             |
| Report hygiene        | PASS   | Prettier and `git diff --check` pass for this R3 report.                                                                    |

## Remaining handoff and limitations

- I1 still owns final material-tree validation and the `git mv` archival move;
  R3 does not declare that step complete.
- The active plan and changelog currently preserve the then-current statement
  that V1 and R3 were pending. I1 should update that transitional status while
  recording its own final gates; it is documentation handoff work, not a
  campaign or release blocker.
- V1 evaluates clean level-entry states, not terminal-overlay imagery. The
  terminal transition is nonetheless exercised by the built real-UI campaign
  and visible-transition browser assertions.

## Release call

**R3 PASS.** The six independent review tracks have no unresolved blocker,
the approved plan's campaign and visual contracts are implemented, and the
accepted evidence supports I1 finalization.
