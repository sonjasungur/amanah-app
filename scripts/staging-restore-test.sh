#!/usr/bin/env bash
# Restore test for staging backups: loads one backup into a throw-away database inside the
# staging Postgres container, compares it with the live database, drops it again and records
# the result for the health check. The live staging database is only read.
#
# Decrypt on the server with a restore-check identity (automatic, cron):
#   AGE_IDENTITY=/root/.config/amanah-staging/restore-check.key scripts/staging-restore-test.sh [backup.sql.gz.age]
# Decrypt on the owner's computer — the durable key never leaves it (docs 29):
#   ssh <server> 'cat /opt/amanah-staging/backups/<file>.age' | age -d -i <key> \
#     | ssh <server> 'cd /opt/amanah-staging && BACKUP_NAME=<file> scripts/staging-restore-test.sh --stdin'
#
# Output: one OK/FAIL line per check (no data, no secrets). Exit 0 = restore works.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

ENV_FILE="${ENV_FILE:-.env.staging}"
CONTAINER="${POSTGRES_CONTAINER:-amanah-staging-postgres}"
BACKUP_DIR="${BACKUP_DIR:-$ROOT/backups}"
STAMP_FILE="${RESTORE_STAMP:-$ROOT/state/restore-test.ok}"
AGE_IMAGE="${AGE_IMAGE:-amanah-staging-age:1}"
TEST_DB="amanah_restore_test"
FAILED=0
ok() { echo "OK   $1"; }
bad() { echo "FAIL $1"; FAILED=1; }

if [[ ! -f "$ENV_FILE" ]]; then echo "FAIL restore test: missing $ENV_FILE"; exit 1; fi
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a
POSTGRES_USER="${POSTGRES_USER:-amanah}"
POSTGRES_DB="${POSTGRES_DB:-amanah}"
if [[ "$POSTGRES_DB" == "$TEST_DB" ]]; then echo "FAIL restore test: refusing to use the live database name"; exit 1; fi

# No -i: with --stdin the backup arrives on stdin and must reach only the restore below.
psql_q() { docker exec "$CONTAINER" psql -U "$POSTGRES_USER" -d "$1" -v ON_ERROR_STOP=1 -qAt -c "$2"; }

if [[ "${1:-}" == "--stdin" ]]; then
  source_desc="${BACKUP_NAME:-stdin}"
  decrypt() { cat; }
else
  backup="${1:-$(ls -1t "$BACKUP_DIR"/amanah_*.sql.gz.age 2>/dev/null | head -1)}"
  if [[ -z "$backup" || ! -f "$backup" ]]; then echo "FAIL restore test: no encrypted backup found in $BACKUP_DIR"; exit 1; fi
  if [[ -z "${AGE_IDENTITY:-}" || ! -f "${AGE_IDENTITY:-}" ]]; then
    echo "FAIL restore test: no age identity available (AGE_IDENTITY) — backups cannot be verified"
    exit 1
  fi
  source_desc="$(basename "$backup")"
  # age runs in a container (no host package); identity and backup are mounted read-only.
  decrypt() {
    docker run --rm -i --network none -v "$(dirname "$AGE_IDENTITY"):/keys:ro" "$AGE_IMAGE" \
      -d -i "/keys/$(basename "$AGE_IDENTITY")" < "$backup"
  }
fi

if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER"; then echo "FAIL restore test: container $CONTAINER not running"; exit 1; fi
cleanup() { psql_q postgres "DROP DATABASE IF EXISTS $TEST_DB" >/dev/null 2>&1 || true; }
trap cleanup EXIT
cleanup
psql_q postgres "CREATE DATABASE $TEST_DB" >/dev/null || { echo "FAIL restore test: cannot create $TEST_DB"; exit 1; }

if decrypt | gunzip -c | docker exec -i "$CONTAINER" psql -U "$POSTGRES_USER" -d "$TEST_DB" -v ON_ERROR_STOP=1 -q >/dev/null 2>&1; then
  ok "backup $source_desc decrypted and loaded into $TEST_DB"
else
  bad "backup $source_desc could not be decrypted or loaded"
  exit 1
fi

tables="select count(*) from information_schema.tables where table_schema = 'public'"
migrations="select count(*) from _prisma_migrations where finished_at is not null"
[[ "$(psql_q "$TEST_DB" "$tables")" == "$(psql_q "$POSTGRES_DB" "$tables")" ]] && ok "same number of tables as live" || bad "table count differs from live"
[[ "$(psql_q "$TEST_DB" "$migrations")" == "$(psql_q "$POSTGRES_DB" "$migrations")" ]] && ok "same applied migrations as live" || bad "applied migrations differ from live"
users="$(psql_q "$TEST_DB" "select count(*) from users" 2>/dev/null || echo 0)"
[[ "$users" -gt 0 ]] && ok "restored database contains accounts ($users)" || bad "restored database contains no accounts"

if [[ "$FAILED" == "0" ]]; then
  # The stamp ties the result to the current recipients: changing BACKUP_AGE_RECIPIENTS
  # invalidates it until a new restore test passed (checked by staging-healthcheck.sh).
  mkdir -p "$(dirname "$STAMP_FILE")"
  printf 'date=%s\nbackup=%s\nrecipients_sha256=%s\n' "$(date -Iseconds)" "$source_desc" \
    "$(printf '%s' "${BACKUP_AGE_RECIPIENTS:-}" | sha256sum | cut -d' ' -f1)" > "$STAMP_FILE"
  ok "restore test passed, recorded in $STAMP_FILE"
fi
exit "$FAILED"
