# Solid SVG Ref Fix Report

## Scope

- Corrected the playfield SVG `ref` in `src/app.tsx` to use a Solid callback ref.
- The callback assigns the rendered `SVGSVGElement` to `mapElement`, so pointer coordinate conversion can use the actual playfield bounds.

## Verification

- `npx tsc --noEmit -p tsconfig.json`
- `npx eslint --max-warnings 0 src/app.tsx`
