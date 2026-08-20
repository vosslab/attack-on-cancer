# UI Placement Fix Report

- Calculated placement validity before updating game state in `commitPlacement`.
- Valid placements now clear the selected treatment without self-overlap invalidating the post-placement check.
- Invalid placements still call the unchanged simulation path and do not spend Treatment Points.
