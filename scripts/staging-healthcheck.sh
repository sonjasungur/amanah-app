#!/usr/bin/env bash
# Health check for staging (and later production): suitable for cron or an uptime monitor.
# Exit 0 = healthy, 1 = alarm. Prints one line per check, never secrets.
#
#   BASE_URL=http://127.0.0.1:3201 EXPECT_ENV=staging ./scripts/staging-healthcheck.sh
#   Optional: DISK_PATH=/ DISK_MAX_PERCENT=85 BACKUP_DIR=/srv/backups/amanah-staging BACKUP_MAX_AGE_HOURS=26
#             RESTORE_STAMP=<restore-test.ok> RESTORE_RECIPIENTS="age1..." RESTORE_MAX_AGE_DAYS=8
#             CERT_HOST=staging.<domain> CERT_MIN_DAYS=21
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
  # jq on servers without Node (the app runs in Docker), Node as fallback for local use
  if command -v jq >/dev/null 2>&1; then
    field() { jq -r --arg k "$1" '.[$k] | tostring' <<<"$body"; }
  else
    field() { node -e "const b=JSON.parse(process.argv[1]); console.log(b[process.argv[2]])" "$body" "$1"; }
  fi
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

# A backup only counts once a restore test with the current recipients passed
# (written by staging-restore-test.sh). RESTORE_RECIPIENTS = current BACKUP_AGE_RECIPIENTS.
if [[ -n "${RESTORE_STAMP:-}" ]]; then
  max_days="${RESTORE_MAX_AGE_DAYS:-8}"
  want="$(printf '%s' "${RESTORE_RECIPIENTS:-}" | sha256sum | cut -d' ' -f1)"
  if [[ -z "${RESTORE_RECIPIENTS:-}" ]]; then
    bad "no backup recipient configured (BACKUP_AGE_RECIPIENTS empty)"
  elif [[ ! -f "$RESTORE_STAMP" ]]; then
    bad "no passed restore test for the current backup key"
  elif ! grep -qx "recipients_sha256=$want" "$RESTORE_STAMP"; then
    bad "last restore test used a different backup key"
  elif [[ -z "$(find "$RESTORE_STAMP" -mtime "-$max_days")" ]]; then
    bad "last passed restore test older than $max_days days"
  else
    ok "restore test passed within $max_days days"
  fi
fi

# Only once HTTPS is live: CERT_HOST=staging.<domain> CERT_MIN_DAYS=21
if [[ -n "${CERT_HOST:-}" ]]; then
  min_days="${CERT_MIN_DAYS:-21}"
  cert="$(echo | timeout 15 openssl s_client -servername "$CERT_HOST" -connect "$CERT_HOST:443" 2>/dev/null | openssl x509 2>/dev/null)"
  if [[ -z "$cert" ]]; then
    bad "no TLS certificate from $CERT_HOST:443"
  elif openssl x509 -noout -checkend $(( min_days * 86400 )) <<<"$cert" >/dev/null; then
    ok "certificate $CERT_HOST valid for more than $min_days days"
  else
    bad "certificate $CERT_HOST expires within $min_days days"
  fi
fi

exit "$FAILED"
