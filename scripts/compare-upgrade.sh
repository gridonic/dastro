#!/usr/bin/env bash
# Compares a consumer project on its current dastro (base) with a candidate
# dastro: two throwaway worktrees of the project at $REF (default HEAD), a dev server each,
# then scripts/compare-sites.js over both. The project checkout is not touched.
#
#   scripts/compare-upgrade.sh <project-dir> <candidate> [port] [base]
#   scripts/compare-upgrade.sh --base-ref <ref> <project-dir> [port]
#
# <candidate>, [base]: anything `npm install` accepts, e.g. a tarball from
# `npm pack` or "github:gridonic/dastro#v3.3.0-beta.1". Without [base], the
# base keeps the project's locked dastro; pass the previous release to compare
# only what the candidate changes.
# --base-ref: the base worktree is at <ref> instead of $REF, and both sides keep
# their locked dependencies, e.g. an upgrade branch (with its patches and
# dependency updates) against main.
# Report and diffs land in /tmp/dastro-compare/<project>/out.
set -euo pipefail

base_ref=
if [ "${1:-}" = "--base-ref" ]; then
  base_ref=$2
  shift 2
  candidate=
  port=${2:-4351}
  base=
else
  candidate=$2
  port=${3:-4351}
  base=${4:-}
fi
project_dir=$(cd "$1" && pwd)
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
  side_ref=$ref
  if [ "$side" = base ] && [ -n "$base_ref" ]; then
    side_ref=$base_ref
  fi
  git -C "$project_dir" worktree add --quiet --detach "$work/$side" "$side_ref"
  cp "$project_dir/.env" "$work/$side/.env"
  # Generated GraphQL types are gitignored
  mkdir -p "$work/$side/.astro"
  cp -R "$project_dir/.astro/generated" "$work/$side/.astro/"
done

echo "📦 Installing (base: ${base_ref:+$base_ref, }${base:-lockfile}, candidate: ${candidate:-lockfile})"
(cd "$work/base" && npm ci --no-audit --no-fund --ignore-scripts >/dev/null &&
  if [ -n "$base" ]; then
    npm install --no-save --no-audit --no-fund --ignore-scripts "$base" >/dev/null
  fi) &
(cd "$work/candidate" && npm ci --no-audit --no-fund --ignore-scripts >/dev/null &&
  if [ -n "$candidate" ]; then
    npm install --no-save --no-audit --no-fund --ignore-scripts "$candidate" >/dev/null
  fi) &
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
