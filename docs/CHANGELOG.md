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
- Enabled sound by default for new players while retaining gesture-activated browser audio.
- Refreshed the README landing page with a newcomer quick start, project promise, and documentation map.

### Decisions and Failures

- Kept v1 focused on one Skin Tissue level, five treatments, five enemy types, and 15 manual waves.
- Kept biology optional and non-clinical; the game does not model patient outcomes or treatment decisions.
