#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

MODE="${1:---working-tree}"
GITLEAKS_VERSION_REQUIRED="8.24.3"
CONFIG="${ROOT}/.gitleaks.toml"
export GIT_CONFIG_COUNT="${GIT_CONFIG_COUNT:-1}"
export GIT_CONFIG_KEY_0="${GIT_CONFIG_KEY_0:-safe.directory}"
export GIT_CONFIG_VALUE_0="${GIT_CONFIG_VALUE_0:-*}"

die() { echo "ERROR: $*" >&2; exit 2; }
info() { echo "[check-secrets] $*"; }

find_gitleaks() {
  if command -v gitleaks >/dev/null 2>&1; then
    command -v gitleaks
    return 0
  fi
  if command -v docker >/dev/null 2>&1; then
    echo "docker"
    return 0
  fi
  return 1
}

run_gitleaks() {
  local bin="$1"; shift
  if [[ "$bin" == "docker" ]]; then
    docker run --rm -v "$ROOT:/repo:ro" -w /repo "zricethezav/gitleaks:v${GITLEAKS_VERSION_REQUIRED}" "$@"
  else
    "$bin" "$@"
  fi
}

BIN="$(find_gitleaks)" || die "gitleaks not found. Install gitleaks ${GITLEAKS_VERSION_REQUIRED} or provide Docker."
if [[ "$BIN" != "docker" ]]; then
  VER="$("$BIN" version 2>/dev/null | head -1 | tr -d '[:space:]')"
  info "using gitleaks ${VER}"
  if [[ "$VER" != "$GITLEAKS_VERSION_REQUIRED" ]]; then
    info "warning: expected ${GITLEAKS_VERSION_REQUIRED}, found ${VER}"
  fi
fi

CFG_ARGS=()
if [[ -f "$CONFIG" ]]; then
  CFG_ARGS+=(--config "$CONFIG")
fi
BASELINE="${ROOT}/.gitleaks-baseline.json"
IGNORE_FILE="${ROOT}/.gitleaksignore"
# gitleaks --baseline-path requires the full default report schema (including Secret/Match).
# We intentionally keep a Secret-free inventory baseline and suppress known findings via .gitleaksignore fingerprints.
if [[ -f "$IGNORE_FILE" ]]; then
  CFG_ARGS+=(--gitleaks-ignore-path "$IGNORE_FILE")
  info "using gitleaksignore ${IGNORE_FILE} (fingerprint suppressions for known historical findings)"
elif [[ -f "$BASELINE" ]]; then
  # Empty baseline [] is valid; non-empty Secret-free baselines are inventory-only.
  if [[ "$(wc -c < "$BASELINE" | tr -d " ")" -le 4 ]]; then
    CFG_ARGS+=(--baseline-path "$BASELINE")
    info "using empty baseline ${BASELINE}"
  else
    info "baseline inventory present at ${BASELINE} (Secret-free); prefer .gitleaksignore for suppressions"
  fi
fi

scan_history() {
  info "scanning git history (redacted)"
  run_gitleaks "$BIN" detect --source "$ROOT" --no-banner --redact "${CFG_ARGS[@]}" --exit-code 1
}

scan_working_tree() {
  info "scanning working tree changes vs HEAD (redacted)"
  run_gitleaks "$BIN" protect --source "$ROOT" --no-banner --redact "${CFG_ARGS[@]}" --exit-code 1
}

scan_staged() {
  info "scanning staged changes (redacted)"
  run_gitleaks "$BIN" protect --source "$ROOT" --staged --no-banner --redact "${CFG_ARGS[@]}" --exit-code 1
}

case "$MODE" in
  --staged) scan_staged ;;
  --working-tree) scan_working_tree ;;
  --history) scan_history ;;
  --all)
    scan_staged || true
    scan_working_tree
    scan_history
    ;;
  *)
    die "unknown mode: $MODE (use --staged|--working-tree|--history|--all)"
    ;;
esac

info "OK: no reportable secrets for mode ${MODE}"
