#!/usr/bin/env bash
# capture_screenshots.sh - refresh the managed README gameplay screenshot.
#
# Usage: ./capture_screenshots.sh

set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

server_pid=""
server_log="/tmp/attack_on_cancer_screenshot_server.log"
capture_dir="/tmp/attack_on_cancer_screenshots"
port="$((8500 + RANDOM % 1000))"

#============================================
cleanup() {
	local status=$?
	trap - EXIT INT TERM HUP
	if [ -n "${server_pid}" ] && kill -0 "${server_pid}" 2>/dev/null; then
		kill "${server_pid}" 2>/dev/null || true
	fi
	exit "${status}"
}
trap cleanup EXIT INT TERM HUP

./build_github_pages.sh
source source_me.sh
python3 -m http.server "${port}" --bind 127.0.0.1 --directory dist >"${server_log}" 2>&1 &
server_pid=$!

server_ready=0
for _ in {1..50}; do
	if curl --fail --silent "http://127.0.0.1:${port}/" >/dev/null 2>&1; then
		server_ready=1
		break
	fi
	sleep 0.1
done

if [ "${server_ready}" -ne 1 ]; then
	echo "ERROR: screenshot server did not become ready." >&2
	cat "${server_log}" >&2
	exit 1
fi

mkdir -p "${capture_dir}"
node tools/capture_docs_screenshots.mjs "http://127.0.0.1:${port}/" "${capture_dir}"

mkdir -p docs/screenshots
for screenshot in skin_tissue_battle.png antibody_targeting.png cluster_corridor.png; do
	cp "${capture_dir}/${screenshot}" "docs/screenshots/${screenshot}"
	echo "Captured docs/screenshots/${screenshot}"
done
