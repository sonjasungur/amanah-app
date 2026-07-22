#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
export GIT_CONFIG_COUNT="${GIT_CONFIG_COUNT:-1}"
export GIT_CONFIG_KEY_0="${GIT_CONFIG_KEY_0:-safe.directory}"
export GIT_CONFIG_VALUE_0="${GIT_CONFIG_VALUE_0:-*}"

info() { echo "[check-tracked-sensitive-files] $*"; }
fail=0

mapfile -t FILES < <(git -c safe.directory="$ROOT" ls-files)

is_allowed_example() {
  local f="$1"
  [[ "$f" == *.example ]] && return 0
  [[ "$f" =~ \.example$ ]] && return 0
  [[ "$f" =~ \.env\..*\.example$ ]] && return 0
  return 1
}

blocked_msg() {
  echo "BLOCKED tracked sensitive path: $1 ($2)" >&2
  fail=1
}

for f in "${FILES[@]}"; do
  base="$(basename "$f")"
  if is_allowed_example "$f"; then
    continue
  fi
  case "$base" in
    .env|.env.local|.env.production|.env.staging|.env.development)
      blocked_msg "$f" "env-file"; continue ;;
  esac
  case "$base" in
    .env.backup*) blocked_msg "$f" "env-backup"; continue ;;
  esac
  case "$base" in
    *credentials*.csv) blocked_msg "$f" "credential-csv"; continue ;;
  esac
  case "$base" in
    *.pem|*.key|*.p12|*.pfx|*.jks|*.keystore) blocked_msg "$f" "key-material"; continue ;;
  esac
  case "$base" in
    *service-account*.json|*service_account*.json) blocked_msg "$f" "service-account"; continue ;;
  esac
  if [[ "$f" == backups/* ]]; then
    case "$base" in
      *.sql|*.gz|*.dump|*.bak)
        # *.gz covers .sql.gz basenames ending with .gz
        if [[ "$base" == *.sql || "$base" == *.sql.gz || "$base" == *.dump || "$base" == *.bak ]]; then
          blocked_msg "$f" "tracked-backup-dump"; continue
        fi
        ;;
    esac
  fi
  case "$base" in
    *.dump|*.bak) blocked_msg "$f" "dump-or-bak"; continue ;;
  esac
done

if [[ "$fail" -ne 0 ]]; then
  info "FAILED: remove blocked files from the git index"
  exit 1
fi
info "OK: no blocked sensitive filenames in the git index"
