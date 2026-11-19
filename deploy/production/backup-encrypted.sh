#!/usr/bin/env bash
# Encrypted production backup. Runs on the server from /opt/amanah-prod (see docs/strategy/45).
# Encrypts to public age recipients only; the private key is never on this server. Refuses to
# write anything unencrypted. A failure leaves no file and exits non-zero. Deletes nothing.
set -euo pipefail

BASE=/opt/amanah-prod
BACKUP_DIR="${BACKUP_DIR:-$BASE/backups}"
CONTAINER=amanah-postgres
AGE="$BASE/bin/age"

# Public recipients only; a test may set them for a single run.
if [[ -z "${BACKUP_AGE_RECIPIENTS:-}" ]]; then
  # shellcheck disable=SC1091
  source "$BASE/backup.env"
fi
[[ -n "${BACKUP_AGE_RECIPIENTS:-}" ]] || { echo "No backup recipient configured." >&2; exit 1; }

# Only these two values are read from the env file; the rest stays untouched.
POSTGRES_USER="$(grep -m1 '^POSTGRES_USER=' "$BASE/.env.production" | cut -d= -f2-)"
POSTGRES_DB="$(grep -m1 '^POSTGRES_DB=' "$BASE/.env.production" | cut -d= -f2-)"
POSTGRES_USER="${POSTGRES_USER:-amanah}"; POSTGRES_DB="${POSTGRES_DB:-amanah}"

umask 077
mkdir -p "$BACKUP_DIR"
OUT="$BACKUP_DIR/amanah_${POSTGRES_DB}_$(date +%Y%m%d_%H%M%S).sql.gz.age"
TMP="$OUT.tmp"
trap 'rm -f "$TMP"' EXIT

ARGS=(); for r in $BACKUP_AGE_RECIPIENTS; do ARGS+=(-r "$r"); done
docker exec "$CONTAINER" pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --no-acl | gzip | "$AGE" "${ARGS[@]}" > "$TMP"

[[ "$(head -c 21 "$TMP")" == "age-encryption.org/v1" ]] || { echo "Output is not age encrypted." >&2; exit 1; }
[[ "$(stat -c %s "$TMP")" -gt 300 ]] || { echo "Backup is implausibly small." >&2; exit 1; }
mv "$TMP" "$OUT"
trap - EXIT
if [[ "$BACKUP_DIR" == "$BASE/backups" ]]; then
  printf 'date=%s\nbackup=%s\nbytes=%s\n' "$(date -Iseconds)" "$(basename "$OUT")" "$(stat -c %s "$OUT")" > "$BASE/state-backup.ok"
fi
echo "Encrypted backup complete: $(basename "$OUT") ($(du -h "$OUT" | cut -f1))"
