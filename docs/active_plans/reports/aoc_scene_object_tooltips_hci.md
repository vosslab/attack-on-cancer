# Scene Object Learning Tooltips: HCI Evidence

Status: PASS after remediation and independent-audit follow-up on 2026-08-25

## Decision and Scope

The battlefield now supports optional, in-place learning while preserving the primary tower-defense task. The intended users are biology students and other first-time players using pointer, touch, or keyboard input. The interaction uses a cognitive-walkthrough model: discover a meaningful structure, identify it, connect it to biology and the game model, then resume treatment placement without opening a modal or leaving the battlefield.

The generated tissue art remains decorative. The interactive layer exposes one route network plus the canonical, named landmarks and obstacles. A landmark linked to an obstacle receives one hotspot, preventing duplicate Tab stops over the same visual object.

## Baseline

Before this change, the scene renderer marked routes, obstacles, and landmarks as `aria-hidden` and `pointer-events: none`. The microenvironment card named up to three sites, but a learner could not associate those names with their positions in the scene. There was no visible hover, touch, or keyboard-focus state for world objects.

## Task Model

| Step       | Learner need                                         | Expected action                                         | Completion evidence                                                            |
| ---------- | ---------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Discover   | Know that the scene can be explored                  | Read the compact exploration hint                       | Hint is visible inside the battlefield at narrow and desktop sizes             |
| Identify   | Connect an object to its name                        | Point to, tap, or Tab to a route, landmark, or obstacle | Named tooltip appears beside the object                                        |
| Understand | Learn one biological fact and the object's game role | Read the category, title, and short explanation         | Tooltip and accessible name provide the same core explanation                  |
| Continue   | Return to treatment placement                        | Press Escape or select open tissue                      | Tooltip dismisses; the selected treatment remains selected and places normally |

## Guideline Ledger

| User need               | Guideline                                                                | Acceptance criterion                                                                                         | Evidence                                                 | Status |
| ----------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- | ------ |
| Recognition over recall | Put the explanation next to the pictured structure                       | Tooltip is anchored to the focused object and does not open a separate panel                                 | Built-browser pointer and focus checks                   | PASS   |
| Input parity            | Pointer-only teaching would exclude keyboard and touch users             | Hover, pointer focus, Tab focus, and Escape dismissal work; every hotspot has a non-empty accessible name    | All-level Playwright role/name and focus assertions      | PASS   |
| Gameplay safety         | Exploration must not place a treatment or trigger global shortcuts       | Enter on an object places no tower; placement-mode pointer input reaches the map; Escape preserves treatment | Built-browser campaign and isolation assertions          | PASS   |
| Minimal focus order     | Repeated cells and vessel segments should not become dozens of Tab stops | One route-network stop plus deduplicated canonical landmark and obstacle stops                               | DOM structure and browser Tab-order assertion            | PASS   |
| Readability             | Tooltip text and focus boundaries must remain distinguishable            | Body copy keeps normal case and passes 4.5:1; border and two-tone focus pair pass 3:1                        | Computed-style browser and source-color checks           | PASS   |
| Motion safety           | Tooltip content must remain usable with reduced motion                   | Tooltip visibility is immediate; ambient world motion remains covered by the existing reduced-motion rules   | CSS inspection and existing reduced-motion browser check | PASS   |
| Responsive use          | Learning content must remain inside the field and readable               | Manual rendered inspection at 680x900 and 1280x800                                                           | Built-output screenshots                                 | PASS   |

## Biological Copy Boundary

The tooltip text explains a simplified game model rather than a patient or treatment
recommendation. Short anatomical claims were checked against authoritative sources:

- The National Cancer Institute defines metastasis as cancer cells spreading from their original
  site to another part of the body in its [Dictionary of Cancer Terms](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/metastasis).
- NCBI Bookshelf describes the endothelial-cell lining and branching organization of
  [blood vessels](https://www.ncbi.nlm.nih.gov/books/NBK26848/).
- NCBI Bookshelf describes lymph-node follicles, cortex, afferent vessels, and outgoing lymphatic
  flow in [Anatomy, Lymph Nodes](https://www.ncbi.nlm.nih.gov/books/NBK557717/).
- NCBI Bookshelf describes the extracellular matrix as a tissue network of proteins and
  polysaccharides in [The Extracellular Matrix of Animals](https://www.ncbi.nlm.nih.gov/books/NBK26810/).
- The National Cancer Institute describes breast lobules and the ducts that carry their fluid in
  [What Is Breast Cancer?](https://www.cancer.gov/types/breast/what-is-breast-cancer).
- A peer-reviewed anatomy review describes bone marrow as a primary site of blood-cell formation
  and its relationship to trabecular bone in
  [Anatomy and Physiology of the Bone Marrow](https://pmc.ncbi.nlm.nih.gov/articles/PMC7158316/).
- The National Heart, Lung, and Blood Institute defines alveoli and gas exchange in
  [Lung Health Basics](https://www.nhlbi.nih.gov/sites/default/files/publications/lung_health_basics_fact_sheet.pdf).
- NCBI Bookshelf describes pericyte contact with capillaries and vascular roles in
  [Inflammation and the Microcirculation](https://www.ncbi.nlm.nih.gov/books/NBK53381/).

## Validation

- `npx tsc --noEmit -p tsconfig.json` and the lint TypeScript project -- PASS.
- `node --import tsx --test tests/test_level_catalog.mjs` -- PASS: 15 tests, including required
  metadata validation and exact canonical copy for all ten levels.
- Focused ESLint over the changed TypeScript and browser tests -- PASS.
- `./run_playwright_tests.sh --build tests/playwright/visual_assets.spec.ts --grep 'scene learning supports'`
  -- PASS: pointer, keyboard, Escape, and immediate return to placement.
- `./run_playwright_tests.sh --build tests/playwright/e2e/campaign.spec.ts` -- PASS: every tooltip
  at every level remained bounded, exposed separate fact and role content, dismissed with Escape,
  and coexisted with visible placement through the Level 10 win in 8.6 minutes.
- `./run_playwright_tests.sh --build tests/playwright/visual_assets.spec.ts` -- PASS: all 10
  affected visual, responsive, motion, generated-asset, and live-transition tests in 1.5 minutes.
- `./run_fast_checks.sh` -- PASS: production build, both TypeScript projects, ESLint, Prettier,
  47 Node tests, and 951 Python tests.
- Contrast measurements:
  - Tooltip primary text `#fffaf2` on `#102f4f`: 13.11:1.
  - Tooltip body text `#edf8f4` on `#102f4f`: 12.54:1.
  - Tooltip category `#aee9d0` on `#102f4f`: 9.97:1.
  - Exploration hint `#315d70` on `#fffaf0`: 6.89:1.
  - Tooltip border `#c4ecd9` on `#102f4f`: 10.60:1.
  - Two-tone focus pair `#fff8d8` and `#173858`: 11.29:1.

## Evidence Limit

This is an expert cognitive walkthrough with automated role, name, focus, and gameplay-isolation checks plus rendered inspection. It does not include a participant usability study, a VoiceOver session, or a full axe-core audit.

## Independent Audit Follow-up

Six fresh reviewers independently covered plan alignment, tests, implementation style,
documentation, legacy code, and comments/control flow. The test, legacy, and comment passes found
no concrete defect; the style and documentation passes found low-risk cleanup that was completed.

Both design-level findings are resolved prospectively:

- The user's explicit follow-up authorized a forward remediation plan at
  `docs/active_plans/active/aoc_scene_learning_metadata_remediation.md`. The record does not claim
  retrospective approval for the original implementation.
- `SceneLearningContent` is required on every exposed route network, landmark, and obstacle.
  Campaign validation rejects a missing fact or game role, and `src/scene_learning.ts` now composes
  authored fields without inspecting display labels or supplying generic fallbacks. The formerly
  generic `Central tissue bend` and `Central tumor cluster` now have object-specific biological
  facts.

The expanded browser journey found and resolved two additional interaction issues. Learning
hotspots now yield pointer ownership to active treatment placement, and Escape dismisses a focused
tooltip even when hover remains over the same object. Final diff review also narrowed the category
CSS selector so fact and game-role sentences retain normal body typography. The public README and
game-design reference document discovery, dismissal, and return to placement.
