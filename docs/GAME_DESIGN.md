# Attack on Cancer game design

## Purpose and tone

Attack on Cancer is a two-scene, cartoon microscopic tower defense game.
Biology is optional flavor and a clear visual identity, not a quiz, medical
simulator, or statement about patient care. The v1 goal is a polished,
replayable Skin Tissue opening and Cluster Corridor finale for 16:10 landscape desktop and tablet
play.

## Core loop

1. Choose a difficulty and place treatments on open tissue.
2. Start the Skin Tissue waves, then enter the Cluster Corridor for its denser finale.
3. Earn Treatment Points (TP) by destroying cells or completing a CRISPR repair.
4. Spend TP on more treatments or three linear upgrades.
5. Keep cells from reaching the blood-vessel exit.

Every escaping cell adds one metastasis point, including a basic cell released
by a destroyed Dividing cell. The game ends immediately at the selected
metastasis capacity. Clearing Skin Tissue wave 15 opens an intermission. The Cluster Corridor
preserves metastases, clears the previous build, awards a 200 TP field grant, and then asks the
player to survive six additional waves. Clearing every remaining cell in wave 21 wins the run.

## Difficulty

Practice and Standard change only starting TP and metastasis capacity. Challenge also sends 40%
more cells in each fixed wave group while preserving the same enemy mix and release order.

| Difficulty | Starting TP | Metastasis capacity |
| ---------- | ----------: | ------------------: |
| Practice   |         500 |                  20 |
| Standard   |         380 |                  15 |
| Challenge  |         200 |                   7 |

## Treatments

Every treatment has three named, linear upgrades: Calibrated, Focused, and
Breakthrough. Costs, range, damage, cooldowns, explicit CRISPR repair chances,
and special values live in typed configuration tables so balance changes do
not alter simulation rules.

| Treatment        | Core role               | Special behavior                                      | Attack cue                         |
| ---------------- | ----------------------- | ----------------------------------------------------- | ---------------------------------- |
| Doctor           | Low-cost nearby target  | Fires a reliable syringe strike.                      | Dashed syringe shot.               |
| Chemotherapy     | Group control           | Damages the target and nearby cells.                  | Purple area burst.                 |
| Cytotoxic T Cell | Fast single target      | Immune-evasive cells resist it unless marked.         | Red rapid immune strike.           |
| Radiation Bot    | Long-range heavy damage | Trades high cost and slow attacks for strong hits.    | Heavy gold beam and target lock.   |
| Antibody Therapy | Support and control     | Marks, slows, sensitizes, and removes immune evasion. | Teal antibody chain and mark ring. |
| CAR Macrophage   | Close-range heavy hit   | Engulfs slowly; antibody marks amplify its damage.    | Closing teal phagocytic cup.       |
| CRISPR Repair Editor | High-variance support | Repairs ordinary cells or gains sequence confidence. | Indigo guide-RNA target.           |

The CAR Macrophage is explicitly experimental. Its game role is inspired by
[antigen-specific phagocytosis by engineered human macrophages](https://www.nature.com/articles/s41587-020-0462-y)
and macrophage [antibody-dependent cellular phagocytosis](https://pubmed.ncbi.nlm.nih.gov/35302839/),
not a claim about an approved treatment or patient outcome.

The CRISPR Repair Editor is also explicitly speculative. Its tier chances are 12%, 16%, 22%, and
30%; each mismatch adds a small confidence bonus, and seven consecutive mismatches guarantee the
next repair. A repaired ordinary cell becomes a mint smiling cell, leaves the route, and awards its
normal TP without triggering destruction or division. The editor prioritizes ordinary cells. A
successful Tumor Mass attempt can only edit one segment: it removes a bounded health chunk and
delays the next shedding point, never converts the boss. This game role is inspired by laboratory
work on [mutation correction in colorectal cancer cells](https://pubmed.ncbi.nlm.nih.gov/32021251/)
and [selective mutant EGFR disruption](https://pubmed.ncbi.nlm.nih.gov/28575452/), not a claim that
genome editing is an approved cancer treatment or can safely normalize tumors in patients.

## Cancer cells

| Cell type      | Identity                                                                 | First wave |
| -------------- | ------------------------------------------------------------------------ | ---------: |
| Basic          | Standard low-health cell.                                                |          1 |
| Fast           | Low-health, high-speed cell.                                             |          4 |
| Tough          | Slow, high-health cell.                                                  |          5 |
| Dividing       | Releases two Basic cells at its destruction point.                       |          7 |
| Immune-Evasive | Takes half T Cell damage until antibody-marked.                          |         10 |
| Tumor Mass     | Slow MOAB-inspired capstone that sheds cells and ruptures into ten more. |         15 |

Cells stay on the current fixed path from a tumor source to the blood-vessel exit. A destroyed or
repaired ordinary cell awards configured TP. The Tumor Mass is the v1 capstone boss.

## Waves and outcomes

Skin Tissue has 15 fixed waves. Early waves teach Basic cells; later waves introduce each new type
and progressively mix them. Wave 15 combines every type and ends with one Tumor Mass. It beats as
it travels, shedding Basic cells along the route, then ruptures into six Basic and four Tough cells
when destroyed.

Cluster Corridor is the next scene: a multi-tumor source feeds a longer, winding path through six
very dense waves (16-21). The player gets a clean build field and 200 TP, but keeps every
metastasis already earned. Its final mixed swarm ends with another Tumor Mass.

- `CANCER CONTAINED`: Wave 21 is clear and no cells remain.
- `CANCER HAS METASTASIZED`: Escapes reach the selected capacity.

## Interaction and access

- Treatments can be placed only on open tissue; invalid overlap never spends TP. Sales return 55%
  of the invested TP, so repositioning has a meaningful tradeoff.
- A range preview appears during placement and selection.
- Players can pause, choose 1x, 2x, or 4x speed, sell treatments, and inspect actors.
- Pointer, touch, and keyboard placement provide equivalent core actions.
- The inspect panel is collapsed by default and contains optional descriptions.
- Sound starts on by default; reduced-motion presentation remains readable.

## Persistence

The browser stores only validated, versioned preferences: sound preference,
preferred speed, and the best result per difficulty. A refresh begins a new run.

## V1 boundary

V1 ships two connected scenes rather than a partial campaign. It does not include:

- Additional maps beyond Cluster Corridor, branching paths, campaign progression, or metastatic side maps.
- Additional bosses beyond Tumor Mass or in-progress run saves.
- NK Cells, Cancer Vaccine, Oncolytic Virus, Surgery, CAR-T, or Proton Therapy.
- Patient-specific mutation matching, biomarkers, clinical decision-making, or outcomes.
- Accounts, analytics, backend services, routing, external art assets, or mandatory audio.

Future content begins with a separate plan after this vertical slice is stable and fun.
