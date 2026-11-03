#!/usr/bin/env bash
# Read-only: may the app go back to an image without data encryption? Counts rows, reads no content.
# Exit 0 allowed, 1 not allowed (encrypted rows exist), 2 unknown.
#
#   /opt/amanah-prod/rollback-check.sh
set -u
BASE="${BASE:-/opt/amanah-prod}"
user="$(grep -m1 '^POSTGRES_USER=' "$BASE/.env.production" | cut -d= -f2-)"; db="$(grep -m1 '^POSTGRES_DB=' "$BASE/.env.production" | cut -d= -f2-)"
n="$(docker exec "${CONTAINER:-amanah-postgres}" psql -X -At -U "${user:-amanah}" -d "${db:-amanah}" -c "SELECT count(*) FROM amanah_data WHERE data ? '\$enc'" 2>/dev/null </dev/null)"
[[ "$n" =~ ^[0-9]+$ ]] || { echo "UNBEKANNT: Zaehlung fehlgeschlagen. Kein Rollback ohne Klaerung."; exit 2; }
echo "Verschluesselte Zeilen: $n"
if [ "$n" -gt 0 ]; then
  echo "NICHT ERLAUBT: Ein Image ohne Datenverschluesselung zeigt leere Ordner und speichert Klartext (docs/release/produktionsplan.md)."
  exit 1
fi
echo "ERLAUBT: Keine verschluesselten Zeilen."
