# Plan: make scene learning content canonical

## Context

The six-pass scene-tooltip audit accepted the interaction, accessibility, and gameplay-isolation
behavior but found that tooltip explanations are inferred from display-label substrings. Two
exposed objects therefore receive generic game-only copy, even though the HCI task model promises
one biological fact and the object's game role. The audit also found no forward-approved plan for
the original tooltip implementation.

The user's 2026-08-25 instruction to complete every sensible audit fix authorizes this forward
remediation. This plan records the work before the content-model change; it does not pretend to be
retrospective approval for the original implementation.

Implementation status: COMPLETE; retained in `active/` pending human acceptance for archival.

## Objectives

- Make each exposed route network, landmark, and obstacle carry required biological and game-role
  learning content in the canonical level definition.
- Make validation fail when either part of the learning contract is absent.
- Prove every campaign level exposes its authored learning content through the built browser UI.
- Replace brittle prose-length tests with behavior-focused contract tests.

## Design philosophy

Apply **Fix the design, not the symptom**: remove label-substring inference instead of adding
special cases for the two labels that exposed the flaw. Keep content next to the level object it
explains so renaming display text cannot silently change educational meaning.

- Evidence strategy for uncertain methods: compile the concatenated visible copy from separately
  required `biologicalFact` and `gameRole` fields, then compare the rendered accessible name and
  tooltip against those canonical fields at every level boundary.

## Scope

- Add a narrow scene-learning contract to the level-definition module.
- Author route, landmark, and obstacle learning metadata for Levels 1-10.
- Validate non-empty biological facts and game roles during campaign validation.
- Refactor tooltip rendering to consume authored metadata directly.
- Update Node and built-browser tests around the new contract.
- Update the HCI evidence and changelog with final outcomes.

## Non-goals

- Add clinical advice, patient-specific claims, or treatment recommendations.
- Add more focus stops for cells, repeated vessel segments, or decorative generated artwork.
- Change route geometry, tower placement, campaign balance, or the 16:10 layout.
- Require a participant study, screen-reader session, or new accessibility dependency for this
  content-model remediation.

## Approach

- [x] Define `SceneLearningContent` with required `biologicalFact` and `gameRole` fields. Require it
      on each landmark and obstacle, plus one route-network entry per level.
- [x] Validate both fields at the same authored-data boundary that validates labels, references,
      and
      geometry.
- [x] Author concise, non-clinical content in every level definition, reusing already reviewed
      anatomical claims where applicable.
- [x] Reduce `src/scene_learning.ts` to category selection and deterministic composition of
      authored
      content; remove all label matching and generic fallbacks.
- [x] Replace copy-length assertions with direct contract and validation checks. Exercise all ten
      levels through the existing visible-control campaign browser driver and verify representative
      route plus every scene-object tooltip at each level.
- [x] Run the focused checks, complete fast gate, affected Playwright gates, and documentation
      gates.

## Files to modify

- `src/levels/level_definition.ts`: own and validate the shared learning contract.
- `src/levels/level_01_skin_tissue.ts` through `level_10_metastatic_confluence.ts`: own per-object
  educational content.
- `src/scene_learning.ts`: compose display copy without label inference.
- `src/world_landmarks.tsx`: pass canonical content to hotspots and accessible names.
- `tests/test_level_catalog.mjs`: prove validation and composition behavior.
- `tests/playwright/e2e/campaign.spec.ts` and its helper: prove all-level built-UI exposure.
- `docs/active_plans/reports/aoc_scene_object_tooltips_hci.md` and `docs/CHANGELOG.md`: record
  resolution and evidence.

## Verification

- `npx tsc --noEmit -p tsconfig.json`
- `node --import tsx --test tests/test_level_catalog.mjs`
- `./run_fast_checks.sh`
- `./run_playwright_tests.sh --build tests/playwright/visual_assets.spec.ts`
- `./run_playwright_tests.sh --build tests/playwright/e2e/campaign.spec.ts`
- `source source_me.sh && python3 -m pytest tests/`
- `git diff --check` and `git diff --cached --check`

Final evidence on the completed material tree:

- `./run_fast_checks.sh` -- PASS: production build, both TypeScript projects, ESLint, Prettier,
  47 Node tests, and 951 Python tests.
- `./run_playwright_tests.sh --build tests/playwright/visual_assets.spec.ts` -- PASS: 10 tests in
  1.5 minutes.
- `./run_playwright_tests.sh --build tests/playwright/e2e/campaign.spec.ts` -- PASS: every scene
  object at every level plus the full visible campaign through the Level 10 win in 8.6 minutes.

## Risk register

| Risk                         | Impact | Trigger                              | Owner          | Mitigation                                                                      |
| ---------------------------- | ------ | ------------------------------------ | -------------- | ------------------------------------------------------------------------------- |
| Copy becomes verbose         | Medium | Tooltip cards clip or obscure play   | Implementer    | Keep each field to one concise sentence and reuse current card geometry.        |
| Metadata drifts from objects | High   | Missing or orphaned learning content | Level contract | Store metadata on the object and validate every required field.                 |
| Browser proof becomes slow   | Low    | Duplicated ten-level traversal       | Browser test   | Extend the existing full-campaign journey rather than create another traversal. |

## Implementation notes

- The all-level browser proof exposed a Level 3 placement collision: a generous pericyte learning
  hotspot covered legal open tissue. During treatment placement, the playfield now owns pointer
  input while the learning layer remains keyboard-focusable.
- The same proof exposed an Escape edge case when keyboard focus and pointer hover overlapped.
  Escape now suppresses the hovered tooltip until the pointer leaves the object.
- Final diff review found the legacy category selector also styling the newly separated fact and
  game-role spans. The category now has a dedicated class, leaving educational sentences in normal
  body case; browser coverage asserts that typography contract.
- No route geometry, balance value, or 16:10 layout dimension changed.

## Documentation close-out requirements

- Active plan / progress tracker: mark completed approach steps and retain the plan until the human
  accepts archival.
- `docs/CHANGELOG.md` entry: record the canonical content model and exact test evidence.
- Archive / closure notes: update the existing HCI evidence report from PARTIAL when both design
  findings are resolved.
