#!/usr/bin/env bash
# run_fast_checks.sh - build generated visuals, then run fast source checks.
#
# This consumer-owned wrapper preserves check_codebase.sh as vendored content.
# The production build is the single source of truth for generation order, so
# the same generated tree reaches local checks, browser tests, and deployment.

set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

# Local and agent-run Python commands use the repository's Python 3.12 setup.
source source_me.sh

echo "==> build"
./build_github_pages.sh

echo "==> codebase"
./check_codebase.sh

echo "==> pytest"
python3 -m pytest tests/

echo "PASS: generated build and fast checks passed."
