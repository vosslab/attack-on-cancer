# Attack on Cancer game design

## Purpose and tone

Attack on Cancer is a ten-level, cartoon microscopic tower-defense campaign.
It uses stylized tissue, vessels, lymph structures, air spaces, ducts, scar
tissue, and marrow as an original game world. Biology supports visual
orientation and placement puzzles; it is not a quiz, medical simulator, or
statement about patient care.

The desktop game is composed as one 16:10 browser view. Its 16:10 playfield is
the primary full-width surface; the status and map-context band stays compact
above it, and the treatment and wave actions stay in a compact full-width
strip below it. Small screens reflow the same controls without hiding them.

## Campaign loop

1. Read the level title, briefing, route count, and optional map-microenvironment
   context.
2. Choose a treatment and place it on open tissue beside one or more routes.
3. Start the current wave and manage pause or speed when useful.
4. Select a placed treatment to inspect, upgrade, or sell it.
5. Clear the map, then continue to the next level with a fresh build field.

The campaign is linear: Level 1 through Level 10. It deliberately has no
player-facing level select or replay screen. Each level ends in an
intermission; continuing clears all placed treatments and active cells, keeps
metastases, and sets TP to the next level's configured capped carryover plus
reinforcement. Clearing Level 10 wins the campaign.

Every escaping cell adds one metastasis point, including a Basic cell released
by a destroyed Dividing cell. The run ends immediately at the difficulty's
metastasis capacity.

## Campaign maps

The typed campaign catalog is the source of truth for routes, waves, landmarks,
placement obstacles and probes, economy, player-facing copy, accessible map
descriptions, and scene-learning content. Every exposed route network,
landmark, and obstacle owns a required biological fact and simplified game
role. A route is assembled from shared named segments. Therefore a trunk,
split, or merge is one geometry source for rendering, movement, placement
clearance, range, and splash effects.

| Level | Map                   | Routes | Placement lesson                       |
| ----: | --------------------- | -----: | -------------------------------------- |
|     1 | Skin Tissue           |      1 | Open-tissue baseline                   |
|     2 | Cluster Corridor      |      1 | Rebuild and staged coverage            |
|     3 | Capillary Crossroads  |      2 | Shared crossings                       |
|     4 | Lymph Node Loop       |      2 | Central repeated exposure              |
|     5 | Alveolar Switchbacks  |      2 | Parallel coverage and late bends       |
|     6 | Ductal Delta          |      3 | Independent early sources              |
|     7 | Vascular Bypass       |      2 | Short fast bypass versus armored route |
|     8 | Fibrotic Sieve        |      4 | Constrained legal pockets              |
|     9 | Marrow Lattice        |      3 | Recurring exposure zones               |
|    10 | Metastatic Confluence |      4 | Timed convergence from four sources    |

Each wave has an authored route cycle, so branch distribution is deterministic
and inspectable. "Front-most" targeting means least remaining route distance
to an exit, with stable IDs breaking ties. Route identity controls an enemy's
movement and inherited descendants; attacks remain physical: range and splash
can affect cells on different routes when they are close together on the map.

## Difficulty

Practice and Standard change only starting TP and metastasis capacity.
Challenge sends 40% more cells in each fixed wave group while retaining the
same enemy mix and route order.

| Difficulty | Starting TP | Metastasis capacity |
| ---------- | ----------: | ------------------: |
| Practice   |         500 |                  20 |
| Standard   |         380 |                  15 |
| Challenge  |         200 |                   7 |

## Treatments

Every treatment has three named, linear upgrades: Calibrated, Focused, and
Breakthrough. The tower crest always shows the active Tier 1-4 number and a
geometric glyph (seed, double chevron, triple chevron, or capstone burst).
Typed configuration tables own costs, range, damage, cooldowns, repair
chances, and special values, so balance changes do not alter simulation rules.

| Treatment            | Core role               | Special behavior                                      |
| -------------------- | ----------------------- | ----------------------------------------------------- |
| Doctor               | Low-cost nearby target  | Reliable syringe strike.                              |
| Chemotherapy         | Group control           | Damages a target and nearby cells; splash radius is 48, 58, 72, then 90 by tier. |
| Cytotoxic T Cell     | Fast single target      | Immune-evasive cells resist it unless marked.         |
| Radiation Bot        | Long-range heavy damage | Slow, high-energy precision damage.                   |
| Antibody Therapy     | Support and control     | Marks, slows, sensitizes, and removes immune evasion. |
| CAR Macrophage       | Close-range heavy hit   | Engulfs slowly; antibody marks amplify its damage.    |
| CRISPR Repair Editor | High-variance support   | Repairs ordinary cells or gains sequence confidence.  |

The CAR Macrophage is explicitly experimental. Its game role is inspired by
[antigen-specific phagocytosis by engineered human macrophages](https://www.nature.com/articles/s41587-020-0462-y)
and macrophage [antibody-dependent cellular phagocytosis](https://pubmed.ncbi.nlm.nih.gov/35302839/),
not a claim about an approved treatment or patient outcome.

The CRISPR Repair Editor is explicitly speculative game fiction. Its tier
chances are 12%, 16%, 22%, and 30%; each mismatch adds a small confidence
bonus, and seven consecutive mismatches guarantee the next repair. A repaired
ordinary cell becomes a mint smiling cell, leaves the route, and awards normal
TP without destruction or division. The editor prioritizes ordinary cells. A
successful Tumor Mass attempt removes only a bounded health segment and delays
the next shedding point; it never converts the boss. The role is inspired by
laboratory work on [mutation correction in colorectal cancer cells](https://pubmed.ncbi.nlm.nih.gov/32021251/)
and [selective mutant EGFR disruption](https://pubmed.ncbi.nlm.nih.gov/28575452/),
not a claim that genome editing is approved or safe cancer care.

## Cancer cells

| Cell type      | Identity                                                                         |
| -------------- | -------------------------------------------------------------------------------- |
| Basic          | Standard low-health cell.                                                        |
| Fast           | Low-health, high-speed cell.                                                     |
| Tough          | Slow, high-health cell.                                                          |
| Dividing       | Releases two Basic cells at its destruction point.                               |
| Immune-Evasive | Takes half T Cell damage until antibody-marked.                                  |
| Tumor Mass     | Slow capstone that sheds cells and ruptures into six Basic and four Tough cells. |

Cells travel a catalog-authored source-to-exit route. A destroyed or repaired
ordinary cell awards configured TP. Tumor Mass is a game-model capstone, not a
medical representation of a patient tumor.

## Interaction and access

- Treatments can be placed only on open tissue. Invalid route or obstacle
  overlap never spends TP. Sales return 55% of invested TP.
- The treatment tray uses a stable left-to-right order, with shortcuts 1-7.
  A selected treatment shows a placement preview and range.
- The action strip places `Start Wave` before Pause/Resume, speed controls,
  and cells-in-play status. The selected-treatment inspector follows it and
  keeps Upgrade next to Sell.
- A placed treatment is pointer-selectable and keyboard-selectable with Enter
  or Space. Its visible focus ring and named inspector preserve the selected
  object's context.
- Map placement supports pointer, touch, and keyboard cursor actions. Arrow
  keys move the cursor, Enter places, Esc cancels, Space pauses, and N starts
  the next ready wave.
- The route network and canonical named landmarks and obstacles expose optional
  learning tooltips. Pointer hover, tap, click, and Tab focus show the same
  nearby biological context without turning repeated cells or route segments
  into additional focus stops.
- Scene-object focus is separate from treatment selection. Escape or an
  open-tissue interaction dismisses the tooltip, preserves the selected
  treatment, and prevents exploration keys from activating global shortcuts.
- When a treatment is selected, the playfield owns pointer input so generous
  learning hotspots cannot cover legal placement tissue. Scene objects remain
  available to keyboard focus during placement.
- Reduced motion retains readable branches, landmarks, selection, and combat
  states while removing continuous ambient motion.

## Persistence

The browser stores only validated, versioned preferences: sound preference,
preferred speed, and the best result per difficulty. A refresh begins a new
run; in-progress campaign state is not persisted.

## Scope boundary

This release includes the linear ten-level campaign, its seven game-model
treatments, and original editable microscopic-world art. It does not include
clinical decision-making, patient-specific mutation matching, biomarkers,
clinical outcomes, accounts, analytics, backend services, in-progress saves,
or external art assets. The map-microenvironment descriptions are teaching and
game-orientation context, not clinical guidance.
