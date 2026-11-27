#!/usr/bin/env bash
# Entry point for the staging cron jobs (/etc/cron.d/amanah-staging). Runs one job, keeps
# its last output in /var/log/amanah-staging-<job>.log and passes the result to
# staging-alert.sh. Settings come from ops.env next to the compose file (no secrets there).
#
#   scripts/staging-cron.sh health|backup|restore|security
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
JOB="${1:-}"
LOG_DIR="${LOG_DIR:-/var/log}"
LOG="$LOG_DIR/amanah-staging-$JOB.log"

if [[ -f ops.env ]]; then
  set -a
  # shellcheck disable=SC1091
  source ops.env
  set +a
fi
BASE_URL="${BASE_URL:-http://127.0.0.1:3201}"
BACKUP_DIR="${BACKUP_DIR:-$ROOT/backups}"
RESTORE_STAMP="${RESTORE_STAMP:-$ROOT/state/restore-test.ok}"
OWNER_RESTORE_STAMP="${OWNER_RESTORE_STAMP:-$ROOT/state/owner-restore.ok}"
# Public recipients only (age1...); the app secrets in .env.staging are not loaded here.
recipients="$(grep -m1 '^BACKUP_AGE_RECIPIENTS=' .env.staging 2>/dev/null | cut -d= -f2- | tr -d "\"'")"

case "$JOB" in
  health)
    # The automatic restore proof is only required once a restore-check key is configured.
    BASE_URL="$BASE_URL" BACKUP_DIR="$BACKUP_DIR" RESTORE_RECIPIENTS="$recipients" \
      RESTORE_STAMP="${AGE_IDENTITY:+$RESTORE_STAMP}" OWNER_RESTORE_STAMP="$OWNER_RESTORE_STAMP" \
      scripts/staging-healthcheck.sh > "$LOG" 2>&1
    ;;
  backup)
    # Owner recipients come from .env.staging (required); the restore-check key is added on top.
    ENV_FILE=.env.staging POSTGRES_CONTAINER=amanah-staging-postgres BACKUP_DIR="$BACKUP_DIR" \
      BACKUP_AGE_EXTRA_RECIPIENTS="${RESTORE_CHECK_RECIPIENT:-}" AGE_BIN="$ROOT/bin/age" BACKUP_REQUIRE_ENCRYPTION=true scripts/backup-postgres.sh > "$LOG" 2>&1 \
      && find "$BACKUP_DIR" -name 'amanah_*.sql.gz.age' -mtime +"${BACKUP_KEEP_DAYS:-7}" -delete
    ;;
  restore)
    # Automatic only with the separate restore-check identity on the server (docs 29). The
    # owner's own test (--stdin) is tracked separately through OWNER_RESTORE_STAMP.
    if [[ -z "${AGE_IDENTITY:-}" ]]; then
      echo "restore test skipped: no AGE_IDENTITY configured (owner runs it manually)" > "$LOG"
      exit 0
    fi
    AGE_IDENTITY="$AGE_IDENTITY" BACKUP_DIR="$BACKUP_DIR" RESTORE_STAMP="$RESTORE_STAMP" \
      scripts/staging-restore-test.sh > "$LOG" 2>&1
    ;;
  security)
    BASE_URL="$BASE_URL" scripts/staging-security-check.sh > "$LOG" 2>&1
    ;;
  *)
    echo "usage: $0 health|backup|restore|security" >&2
    exit 2
    ;;
esac
code=$?
scripts/staging-alert.sh "$JOB" "$code" "$LOG"
exit "$code"
