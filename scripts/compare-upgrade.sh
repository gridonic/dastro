#!/usr/bin/env bash
# Compares a consumer project on its current dastro (base) with a candidate
# dastro: two throwaway worktrees of the project at $REF (default HEAD), a dev server each,
# then scripts/compare-sites.js over both. The project checkout is not touched.
#
#   scripts/compare-upgrade.sh <project-dir> <candidate> [port] [base]
#
# <candidate>, [base]: anything `npm install` accepts, e.g. a tarball from
# `npm pack` or "github:gridonic/dastro#v3.3.0-beta.1". Without [base], the
# base keeps the project's locked dastro; pass the previous release to compare
# only what the candidate changes.
# Report and diffs land in /tmp/dastro-compare/<project>/out.
set -euo pipefail

project_dir=$(cd "$1" && pwd)
candidate=$2
port=${3:-4351}
base=${4:-}
ref=${REF:-HEAD}
compare_script="$(cd "$(dirname "$0")" && pwd)/compare-sites.js"
name=$(basename "$project_dir")
work="/tmp/dastro-compare/$name"

cleanup() {
  # The dev servers run as grandchildren of the background subshells
  pkill -f "dastro-compare/$name/" 2>/dev/null || true
  for side in base candidate; do
    git -C "$project_dir" worktree remove --force "$work/$side" 2>/dev/null || true
  done
}
trap cleanup EXIT

rm -rf "$work"
mkdir -p "$work"

for side in base candidate; do
  git -C "$project_dir" worktree add --quiet --detach "$work/$side" "$ref"
  cp "$project_dir/.env" "$work/$side/.env"
  # Generated GraphQL types are gitignored
  mkdir -p "$work/$side/.astro"
  cp -R "$project_dir/.astro/generated" "$work/$side/.astro/"
done

echo "📦 Installing (base: ${base:-lockfile}, candidate: $candidate)"
(cd "$work/base" && npm ci --no-audit --no-fund --ignore-scripts >/dev/null &&
  if [ -n "$base" ]; then
    npm install --no-save --no-audit --no-fund --ignore-scripts "$base" >/dev/null
  fi) &
(cd "$work/candidate" && npm ci --no-audit --no-fund --ignore-scripts >/dev/null &&
  npm install --no-save --no-audit --no-fund --ignore-scripts "$candidate" >/dev/null) &
wait

base_version=$(node -p "require('$work/base/node_modules/dastro/package.json').version")
candidate_version=$(node -p "require('$work/candidate/node_modules/dastro/package.json').version")
echo "ℹ️  dastro base: $base_version, candidate: $candidate_version"

start() {
  local side=$1 side_port=$2
  (cd "$work/$side" &&
    ASTRO_DEV_BACKGROUND=1 LOCAL_DEVELOPMENT_SSL_DISABLED=true \
      npx astro dev --port "$side_port" --strictPort --ignore-lock \
      >"$work/$side.log" 2>&1) &
}

start base "$port"
start candidate "$((port + 1))"

for side_port in "$port" "$((port + 1))"; do
  for _ in $(seq 1 120); do
    curl -s "http://localhost:$side_port/_astro/status" | grep -q '"ok":true' && break
    sleep 1
  done
done

echo "🔍 Comparing"
node "$compare_script" "http://localhost:$port" "http://localhost:$((port + 1))" \
  --out "$work/out" | tee "$work/report.txt"
