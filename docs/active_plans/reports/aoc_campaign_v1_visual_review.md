# AOC campaign V1 wide-layout visual review

## Verdict

**PASS.** The final built-browser matrix resolves the supplied vessel-junction defect and
delivers the requested battlefield-first desktop composition. I inspected all 24 current PNGs
at their native dimensions: Levels 3, 6, 8, and 10 at 680-wide full-page, 1280x800, and
1600x1000 in both normal and reduced-motion modes.

The exact post-run record is `test-results/.last-run.json`, which reports `passed` with no failed
tests. The retained T2 capture matrix and its source assertions support this visual assessment.

## Evidence inspected

| Level                    | Normal and reduced captures             | Native dimensions             |
| ------------------------ | --------------------------------------- | ----------------------------- |
| 3 Capillary Crossroads   | 680-wide full page, 1280x800, 1600x1000 | 680x1455; 1280x800; 1600x1000 |
| 6 Ductal Delta           | 680-wide full page, 1280x800, 1600x1000 | 680x1424; 1280x800; 1600x1000 |
| 8 Fibrotic Sieve         | 680-wide full page, 1280x800, 1600x1000 | 680x1439; 1280x800; 1600x1000 |
| 10 Metastatic Confluence | 680-wide full page, 1280x800, 1600x1000 | 680x1499; 1280x800; 1600x1000 |

The 12 normal captures are in
`test-results/e2e-campaign_visual_matrix-eb6d6-visual-matrix-normal-motion/`; the 12 reduced
captures are in
`test-results/e2e-campaign_visual_matrix-42636-isual-matrix-reduced-motion/`.

The two user-supplied before close-ups were not available at their temporary `/Volumes/Ex2GB`
paths during this final pass. Their observed failure remains well defined from the supplied
images: rounded per-segment ends and local shadows formed target-eye rings, pale wedges, and
patched borders at junctions.

## Criterion findings

| Criterion                        | Result | Observed facts                                                                                                                                                                                                                                                                       | Judgment                                                                                                                                                                                           |
| -------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Continuous vessels               | PASS   | Levels 3, 6, 8, and 10 retain one continuous outer wall, membrane, and solid lumen across splits and merges. There are no rounded endpoint plugs, pale wedges, nested target-eye caps, or repeated local shadow patches.                                                             | The former branch/merge artifact is resolved. The fine dashed circulation marks are intentional flow detail, not discontinuities in the lumen.                                                     |
| Route-paint implementation       | PASS   | `src/world_landmarks.tsx` paints all segments in four global groups: bed, membrane, flow, current. `src/world_visuals.css` assigns the drop shadow to the bed group only, keeps the flow solid, and applies the animated dash only to the thin current.                              | The implementation addresses the cause of the visual seam, rather than covering it locally.                                                                                                        |
| Obstacles versus defects         | PASS   | The purple-gray round scar/pericyte islands have a filled core, a separate dashed halo, and placement-restricting location. They are visible in Level 3's right loop, Level 6's delta, Level 8's sieve, and Level 10's lower field.                                                  | They read as authored biological obstacles, not vessel endpoints. Level 8 is intentionally dense but remains legible as scar-constrained anatomy.                                                  |
| Wide 16:10 desktop shell         | PASS   | The 1280x800 and 1600x1000 captures show the browser-shaped 16:10 game shell with a central 9:5 battlefield. At 1600px, the battlefield occupies most of the shell width; there is no permanent side rail.                                                                           | The battlefield is materially wider than the earlier compact-field design and has the intended visual priority without making the field excessively shallow.                                       |
| Art proportions                  | PASS   | Across all desktop captures, circular source and obstacle forms remain circular, route widths remain consistent, and the generated tissue art has no visible horizontal distortion.                                                                                                  | The wider 9:5 battlefield uses additional space without objectionable stretching of cells, towers, routes, or world art.                                                                           |
| Control placement and legibility | PASS   | Desktop presents seven treatments as a continuous tray immediately below the battlefield, followed by Start Wave, Pause, speed controls, and cells-in-play. At 680px, treatments become two-column cards above wave actions; the Inspector follows. Labels and costs remain legible. | The order supports the player sequence: choose treatment, place in the field, then start the wave. The high-priority Start Wave control remains easy to find without splitting the treatment tray. |
| 680px reflow                     | PASS   | The full-page captures preserve the entire 16:10 playfield, all treatments, wave controls, Inspector, and keyboard help without horizontal crop. The exact full-page heights are 1455, 1424, 1439, and 1499px for Levels 3, 6, 8, and 10.                                            | This is a complete responsive reflow, not an assertion that all controls fit within a 680x425 viewport.                                                                                            |
| Normal/reduced parity            | PASS   | Each normal/reduced pair preserves the same field geometry, art, route walls, obstacle placement, control order, and readability. The T2 source asserts current animation in normal mode and `none` under reduced motion while retaining the solid flow in both modes.               | Motion preference changes circulation motion only; it does not degrade the world or interaction layout.                                                                                            |
| Medical context                  | PASS   | Each entry state combines a level/route summary, tactical briefing, map-microenvironment panel, distinct tumor-source art, blood exit, tissue background, and level-specific obstacle topology.                                                                                      | The fields read as related microscopic environments with explicit biological constraints, not generic tower-defense tracks.                                                                        |

## Verification cross-checks

- `tests/playwright/e2e/campaign_visual_matrix.spec.ts` requires no horizontal overflow, a
  desktop 9:5 battlefield within the viewport, a 16:10 shell, the battlefield's minimum width
  share, treatment-before-wave ordering, four ordered route layers, solid flow, mode-correct
  current animation, unique IDs, and no `.world-landmark-marker` elements.
- `tests/playwright/visual_assets.spec.ts` repeats the paint-layer, landmark-marker, desktop-fit,
  control-order, and reduced-motion checks against the built app.
- `test-results/.last-run.json` records the final browser run as passed.

## Limitations and non-blockers

- This is an entry-state visual matrix, so it does not independently assess the terminal
  containment overlay.
- Static images cannot prove temporal cadence; the normal/reduced conclusion relies on the
  retained browser assertions for animation behavior.
- At desktop widths the briefing and microenvironment prose intentionally ellipsize to protect
  the 16:10 playfield. Core labels, route count, action controls, treatment names, and costs stay
  readable. A future detail-on-demand treatment could expose the full prose, but this is not a
  release blocker.

## Release call

**PASS for V1 wide-layout visual acceptance.** The continuous vessels, widened battlefield,
un-stretched microscopic artwork, sensible action order, responsive 680px view, reduced-motion
parity, and biological world context meet the current release criteria.
