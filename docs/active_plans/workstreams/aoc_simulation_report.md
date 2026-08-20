# Attack on Cancer simulation workstream

## Assumptions

- Simulation functions return new state values and do not mutate their inputs.
- A wave must clear before the player starts the next manual wave.
- Tower targeting is front-most enemy in range, with lower entity ID breaking ties.

## Decisions

- The path is the single geometry source for both movement and render positions.
- Antibody marks last for its configured duration, apply configured slowing, and use a 1.35 received-damage multiplier.
- Selling returns 70 percent of all tower and upgrade costs; upgrades are the three configured linear tiers.
- Ticks advance exactly by their supplied positive elapsed time; the UI owns frame-duration capping if needed.

## Concrete next steps

- UI integration should call `createGameState`, `startWave`, `tickGame`, and the placement/tower action exports.
- Add simulation unit tests once the test workstream is ready.

## Changed files

- `src/simulation.ts`: pure deterministic game state, placement, waves, movement, combat, damage, division, rewards, and terminal rules.
- `docs/active_plans/workstreams/aoc_simulation_report.md`: this handoff report.

## Validation performed

- Initial `npx tsc --noEmit -p tsconfig.json` found one strict optional-property diagnostic in the
  simulation splash branch; the branch now narrows the configured radius before use.
- Final command: `npx tsc --noEmit -p tsconfig.json` exited 0 with no diagnostic output.
