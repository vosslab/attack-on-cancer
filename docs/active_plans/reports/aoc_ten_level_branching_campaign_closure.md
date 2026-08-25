# Ten-level branching campaign closure

## Release result

**PASS.** The ten-level branching campaign is complete and the implementation
plan has moved to `docs/archive/`. It delivers route-aware play across ten
original microscopic environments, editable SVG world art, continuous vessel
rendering, a browser-wide 16:10 battlefield, and treatment-before-wave
controls.

## Accepted evidence

- [R1 contract review](aoc_campaign_r1_final_contract_review.md) and
  [R2 balance review](aoc_campaign_r2_balance_review.md) accept the catalog,
  route simulation, economy envelopes, and mixed late-level defenses.
- [T2 visual matrix](aoc_campaign_t2_visual_matrix.md) retained 24 real-UI
  captures for Levels 3, 6, 8, and 10 at 680-wide full-page, 1280x800, and
  1600x1000 in normal and reduced-motion modes.
- [B1 browser report](aoc_campaign_b1_browser_report.md),
  [V1 visual review](aoc_campaign_v1_visual_review.md), and
  [R3 integrated audit](aoc_campaign_r3_audit.md) all pass. The final complete
  browser gate, `./run_playwright_tests.sh --build`, passed exactly 20 tests in
  8.4 minutes on the current application and test tree.
- Promoted, tracked visual evidence is
  [`docs/screenshots/capillary_crossroads.png`](../../screenshots/capillary_crossroads.png)
  and
  [`docs/screenshots/metastatic_confluence.png`](../../screenshots/metastatic_confluence.png).

## Final material-tree gates

| Command                                                                    | Result                                                                                                    |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `./run_fast_checks.sh`                                                     | PASS: production build, TypeScript, lint, Prettier, and 45 Node tests; its Python phase passed 895 tests. |
| `./build_github_pages.sh`                                                  | PASS: regenerated visual catalog and production `dist/`.                                                  |
| `source source_me.sh && python3 -m pytest tests/`                          | PASS: 895 tests.                                                                                          |
| `git diff --check`                                                         | PASS before and after close-out documentation.                                                            |
| `git diff --cached --check`                                                | PASS before and after close-out documentation.                                                            |
| `source source_me.sh && python3 -m pytest tests/test_markdown_links.py -q` | PASS after archival links were updated.                                                                   |

## Evidence boundary

V1 assesses clean level-entry states; it does not independently judge the
terminal containment overlay. The terminal transition is covered by the built
real-UI campaign test. The transient `test-results/` matrix artifacts are
ignored by Git; the two representative 1600-pixel captures above are promoted
and tracked for durable documentation proof.
