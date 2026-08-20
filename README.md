# Attack on Cancer

A bright browser tower-defense game for students and curious players who want to protect a Skin
Tissue route with readable cancer treatments rather than memorize biology facts.

**Status:** playable v1 vertical slice. It builds as a static GitHub Pages site with no account,
backend, analytics, or external art assets.

## One path, five treatments

The signature promise is a complete tower-defense loop with biology as optional flavor: cartoon
cells leave a primary tumor, travel toward a blood vessel, and make every targeting decision visible.

- Protect one 16:10 Skin Tissue map through 15 manually started waves.
- Read each treatment at a glance: syringe shot, area burst, immune strike, radiation beam, or
  antibody chain.
- Use pointer, touch, or keyboard controls; pause or fast-forward at 1x, 2x, or 4x.
- Choose Practice, Standard, or the intentionally dense, resource-tight Challenge mode.

<!-- screenshots:begin (managed by screenshot-docs) -->
<!-- screenshots:end -->

## Quick start

Install Node.js dependencies once after cloning:

```bash
npm install
```

Build and serve the GitHub Pages artifact locally:

```bash
./run_web_server.sh
```

Build the static artifact without starting a server:

```bash
./build_github_pages.sh
```

The build writes the GitHub Pages-ready site to `dist/`. The preview script selects a random local
port and opens the game in an interactive macOS terminal. For a meaningful first result, place a
Doctor or T Cell on open tissue and select **Start Wave 1**.

## How to play

Choose a difficulty, place treatments on open tissue, and start waves when ready. Destroyed cells
earn Treatment Points (TP); every cell reaching the blood-vessel exit adds one metastasis point.

- Clear wave 15 and all remaining cells to contain the cancer.
- Reaching the selected metastasis capacity ends the run.
- Select a placed treatment to upgrade its three linear tiers or sell it.
- Open the optional inspect panel for concise biology flavor about a selected treatment or cell.

> Example: Antibody Therapy marks a blue Immune-Evasive cell. Its teal ring means the cell slows,
> takes more damage, and no longer resists a Cytotoxic T Cell attack.

## Controls

| Action                | Pointer or touch     | Keyboard                  |
| --------------------- | -------------------- | ------------------------- |
| Select treatment      | Select a tray button | `1` through `5`           |
| Move placement cursor | Move pointer         | Arrow keys                |
| Place treatment       | Tap or click tissue  | Enter                     |
| Cancel placement      | Select another tool  | Esc                       |
| Pause or resume       | Select Pause         | Space                     |
| Start the next wave   | Select Start Wave    | N                         |
| Change speed          | Select 1x, 2x, or 4x | Use the on-screen control |

## Treatment roster

| Treatment        | Role                                                                        | Attack cue                         |
| ---------------- | --------------------------------------------------------------------------- | ---------------------------------- |
| Doctor           | Low-cost syringe treatment for nearby single targets.                       | Dashed syringe shot.               |
| Chemotherapy     | Splash treatment for tight groups.                                          | Purple area burst.                 |
| Cytotoxic T Cell | Fast single-target immune attacks.                                          | Red rapid immune strike.           |
| Radiation Bot    | Expensive, long-range, heavy strikes.                                       | Heavy gold beam and target lock.   |
| Antibody Therapy | Marks, slows, and sensitizes cells; it removes immune evasion while marked. | Teal antibody chain and mark ring. |

## Difficulty

| Difficulty | Starting TP | Metastasis capacity |
| ---------- | ----------: | ------------------: |
| Practice   |         650 |                  20 |
| Standard   |         500 |                  15 |
| Challenge  |         260 |                   7 |

Each refresh starts a new run. Sound preference, preferred speed, and the best result per difficulty
are the only saved settings.

Challenge also sends 40% more cancer cells in every wave group. Practice and Standard use the
published fixed wave counts.

## More information

- [docs/GAME_DESIGN.md](docs/GAME_DESIGN.md) describes the v1 roster, rules, and scope boundary.
- [docs/SOLID_MODEL.md](docs/SOLID_MODEL.md) documents the client-side SolidJS model.
- [docs/CHANGELOG.md](docs/CHANGELOG.md) records implementation history.
- [docs/PLAYWRIGHT_USAGE.md](docs/PLAYWRIGHT_USAGE.md) explains browser-test setup and execution.

## Scope and license

This v1 ships one polished map, not a partial campaign. It intentionally excludes clinical
decision-making, patient outcomes, accounts, backend services, bosses, and additional maps.

The project is available under the [MIT License](LICENSE.MIT.md).
