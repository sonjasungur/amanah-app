#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

ENV_FILE="${ENV_FILE:-.env.production}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
BACKUP_DIR="${BACKUP_DIR:-$ROOT/backups}"
CONTAINER="${POSTGRES_CONTAINER:-amanah-postgres}"

mkdir -p "$BACKUP_DIR"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

POSTGRES_USER="${POSTGRES_USER:-amanah}"
POSTGRES_DB="${POSTGRES_DB:-amanah}"
STAMP="$(date +%Y%m%d_%H%M%S)"
OUT="$BACKUP_DIR/amanah_${POSTGRES_DB}_${STAMP}.sql.gz"

if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER"; then
  echo "Postgres container '$CONTAINER' is not running." >&2
  exit 1
fi

# Backups contain account data (e-mail, names) in plaintext; folder data is already
# encrypted by the app. Encrypt the dump file with age public keys (recipients only —
# the private identity must not live on this server).
#   BACKUP_AGE_RECIPIENTS="age1... age1..."   BACKUP_REQUIRE_ENCRYPTION=true
AGE_BIN="${AGE_BIN:-age}"
if [[ -n "${BACKUP_AGE_RECIPIENTS:-}" ]]; then
  if ! command -v "$AGE_BIN" >/dev/null 2>&1; then
    echo "BACKUP_AGE_RECIPIENTS is set but '$AGE_BIN' is not installed." >&2
    exit 1
  fi
  RECIPIENT_ARGS=()
  for r in $BACKUP_AGE_RECIPIENTS; do RECIPIENT_ARGS+=(-r "$r"); done
  OUT="$OUT.age"
  echo "Creating encrypted backup: $OUT"
  umask 077
  docker exec "$CONTAINER" pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --no-acl | gzip | "$AGE_BIN" "${RECIPIENT_ARGS[@]}" > "$OUT"
elif [[ "${BACKUP_REQUIRE_ENCRYPTION:-false}" == "true" ]]; then
  echo "BACKUP_REQUIRE_ENCRYPTION=true but BACKUP_AGE_RECIPIENTS is empty." >&2
  exit 1
else
  echo "WARNING: backup is not encrypted (set BACKUP_AGE_RECIPIENTS)." >&2
  echo "Creating backup: $OUT"
  umask 077
  docker exec "$CONTAINER" pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --no-acl | gzip > "$OUT"
fi
echo "Backup complete ($(du -h "$OUT" | cut -f1))"
