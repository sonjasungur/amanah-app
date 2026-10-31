#!/usr/bin/env bash
# Health check for staging (and later production): suitable for cron or an uptime monitor.
# Exit 0 = healthy, 1 = alarm. Prints one line per check, never secrets.
#
#   BASE_URL=http://127.0.0.1:3201 EXPECT_ENV=staging ./scripts/staging-healthcheck.sh
#   Optional: DISK_PATH=/ DISK_MAX_PERCENT=85 BACKUP_DIR=/srv/backups/amanah-staging BACKUP_MAX_AGE_HOURS=26
set -uo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:3201}"
EXPECT_ENV="${EXPECT_ENV:-staging}"
DISK_PATH="${DISK_PATH:-/}"
DISK_MAX_PERCENT="${DISK_MAX_PERCENT:-85}"
FAILED=0
ok() { echo "OK   $1"; }
bad() { echo "FAIL $1"; FAILED=1; }

body="$(curl -sf --max-time 10 "$BASE_URL/api/health" || true)"
if [[ -z "$body" ]]; then
  bad "health endpoint unreachable ($BASE_URL/api/health)"
else
  field() { node -e "const b=JSON.parse(process.argv[1]); console.log(b[process.argv[2]])" "$body" "$1"; }
  [[ "$(field status)" == "ok" ]] && ok "status ok" || bad "status not ok"
  [[ "$(field environment)" == "$EXPECT_ENV" ]] && ok "environment $EXPECT_ENV" || bad "environment is $(field environment), expected $EXPECT_ENV"
  [[ "$(field dbReachable)" == "true" ]] && ok "database reachable" || bad "database not reachable"
  [[ "$(field aiEnabled)" == "false" ]] && ok "external AI off" || bad "external AI is on"
fi

used="$(df -P "$DISK_PATH" | awk 'NR==2 {gsub("%","",$5); print $5}')"
if [[ -n "$used" && "$used" -le "$DISK_MAX_PERCENT" ]]; then ok "disk $DISK_PATH ${used}% (limit ${DISK_MAX_PERCENT}%)"; else bad "disk $DISK_PATH ${used:-?}% over ${DISK_MAX_PERCENT}%"; fi

if [[ -n "${BACKUP_DIR:-}" ]]; then
  max_age_min=$(( ${BACKUP_MAX_AGE_HOURS:-26} * 60 ))
  latest="$(find "$BACKUP_DIR" -maxdepth 1 -type f -name '*.age' -mmin "-$max_age_min" | head -1)"
  [[ -n "$latest" ]] && ok "encrypted backup younger than ${BACKUP_MAX_AGE_HOURS:-26} h" || bad "no encrypted backup younger than ${BACKUP_MAX_AGE_HOURS:-26} h in $BACKUP_DIR"
fi

exit "$FAILED"
