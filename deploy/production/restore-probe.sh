#!/usr/bin/env bash
# Loads a decrypted production backup (gzip SQL on stdin) into a throwaway database: no network, in
# RAM, removed afterwards. Prints counts only, never contents. Reads the live database only to
# compare counts and never writes to it. See docs/strategy/45 §2.
#
#   ... | restore-probe.sh [backup-name]     MARKER=1 records a passed owner probe
set -uo pipefail
BASE="${BASE:-/opt/amanah-prod}"
LIVE=amanah-postgres
C="amanah-restore-probe-$$"
trap 'docker rm -f "$C" >/dev/null 2>&1 </dev/null' EXIT
SIG="SELECT (SELECT count(*) FROM users)||'|'||(SELECT count(*) FROM _prisma_migrations WHERE finished_at IS NOT NULL)||'|'||(SELECT max(migration_name) FROM _prisma_migrations)||'|'||(SELECT count(*) FROM information_schema.tables WHERE table_schema='public')"

docker run -d --rm --name "$C" --network none --memory 512m --cpus 1 -e POSTGRES_USER=probe \
  -e POSTGRES_PASSWORD="$(openssl rand -hex 16)" -e POSTGRES_DB=probe --tmpfs /var/lib/postgresql/data \
  postgres:16-alpine >/dev/null </dev/null || { echo "FAIL Testdatenbank startet nicht"; exit 1; }
# The image starts the server twice; only the second start is the real one.
for _ in $(seq 1 60); do
  [ "$(docker logs "$C" 2>&1 </dev/null | grep -c 'ready to accept connections')" -ge 2 ] && break
  sleep 1
done

gunzip 2>/dev/null | docker exec -i "$C" psql -q -X -v ON_ERROR_STOP=1 -U probe -d probe >/dev/null 2>&1
codes=("${PIPESTATUS[@]}")
[ "${codes[0]}" = 0 ] && [ "${codes[1]}" = 0 ] || { echo "FAIL Backup liess sich nicht einspielen (Schluessel oder Datei)"; exit 1; }

restored="$(docker exec "$C" psql -X -At -U probe -d probe -c "$SIG" 2>/dev/null </dev/null)"
[ -n "$restored" ] || { echo "FAIL Wiederhergestellte Datenbank hat nicht die erwartete Struktur"; exit 1; }
user="$(grep -m1 '^POSTGRES_USER=' "$BASE/.env.production" | cut -d= -f2-)"; db="$(grep -m1 '^POSTGRES_DB=' "$BASE/.env.production" | cut -d= -f2-)"
live="$(docker exec "$LIVE" psql -X -At -U "${user:-amanah}" -d "${db:-amanah}" -c "$SIG" 2>/dev/null </dev/null)"

echo "Felder: Konten|Migrationen|letzte Migration|Tabellen"
echo "Backup: $restored"
echo "Live:   $live"
if [ "$restored" = "$live" ]; then echo "OK   Backup und Live stimmen in diesen Zahlen ueberein"
else echo "INFO Abweichung: nur unbedenklich, wenn sich Live nach dem Backup geaendert hat"; fi
if [ "${MARKER:-0}" = 1 ]; then
  umask 077
  printf 'date=%s\nbackup=%s\nrecipient_fingerprint=%s\nresult=%s\n' "$(date -Iseconds)" "${1:-unbekannt}" "${FINGERPRINT:-unbekannt}" "$restored" > "$BASE/state-owner-restore.ok"
  echo "OK   Probe vermerkt in $BASE/state-owner-restore.ok"
fi
echo "OK   Wiederherstellung in isolierter Testdatenbank gelungen; Testdatenbank wird entfernt"
