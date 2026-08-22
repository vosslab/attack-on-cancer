## 2026-08-21

### Additions and New Features

- Added three current gameplay captures under `docs/screenshots/`: a paused Wave 1 overview, an
  Antibody Therapy targeting close-up, and the dense Cluster Corridor.
- Added `capture_screenshots.sh` and its Playwright helper for reproducible screenshot refreshes.

### Behavior or Interface Changes

- Added a visual proof section to the README and clarified the local preview behavior.

### Decisions and Failures

- Chose three static views so the route, HUD, targeting range, Antibody mark, and second scene remain
  inspectable without autoplay motion.
- The first sandboxed Chromium launch failed at the macOS Mach-port boundary; the approved browser
  run completed successfully.
- The first automated Cluster Corridor strategies lost before the transition. A deterministic
  simulation pass tuned a capture-only tower layout that then cleared the real browser flow.
- The existing Playwright suite still contains two stale economy expectations: Standard 500 TP and
  560 TP after placing a Doctor. The current game correctly renders Standard 380 TP and 410 TP after
  that Practice placement.

### Developer Tests and Notes

- `./capture_screenshots.sh` rebuilt the Pages artifact and refreshed all three captures successfully.
- `./check_codebase.sh` passed all five checks, including eight Node tests.
- `source source_me.sh && python3 -m pytest tests/` passed all 639 tests against the complete
  three-screenshot tree.
- `./run_playwright_tests.sh --build --timeout=10000` passed the browser smoke test and exposed the
  two stale value assertions above.
- The local preview and live GitHub Pages URL both served the expected game entry page.

## 2026-08-19

### Additions and New Features

- Documented the Attack on Cancer v1 game experience, controls, roster, and SolidJS model.
- Added the v1 game design reference with fixed difficulty, wave, treatment, and enemy boundaries.
- Tuned the playfield for 16:10 landscape framing and added optional circulation and cell motion.
- Added gesture-activated, bounded Web Audio cues for placement, waves, treatments, and outcomes.
- Reworked treatment effects into distinct syringe, burst, immune-strike, beam, and antibody-chain visuals.
- Made cancer cells inspectable and corrected 16:10 placement, combat-audio, and range ownership issues.
- Tightened Challenge to 260 starting TP and 7 allowed metastases for a sharper resource constraint.
- Added a persisted 4x simulation speed control for fast wave cleanup.
- Increased Challenge wave groups by 40 percent while retaining their fixed enemy composition.
- Added a beating Wave 15 Tumor Mass that sheds Basic cells as it travels and ruptures into fragments.
- Strengthened Tumor Mass motion with rhythmic pulse, rotating vascular rings, shifting nodules, and shed cues.
- Simplified Tumor Mass motion to one readable double heartbeat and an event-only shed cue.
- Added the confirmed GitHub Pages play link to the README landing page.
- Added the Cluster Corridor second scene: a multi-tumor source, longer winding route, clean
  rebuild field, 200 TP grant, and six high-density waves after Skin Tissue wave 15.
- Tightened the economy: lower opening TP, smaller cell rewards, 55% sale refunds, and a 200 TP
  Cluster Corridor field grant make each treatment purchase matter.
- Enabled sound by default for new players while retaining gesture-activated browser audio.
- Refreshed the README landing page with a newcomer quick start, project promise, and documentation map.

### Decisions and Failures

- Kept v1 focused on one Skin Tissue level, five treatments, five enemy types, and 15 manual waves.
- Kept biology optional and non-clinical; the game does not model patient outcomes or treatment decisions.
