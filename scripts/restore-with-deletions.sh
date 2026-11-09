#!/usr/bin/env bash
# Restores a backup so that nothing deleted since then comes back. The application stays down
# until the deletions are applied: the lock set first makes it refuse to start.
#
#   ENV_FILE=… POSTGRES_CONTAINER=… APP_CONTAINER=… scripts/restore-with-deletions.sh <backup>
#
# Requires the AMANAH_DELETION_LEDGER_* settings and DATABASE_URL in the environment. Replaces the
# database, so it asks for confirmation (RESTORE_CONFIRM=RESTORE skips the prompt). The time of the
# backup comes from the file name (amanah_<db>_YYYYMMDD_HHMMSS…) or BACKUP_TAKEN_AT. Failure at any
# step leaves the lock in place.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

BACKUP_FILE="${1:-}"
ENV_FILE="${ENV_FILE:-.env.production}"
CONTAINER="${POSTGRES_CONTAINER:-amanah-postgres}"
if [[ -z "$BACKUP_FILE" || ! -f "$BACKUP_FILE" ]]; then echo "FAIL backup file not found" >&2; exit 1; fi
if [[ ! -f "$ENV_FILE" ]]; then echo "FAIL missing env file" >&2; exit 1; fi

# Keep a value from the caller: a test or operator may point this at another database.
CALLER_DATABASE_URL="${DATABASE_URL:-}"
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a
DATABASE_URL="${CALLER_DATABASE_URL:-${DATABASE_URL:-}}"
POSTGRES_USER="${POSTGRES_USER:-amanah}"
POSTGRES_DB="${POSTGRES_DB:-amanah}"

if [[ "${AMANAH_DELETION_LEDGER:-}" != "required" ]]; then echo "FAIL deletion ledger is not switched on" >&2; exit 1; fi

if [[ -n "${APP_CONTAINER:-}" ]] && docker ps --format '{{.Names}}' | grep -qx "$APP_CONTAINER"; then
  echo "FAIL application container is running: stop it first" >&2; exit 1
fi
if [[ -n "${APP_HEALTH_URL:-}" ]] && curl -fsS -m 3 -o /dev/null "$APP_HEALTH_URL"; then
  echo "FAIL application is reachable: stop it first" >&2; exit 1
fi

if [[ -n "${BACKUP_TAKEN_AT:-}" ]]; then
  taken_at="$BACKUP_TAKEN_AT"
else
  stamp="$(basename "$BACKUP_FILE" | sed -nE 's/.*_([0-9]{8})_([0-9]{6}).*/\1 \2/p')"
  if [[ -z "$stamp" ]]; then echo "FAIL backup time unknown: set BACKUP_TAKEN_AT" >&2; exit 1; fi
  taken_at="$(date -d "${stamp:0:8} ${stamp:9:2}:${stamp:11:2}:${stamp:13:2}" --iso-8601=seconds)"
fi

if [[ "${RESTORE_CONFIRM:-}" != "RESTORE" ]]; then
  read -r -p "This replaces database '$POSTGRES_DB'. Type RESTORE to continue: " answer
  if [[ "$answer" != "RESTORE" ]]; then echo "Aborted."; exit 1; fi
fi

node scripts/deletion-ledger.mjs lock
echo "OK   locked: application cannot start"

# Checked before anything is overwritten: a damaged ledger must not cost the current database.
node scripts/deletion-ledger.mjs verify >/dev/null
echo "OK   ledger verified"

docker exec "$CONTAINER" dropdb --if-exists --force -U "$POSTGRES_USER" "$POSTGRES_DB"
docker exec "$CONTAINER" createdb -U "$POSTGRES_USER" "$POSTGRES_DB"
if [[ "$BACKUP_FILE" == *.age ]]; then
  : "${BACKUP_AGE_IDENTITY:?BACKUP_AGE_IDENTITY must point to the age identity file}"
  "${AGE_BIN:-age}" -d -i "$BACKUP_AGE_IDENTITY" < "$BACKUP_FILE" | gunzip -c | docker exec -i "$CONTAINER" psql -q -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 >/dev/null
else
  gunzip -c "$BACKUP_FILE" | docker exec -i "$CONTAINER" psql -q -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 >/dev/null
fi
echo "OK   backup restored"

# An older backup may predate the current schema.
npx prisma migrate deploy >/dev/null
echo "OK   migrations applied"

applied="$(node scripts/deletion-ledger.mjs replay --backup-taken-at="$taken_at")"
echo "OK   deletions applied: $applied"

node scripts/deletion-ledger.mjs unlock
echo "OK   unlocked: application may start"
