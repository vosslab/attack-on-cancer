# Treatment Ascension: per-treatment upgrade paths, signature abilities, and arcade upgrade juice

## Context

Upgrading a treatment is currently the least exciting action in the game. Every
one of the seven treatments shares the same three upgrades (`UPGRADES` in
[config.ts](../../src/config.ts) lines 116-141):
Calibrated / Focused / Breakthrough, identical numbers, identical copy. Buying one
changes a damage multiplier, swaps a small badge glyph, and nothing else happens on
screen. The inspector shows a flat four-cell `tier-ladder` and a text button
(`src/app.tsx:616-661`). There is no upgrade moment, no preview of what the money
buys, and no reason to prefer upgrading a Radiation Bot over a Doctor.

The art scaffolding is already better than the game's use of it: each
`assets/visuals/tower_*.svg` sheet ships four authored tier panels with
`tower-tier-light` pips and `-elite` part variants, and `combat_visuals.css:9-13`
defines a `--tier-accent` per tier. The campaign level catalog already proves the
pattern this work should follow: every exposed object owns a required biological
fact plus a simplified game role, validated at build time.

Goal: make each treatment's upgrade path its own identity, ending in a tier-4
signature ability that changes behavior rather than a number, and make the moment
of purchase read as the loudest positive event in the game.

Tone: [FUN_VIBES_DESIGN_STYLE.md](../FUN_VIBES_DESIGN_STYLE.md)
leads (saturated accents, milestone banners, confetti reserved for real
milestones, no shaming copy, no confirm friction on reversible actions), with
[PLAYFUL_TRAINING_GAME_STYLE.md](../PLAYFUL_TRAINING_GAME_STYLE.md)
supplying the wrong-answer-style teaching contract: every upgrade card states what
it does in the game AND the biology it points at. The load-bearing rule from both
docs is pinned into every reviewer prompt for this work.

## The ambition, stated plainly

A player who reaches tier 4 on a Radiation Bot should be able to say, without
reading a manual: "that beam punches through two cells now, because radiation gets
fractionated across a depth of tissue." That is the bar. Ten levels of campaign
already exist; this work gives the player something to *build toward* inside a
single level.

## Design: seven upgrade paths, seven signatures

Replace the single global `UPGRADES` list with `UPGRADE_PATHS: Record<TowerId,
readonly [UpgradeConfig, UpgradeConfig, SignatureUpgradeConfig]>`.

Every entry carries `name`, `cost`, `damageMultiplier`, `rangeBonus`,
`cooldownMultiplier`, `description`, plus two new REQUIRED fields matching the
level-catalog learning contract: `biologicalFact` and `gameRole`. Catalog
validation rejects an empty or missing field, exactly as the scene-learning
metadata does today.

Costs scale off each treatment's own cost: `round(cost * 0.7)`, `round(cost *
1.25)`, `round(cost * 2.1)`. A Doctor path totals 63 / 113 / 189 TP (close to
today's 65 / 115 / 190, so early balance barely moves); a Radiation path totals
168 / 300 / 504, which makes the elite Rad Bot a real economic commitment.

| Treatment | Tier 2 | Tier 3 | Tier 4 signature | Signature behavior |
| --- | --- | --- | --- | --- |
| Doctor | Calibrated Dose | Combination Protocol | DOUBLE TAP | Every third shot fires a second dose at a different in-range cell |
| Chemotherapy | Wider Infusion | Dose-Dense Cycle | LINGERING CLOUD | Splash leaves a 1.6 s field that damages cells entering it |
| Cytotoxic T Cell | Priming Boost | Memory Clone | CLONAL SURGE | Consecutive hits on the same cell ramp damage +12% per hit, capped +60%, reset on target change |
| Radiation Bot | Tighter Collimation | Fractionation | PIERCING BEAM | Beam continues to one further cell on the same route at 60% damage |
| Antibody Therapy | Higher Affinity | Longer Half-Life | BISPECIFIC LINK | A new mark also marks one nearby unmarked cell |
| CAR Macrophage | Bigger Gulp | Chemotaxis Boost | TROGOCYTOSIS | A kill refunds 15% of that cell's reward and clears the cooldown |
| CRISPR Editor | Better Guide RNA | Proofreading | BASE EDITOR | Repair guarantee drops from 7 to 4 mismatches; Tumor Mass edit damage x1.5 |

Each signature is a bounded branch with one clear rule, one owner in the
simulation, and one unit test. None of them touch pathing or wave scheduling.

## File-size constraint (read before writing code)

`docs/REPO_STYLE.md` caps tracked source files at 999 lines. Three target files
are already close, so this work lands in NEW modules rather than growing existing
ones:

| Existing file | Lines now | New home for this work |
| --- | --- | --- |
| `src/simulation.ts` | 873 | `src/tower_signatures.ts` (signature resolution, pure functions) |
| `src/config.ts` | 193 | `src/upgrade_paths.ts` (the seven paths + validation) |
| `src/app.tsx` | 711 | `src/tower_inspector.tsx` (the upgrade panel component) |
| `src/combat_visuals.css` | 987 | `src/upgrade_visuals.css` (tier accents, aura, burst, banner) |

Adding a fourth stylesheet requires three coordinated edits:
`src/index.html:9-12`, the required-file list and copy/verify blocks in
`build_github_pages.sh:47-105`. Missing any one of them ships a stylesheet the
built site never loads.

## Workstreams

Dispatch W1 first; it owns the contract every other stream imports. W2, W3, and W4
then run in parallel. W5 needs W1's shape and W4's tokens. W6 closes.

### W1 - Upgrade contract (owner: coder; blocking)

- Own `src/game_types.ts`, new `src/upgrade_paths.ts`, `src/config.ts`,
  `src/simulation.ts` call sites.
- Extend `UpgradeConfig` with required `biologicalFact` and `gameRole`; add
  `SignatureUpgradeConfig extends UpgradeConfig` with a required
  `signature: SignatureId` and `signatureName`.
- Author all seven paths per the table above. Export a `validateUpgradePaths()`
  that throws on a missing fact, role, non-positive cost, or wrong path length,
  and call it from module scope the way the level catalog validates itself.
- Rewrite `getSellValue`, `getUpgradeCost`, `getUpgradeMultiplier`, and
  `getTowerRange` in `src/simulation.ts:287-475` to read the per-type path.
  Keep every existing exported signature intact.
- Success: `npx tsc --noEmit` clean; existing Playwright upgrade test at
  `tests/playwright/tower_interaction.spec.ts:103` still passes untouched.

### W2 - Signature abilities (owner: expert_coder)

- Own new `src/tower_signatures.ts` plus the four call sites in
  `src/simulation.ts` (attack resolution, damage calc, kill reward, repair chance).
- Add runtime fields to `Tower` in `src/game_types.ts`: `signatureCharge?: number`
  (Doctor shot counter, T Cell stack count), `signatureTargetId?: number`.
  Add `lingeringFields: LingeringField[]` to `GameState` for Chemotherapy.
- Implement each signature as a named pure function taking explicit state and
  returning explicit results. No hidden mutation, no `try/catch`, no silent
  defaults (`docs/PYTHON_STYLE.md` design rules apply to TypeScript here too).
- Success: new `tests/test_tower_signatures.mjs` covers all seven with fixed
  inputs and deterministic seeds - piercing hits exactly two cells, clonal stack
  caps at +60%, trogocytosis refund is 15% of reward, base editor guarantee fires
  on the 4th mismatch. Behavioral assertions only, no hardcoded tuning constants
  (`docs/PYTEST_STYLE.md` brittle-test rules).

### W3 - Tier art push (owner: coder + svg-creator-expert route)

- Own all seven `assets/visuals/tower_*.svg` sheets, one new
  `assets/visuals/effect_upgrade_burst.svg`, and the catalog in
  `generate_visual_assets.py:29-69`.
- Push tiers 2-4 for real silhouette change, not more pips: larger emitters, added
  hardware, elite plating, a signature emblem on tier-4 panels. Construct from
  primitives first, keep the existing `data-aoc-part` group names so the CSS hooks
  in `combat_visuals.css` keep binding.
- New burst sheet: `data-aoc-kind="effect"`, `data-aoc-key="upgrade_burst"`,
  panels `tier-1`, `tier-2`, `tier-3` so the burst inherits the destination tier's
  accent. Register it in `EXPECTED_CATALOG["effect"]`.
- Stay inside the generator's allowlists (`ALLOWED_ELEMENTS` line 89,
  `ALLOWED_ATTRIBUTES` line 114); no scripting attributes, no external refs.
- Success: `source source_me.sh && python3 generate_visual_assets.py` regenerates
  cleanly; `pytest tests/test_generate_visual_assets.py` passes with the catalog
  addition; rendered PNG proof of all four tiers per treatment at playfield size
  (~72 px) and at catalog size, attached to the workstream report.

### W4 - Upgrade juice CSS (owner: coder + css-creative-expert route)

- Own new `src/upgrade_visuals.css`, edits to `src/combat_visuals.css:9-13` and
  `src/combat_motion.css`, plus the three build wiring edits listed above.
- Extend the tier accent scale so tier 3 reads as signature-grade, add a
  persistent `.tower[data-signature]` aura ring (slow rotation, GPU-cheap
  transform only), redesign `.tower-tier-badge` so tier is readable at a glance on
  a crowded map, and author the upgrade burst keyframes (expanding accent ring +
  rising motes, ~0.6 s).
- Every new animation gets a `prefers-reduced-motion: reduce` fallback in the
  existing block at `src/combat_motion.css:390`, resolving to a static flash.
- Success: screenshots of tier 1-4 towers and the burst mid-frame, in normal and
  reduced-motion, at the narrowest supported width and desktop; no horizontal
  overflow introduced; computed-style check that the aura is present only at
  tier 3.

### W5 - Upgrade panel and milestone moment (owner: coder + ui-ux-engineer review)

- Own new `src/tower_inspector.tsx`, the `Show when={selectedTower()}` block in
  `src/app.tsx:616-661`, and the `.tier-ladder` / `.tower-card` rules in
  `src/style.css:355-392`.
- Rebuild the panel as an upgrade card: the named next upgrade, its cost, a
  stat-delta preview (`damage 13 -> 16.6`, `range 118 -> 128`, `fire rate +6%`)
  read from the same simulation getters the game uses, its one-line game role, and
  its biology line. Numbers count up after purchase.
- Tier 2 and 3 buy on a single click - momentum is the product, no confirm on a
  routine spend. The tier-4 signature purchase opens an arcade confirm modal
  (big Yes/No, Escape and overlay-tap cancel) because it is the milestone.
- On a signature unlock, fire a milestone banner naming the signature, the
  playfield burst on that tower, and confetti. Confetti fires here only.
- Keyboard parity throughout: the panel is reachable and operable without a
  pointer, matching the existing tower focus behavior in `src/tower_actor.tsx:49-63`.
- Success: `tests/playwright/tower_interaction.spec.ts` extended - upgrading to
  tier 4 shows the confirm modal, cancelling spends nothing, confirming shows the
  banner and sets `data-signature` on the tower; delta preview matches the values
  the tower actually has after purchase.

### W6 - Sound, catalog, tests, docs (owner: tester + maintainer)

- Add `"upgrade"` and `"signature"` kinds to `playUiSound` in `src/audio.ts:73`
  (rising triad for upgrade, longer fanfare for signature). Sound stays off by
  default per both style docs.
- Extend `src/visual_catalog.tsx` to exercise the new burst sheet and the pushed
  tier art, so the generated catalog keeps covering every authored asset.
- Extend `tests/playwright/visual_assets.spec.ts:138` to assert the burst element
  appears on upgrade and that tier-4 art differs from tier-3 art.
- Update `docs/CHANGELOG.md` under today's date with entries in the required
  section order, and record the balance reasoning in
  `docs/active_plans/reports/aoc_upgrade_ascension_balance.md`.
- Copy this plan to `docs/active_plans/active/aoc_upgrade_ascension_plan.md` at
  the start of implementation so the repo owns the artifact.

## Balance guardrails

- Tier-2 and tier-3 numbers stay within 10% of today's global values for the
  Doctor, so early-level pacing is unchanged and existing level tuning holds.
- Signatures are strong but single-rule; none of them stack multiplicatively with
  another signature.
- Total path cost for a treatment stays above 3x its placement cost, keeping
  "place another tower" a live alternative to "max this one out".
- Re-run the campaign on Standard through Level 5 after W2 lands and record
  whether any level now trivializes; that record goes in the balance report.

## Verification

Run in this order. Every command is a real front door; none of them need
`package.json` opened.

```bash
source source_me.sh && python3 generate_visual_assets.py
pytest tests/
./check_codebase.sh
./run_playwright_tests.sh
./run_web_server.sh
```

Manual acceptance pass, played not just built:

1. Place a Doctor, upgrade to tier 2 - burst fires, deltas count up, no confirm.
2. Upgrade to tier 4 - confirm modal appears, cancel spends 0 TP, confirm shows
   the DOUBLE TAP banner and the persistent aura.
3. Watch the tier-4 Doctor fire: every third shot visibly hits a second cell.
4. Repeat for Radiation (pierce) and Macrophage (refund) as the two most visible
   signatures.
5. Toggle OS reduced motion and re-run step 2 - the burst resolves to a static
   flash, the banner still reads.
6. Narrow the window to the smallest supported width - the upgrade card stays
   readable and the buy button reachable without scrolling.

## Success criteria

- Each treatment shows three uniquely named upgrades with its own costs, biology
  line, and game role; validation refuses an incomplete path at build time.
- All seven signatures are observable in play and covered by deterministic tests.
- Tier 4 art is distinguishable from tier 3 at playfield size in a screenshot.
- The upgrade moment produces a burst, a sound, and counted-up deltas; the
  signature moment additionally produces a banner and confetti.
- Reduced motion, keyboard, and the narrowest viewport all stay whole.
- `./check_codebase.sh`, `pytest tests/`, and `./run_playwright_tests.sh` pass; no
  tracked source file reaches 1000 lines.

## Reviewer prompt clause (paste into every review task for this work)

> Only flag saturated color, big shapes, playful motion, or loud contrast as a
> problem if it causes a specific usability failure: unreadable text, hidden
> content, broken layout, unclear feedback state, keyboard or accessibility
> failure, or visual ambiguity - or a specific pedagogical regression, where the
> player cannot tell what the upgrade did or the biology line is vague or wrong.
