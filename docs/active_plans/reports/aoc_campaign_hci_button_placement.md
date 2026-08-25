# AOC campaign HCI review: 16:10 battlefield and action placement

## Decision and evidence scope

**Recommendation: restore a battlefield-first desktop composition.** Keep the
browser-sized game shell at 16:10, make the playable map the full-width main
surface, and put a compact horizontal action strip directly below it. Do not
use the current desktop side rail.

This is an expert cognitive walkthrough plus heuristic inspection for a visual
biology learner planning treatments at a desktop browser. It is grounded in
the current Solid markup, keyboard handler, CSS, and browser-test intent; it
is **not** a participant study. A short representative usability session is
still the right next evidence if the team needs to compare this arrangement
with a side rail.

The present desktop rule makes `.game-shell` 16:10, but gives it a second,
22vw side column and caps `.battle-area` at `62svh * 1.6`. The map therefore
keeps its own 16:10 ratio while losing the page's visual priority. The seven
treatment choices stack vertically in that rail, separating selection from
the map action it enables. This conflicts with the requested full-width
battlefield experience.

## Proposed desktop interaction order

1. Keep a short top status/context band: title, TP, metastases, level, wave,
   and a compact map briefing.
2. Put the exact-16:10 battlefield in the only full-width main row. It scales
   from the remaining viewport height, rather than imposing a fixed `62svh`
   cap. Center it when the height budget makes it narrower than the shell.
3. Put one compact, full-width bottom action strip immediately after the map,
   always in this order: treatment tray; `Start Wave`; `Pause`/`Resume`;
   speed controls; cells-in-play status. Keep the red Start Wave action
   visually primary, but grouped with the run controls that affect the same
   wave.
4. Show the selected tower inspector after that strip, as a full-width compact
   row. Its Upgrade and Sell controls must stay adjacent to its selected-tower
   identity. It should not reclaim a permanent side rail when no tower is
   selected.

This preserves a meaningful distinction between the **planning action**
(select treatment, then place it on the nearby map), the **commit action**
(start the next wave), and the **object action** (inspect, upgrade, or sell an
already placed treatment).

At 1280 x 800, a literal 1280 x 800 map plus header and controls cannot fit
without overlap or scrolling. "Full width" should therefore mean full width
of the game's main composition, with map width derived from the *remaining*
height while retaining its exact 16:10 ratio--not a width declaration that
forces chrome off screen. The same rule applies at 1600 x 1000.

## Cognitive walkthrough

Scenario: a learner starts Level 3, understands the current medical map and
TP, buys an affordable treatment, places it beside a route, runs and controls
a wave, selects a tower, upgrades or sells it, and continues after containment.

| Goal | Visible cue and expected action | Likely error and recovery | Completion proof |
| --- | --- | --- | --- |
| Orient to this level | The fixed top band shows TP, metastases, Level *n* of 10, wave, title, route count, briefing, and map-microenvironment note. Read it before choosing a treatment. | Dense status copy competes with the map. Keep it to one shallow band; the descriptive map copy remains available to assistive technology. | Learner can name the level, current wave, and available TP without moving away from the map. |
| Choose an affordable treatment | A left-to-right, consistently ordered tray shows treatment name, number shortcut, TP cost, and short role cue. Click or use keys 1-7. | A learner may choose an unaffordable item or not notice what is selected. Preserve the selected button state and add a clear selected-treatment/placement instruction adjacent to the tray. | Selected control is visibly and programmatically current; the placement ghost appears on the map. |
| Place beside a route | The selected ghost and its validity state follow pointer or keyboard cursor over the adjacent full-width map; click/tap or use arrows then Enter. | Clicking a route or blocked biological structure fails silently or the learner loses the selected mode. Keep a visible invalid state and a concise placement cue; Esc cancels. | A tower appears, TP changes, and the selected tower inspector identifies it. |
| Start and manage the wave | The single primary `Start Wave n` button follows the tray, with Pause/Resume and 1x/2x/4x immediately beside it; `n` and Space remain shortcuts. | A learner may start before planning or confuse speed with start. Start remains visibly primary and disabled only when inappropriate; run-state feedback uses its existing label and cells-in-play status. | Wave count/pending cells change and Pause/Resume reflects the actual state. |
| Inspect, upgrade, or sell | Clicking a tower selects it; the inspector immediately after the action strip names treatment and tier, then offers Upgrade and Sell. | Selling can be mistaken for upgrade or inspector can be visually distant from the selected object. Use a distinct destructive treatment for Sell, retain its TP return in the label, and keep inspector order stable. | Tier/TP changes after Upgrade, or tower disappears and TP returns after Sell. |
| Continue after containment | The centered containment overlay gives one next action: `Continue to Level n+1`; its briefing names the next map. | An overlay can obscure the result or offer competing navigation. Keep one continuation control and return focus to the level's normal primary action after it closes. | Level title, briefing, map, and wave state update to the next level. |

## Heuristic and accessibility ledger

| Finding | Rationale | Implementation acceptance criterion | Evidence to collect |
| --- | --- | --- | --- |
| **High: current side rail weakens action-map proximity.** | Selection is a planning action whose result is placed on the map; vertical stacking also makes the battlefield visually secondary. | Desktop uses no permanent right control rail. Tray, wave controls, and conditional inspector form compact full-width rows beneath the map. | 1280 x 800 and 1600 x 1000 screenshots plus bounding-box assertion: action strip begins below map and spans its main width. |
| **High: page and map need one viewport budget.** | A 16:10 map must be sized from available height; otherwise it either shrinks unnecessarily (current cap) or forces scrolling. | At desktop 16:10 viewports, the game shell fills the viewport, document has no vertical scroll, and map measured width / height equals 1.6 within rendering tolerance. All essential action controls are visible without scrolling. | Playwright checks `scrollHeight <= innerHeight + 1`, computed map ratio, and control bounding boxes at 1280 x 800 and 1600 x 1000. |
| **Medium: selection requires recognition, not memory.** | Consistent control placement supports expectations; cognitive guidance notes that users can miss controls moved from expected locations. | Tray order never changes; selected state exposes text/ARIA state and a nearby "place on map" cue. Invalid versus legal ghost state is distinguishable without color alone. | Keyboard and pointer walkthrough; accessibility-tree assertion for selected treatment; normal/reduced-motion screenshots. |
| **Medium: wave actions need semantic grouping.** | Start, pause, and speed change the same running process but have different risk and frequency. | `Start Wave` is the only primary action, immediately followed by Pause/Resume and speed; cells-in-play is status, not an action. | Visual grouping review and a test that wave, pause, and speed buttons are simultaneously visible/reachable. |
| **Medium: object actions need local, reversible feedback.** | Upgrade/Sell applies to a selected tower, not to the global wave. | Inspector appears only with a selected tower, follows the action strip, has an explicit selected-tower heading, and puts Sell after Upgrade with distinct styling and TP-return text. | Pointer/keyboard selection walkthrough and screenshots before/after upgrade/sell. |
| **Medium: keyboard support exists but needs discoverability and focus protection.** | Current keys 1-7, arrows, Enter, Esc, Space, and N support the core loop, and `:focus-visible` is present. A document-wide handler may also act while a native button is focused. | Footer/help exposes the shortcuts; keyboard focus order follows visual order; Enter/Space on a focused button must activate only that button, not additionally place/pause. Esc cancels placement. Every control has a visible focus indicator. | Tab traversal and key-action Playwright tests, including focused Start Wave, treatment, Upgrade, and Sell controls. |
| **Medium: responsive behavior must change layout, not hide capability.** | A seven-item tray cannot stay horizontal at narrow widths without unusable targets. | Below the desktop breakpoint, preserve the existing multi-row/mobile tray and vertical document flow; the map remains 16:10 and every action remains reachable. | 320 px and 680 px browser checks for visible labels, reachable controls, and no clipped map/overlay. |

The recognition and consistent-placement rationale is supported by the local
`Designing with the Mind in Mind` guidance: users act from familiar visual
frames and can miss a control moved from its expected location. Current
conformance should additionally be checked against WCAG keyboard operation,
focus-visible behavior, contrast, names/roles/states, and reflow criteria.

## Handoff and runnable acceptance checks

Hand this task model to the UI/CSS implementation owner. The implementation
should change layout and presentation only; it must retain the current visible
controls, pointer/touch map placement, and keyboard vocabulary.

- At 1280 x 800 and 1600 x 1000 in landscape, no vertical page scroll occurs;
  the shell uses the viewport and the playfield's rendered ratio is 16:10.
- The battlefield has no desktop side rail and is visually wider than the
  current one-column map; its size responds to the remaining height budget.
- Treatment tray, Start Wave, Pause/Resume, all three speed choices, and
  cells-in-play are visible and operable below the map without scrolling.
- Selecting a treatment gives an explicit selected state and map placement
  cue; legal and blocked placement states remain distinguishable with reduced
  motion and without relying on color alone.
- Selecting a tower reveals an inspector after the action strip with visible,
  labeled Upgrade and Sell actions; it does not displace the map into a side
  column.
- At mobile widths (at least 320 px and 680 px), the map retains 16:10,
  controls reflow without clipping, and the action order remains coherent.
- Browser tests cover pointer placement, keyboard selection/cancel/placement,
  wave control, tower upgrade/sell, and Level-containment continuation using
  the real built UI. Run an automated accessibility scan plus manual keyboard
  and focus-order walkthrough before acceptance.

## Limitation

This review establishes an implementation direction and testable inspection
criteria, not evidence that representative learners prefer it. After the
layout lands, observe a small sample of the intended visual-biology learners
perform the scenario above; record completion, placement errors, time to
first wave, confidence locating controls, and comments about map prominence.
