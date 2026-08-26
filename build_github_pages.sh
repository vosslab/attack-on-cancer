#!/usr/bin/env bash
# build_github_pages.sh - canonical production build for GitHub Pages.
#
# Front door: run this directly as ./build_github_pages.sh. It is the
# interface for everyone, no npm knowledge required. The npm run build
# alias is an optional mirror that points right back at this script.
#
# Contract:
#   - Wipes dist/ from scratch.
#   - Type-checks via 'tsc --noEmit -p tsconfig.json'.
#   - Resolves the entry: src/main.tsx, src/main.ts, then src/init.ts.
#     Aborts with an actionable error if neither exists.
#   - Generates the validated SolidJS visual components before TypeScript checks.
#   - Verifies src/index.html, src/favicon.svg, and all four source stylesheets exist before copying;
#     aborts with an actionable error if missing.
#   - Verifies src/index.html references dist/main.js with a module script
#     tag (warns if missing -- the page will load but main.js is dead).
#   - Bundles the entry into dist/main.js with esbuild (ESM, es2020,
#     browser, minified, with sourcemap).
#   - Copies src/index.html and all four source stylesheets into dist/.
#   - Writes dist/.nojekyll so GitHub Pages serves files starting with _.
#   - Asserts the HTML, bundle, and component stylesheet exist before exiting.
#
# Hard rule: never produces single-file output. ESM only.

set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
source source_me.sh

# Resolve entry point.
if [ -f "src/main.tsx" ]; then
	ENTRY="src/main.tsx"
elif [ -f "src/main.ts" ]; then
	ENTRY="src/main.ts"
elif [ -f "src/init.ts" ]; then
	ENTRY="src/init.ts"
	echo "WARNING: using legacy src/init.ts. Rename to src/main.ts." >&2
else
	echo "ERROR: no entry point. Create src/main.ts (preferred) or src/init.ts." >&2
	exit 1
fi

# Verify required static assets before any destructive step.
REQUIRED_FILES=(
	src/index.html
	src/favicon.svg
	src/style.css
	src/world_visuals.css
	src/combat_visuals.css
	src/combat_motion.css
	generate_visual_assets.py
)
for required in "${REQUIRED_FILES[@]}"; do
	if [ ! -f "$required" ]; then
		echo "ERROR: required source file missing: $required" >&2
		case "$required" in
			src/index.html)
				echo "  Create src/index.html with a <script type=\"module\" src=\"main.js\"></script> tag." >&2 ;;
			src/favicon.svg)
				echo "  Create src/favicon.svg as the browser-tab icon." >&2 ;;
			src/style.css)
				echo "  Create src/style.css (empty file is fine)." >&2 ;;
			src/world_visuals.css)
				echo "  Create src/world_visuals.css for tissue and route motion." >&2 ;;
			src/combat_visuals.css)
				echo "  Create src/combat_visuals.css for combat motion." >&2 ;;
			src/combat_motion.css)
				echo "  Create src/combat_motion.css for combat animation and reduced-motion rules." >&2 ;;
		esac
		exit 1
	fi
done

# Soft-warn if index.html does not reference main.js as an ES module.
if ! grep -Eq '<script[^>]+type="module"[^>]+src="(\./)?main\.js"' src/index.html; then
	echo "WARNING: src/index.html does not appear to load main.js as an ES module." >&2
	echo "  Expected tag: <script type=\"module\" src=\"main.js\"></script>" >&2
	echo "  Build will proceed; the page may render but main.js will not run." >&2
fi

rm -rf dist
mkdir -p dist

# ASVS 5.3.2: the generator reads and writes only fixed repository-owned paths.
# CI pins Python 3.12; source_me.sh establishes the same local runtime contract.
python3 generate_visual_assets.py

npx tsc --noEmit -p tsconfig.json

node tools/build_solid.mjs "$ENTRY"

cp src/index.html dist/index.html
cp src/favicon.svg dist/favicon.svg
cp src/style.css dist/style.css
cp src/world_visuals.css dist/world_visuals.css
cp src/combat_visuals.css dist/combat_visuals.css
cp src/combat_motion.css dist/combat_motion.css
touch dist/.nojekyll

test -f dist/index.html
test -f dist/favicon.svg
test -f dist/main.js
test -f dist/world_visuals.css
test -f dist/combat_visuals.css
test -f dist/combat_motion.css

echo "Built dist/ with component styles (GitHub Pages-ready)."
