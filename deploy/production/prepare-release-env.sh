#!/usr/bin/env bash
# Prepares the env file for the production release WITHOUT using it. The active .env.production and
# the running app stay untouched. Prints variable names only. Refuses to replace an existing data
# key: once used, losing it means losing data.
#
#   prepare-release-env.sh [https://public-base-url]
set -euo pipefail
BASE="${BASE:-/opt/amanah-prod}"
OUT_DIR="$BASE/release"
NEXT="$OUT_DIR/.env.production.next"
KID="${KID:-prod1}"
URL="${1:-}"
[ -z "$URL" ] || [[ "$URL" =~ ^https://[a-z0-9.-]+$ ]] || { echo "Abgelehnt: Adresse muss https://host sein." >&2; exit 1; }
umask 077
mkdir -p "$OUT_DIR"
source "$BASE/backup.env"
[ -n "${BACKUP_AGE_RECIPIENTS:-}" ] || { echo "Kein Backup-Empfaenger." >&2; exit 1; }

if [ -f "$NEXT" ]; then
  echo "Vorhanden, Schluessel bleibt: $NEXT"
else
  key="$(openssl rand -base64 32)"
  args=(); for r in $BACKUP_AGE_RECIPIENTS; do args+=(-r "$r"); done
  # A copy of the key only the owner can read: backups of encrypted data are useless without it.
  printf '%s:%s\n' "$KID" "$key" | "$BASE/bin/age" "${args[@]}" > "$OUT_DIR/data-key-$KID.age"
  [ "$(head -c 21 "$OUT_DIR/data-key-$KID.age")" = "age-encryption.org/v1" ] || { rm -f "$OUT_DIR/data-key-$KID.age"; echo "Schluesselkopie fehlgeschlagen." >&2; exit 1; }
  grep -vE '^(AMANAH_DATA_KEYS|AMANAH_DATA_KEY_ACTIVE|AMANAH_DATA_ENCRYPTION|AMANAH_AI_ENABLED|NEXT_PUBLIC_AMANAH_AI_ENABLED|AMANAH_PUBLIC_BASE_URL)=' "$BASE/.env.production" > "$NEXT.tmp"
  { printf 'AMANAH_DATA_KEYS=%s:%s\n' "$KID" "$key"
    printf 'AMANAH_DATA_KEY_ACTIVE=%s\nAMANAH_DATA_ENCRYPTION=required\nAMANAH_AI_ENABLED=false\nNEXT_PUBLIC_AMANAH_AI_ENABLED=false\nAMANAH_PUBLIC_BASE_URL=\n' "$KID"; } >> "$NEXT.tmp"
  unset key
  mv "$NEXT.tmp" "$NEXT"
  echo "Erstellt: $NEXT und $OUT_DIR/data-key-$KID.age"
fi
if [ -n "$URL" ]; then
  grep -v '^AMANAH_PUBLIC_BASE_URL=' "$NEXT" > "$NEXT.tmp"; echo "AMANAH_PUBLIC_BASE_URL=$URL" >> "$NEXT.tmp"; mv "$NEXT.tmp" "$NEXT"
fi
grep -q '^AMANAH_PUBLIC_BASE_URL=.' "$NEXT" && echo "OK   AMANAH_PUBLIC_BASE_URL gesetzt" || echo "OFFEN AMANAH_PUBLIC_BASE_URL: Domain fehlt"
for v in AMANAH_DATA_KEYS AMANAH_DATA_KEY_ACTIVE AMANAH_DATA_ENCRYPTION; do grep -q "^$v=." "$NEXT" && echo "OK   $v gesetzt" || echo "FAIL $v fehlt"; done
grep -qx 'AMANAH_AI_ENABLED=false' "$NEXT" && echo "OK   AMANAH_AI_ENABLED=false" || echo "FAIL AMANAH_AI_ENABLED"
