#!/usr/bin/env bash
# What happens to encrypted folder data when the app image changes after the migration?
# Runs on a Docker host with both images. Own database in memory, own networks, synthetic account,
# throwaway keys. Prints what it observes; exits 1 only when the probe itself cannot run.
#
#   rollback-encryption-probe.sh <old-image> <new-image> <prisma-migrations-dir>
set -u
OLD="$1"; NEW="$2"; MIG="$3"
N=amanah-rbp-net; PUB=amanah-rbp-pub; DB=amanah-rbp-pg; APP=amanah-rbp-app; PORT=3203
API="http://127.0.0.1:$PORT"; URL="postgresql://test:testonly@$DB:5432/rbp"
FIRST=20260705105925_init
S1=$(openssl rand -hex 32); S2=$(openssl rand -hex 32); W=$(openssl rand -hex 16)
K=$(openssl rand -base64 32); WRONG=$(openssl rand -base64 32); EM="rbp-$(date +%s)@test.invalid"; PW=probe-test-1
DUMP=/dev/shm/.rbp.sql
cleanup() { docker rm -f "$APP" "$DB" >/dev/null 2>&1 </dev/null; docker network rm "$N" "$PUB" >/dev/null 2>&1 </dev/null; rm -f "$DUMP"; }
trap cleanup EXIT
die() { echo "PROBE ABGEBROCHEN: $1"; exit 1; }
q() { docker exec "$DB" psql -X -At -U test -d rbp -c "$1" </dev/null; }

app() { # image key(or empty)
  docker rm -f "$APP" >/dev/null 2>&1 </dev/null
  local keys=(); [ -n "$2" ] && keys=(-e "AMANAH_DATA_KEYS=t:$2" -e AMANAH_DATA_KEY_ACTIVE=t)
  docker run -d --name "$APP" --network "$PUB" --memory 512m --cpus 1 -p "127.0.0.1:$PORT:3000" \
    -e NODE_ENV=production -e "DATABASE_URL=$URL" -e AMANAH_SERVER_STORAGE=postgres -e AMANAH_DEPLOYMENT_ENV=staging \
    -e AMANAH_AI_ENABLED=false -e AMANAH_AI_PROVIDER=rules -e AI_PROVIDER=rules -e "SESSION_SECRET=$S1" -e "AUTH_SECRET=$S2" \
    "${keys[@]}" -e AMANAH_DATA_ENCRYPTION=required -e AMANAH_COOKIE_SECURE=false \
    -e AMANAH_MAIL_TRANSPORT=outbox -e AMANAH_DEV_OUTBOX=true -e AMANAH_PUBLIC_REGISTRATION_ENABLED=true \
    -e AMANAH_REGISTRATION_ALLOWED_DOMAINS=test.invalid -e "AMANAH_PUBLIC_BASE_URL=$API" \
    -e AMANAH_BILLING_MODE=sandbox -e "AMANAH_SANDBOX_WEBHOOK_SECRET=$W" -e OPENAI_API_KEY= "$1" >/dev/null </dev/null || return 1
  docker network connect "$N" "$APP" </dev/null
  for _ in $(seq 1 60); do curl -s -o /dev/null -m 2 "$API/" && return 0; sleep 1; done
  return 1
}
# The old image answers with a bearer token, the candidate with a session cookie: send whichever exists.
auth() { A=(-b "$JAR" -H "Origin: $API"); [ -n "$TOK" ] && A+=(-H "Authorization: Bearer $TOK"); return 0; }
login() { rm -f "$JAR"; curl -s -m 15 -c "$JAR" -o "$F.login" -w '%{http_code}' -H "Origin: $API" -H 'Content-Type: application/json' -d "{\"email\":\"$EM\",\"password\":\"$PW\"}" "$API/api/auth/login"; }
login_() { LOGIN=$(login); TOK=$(python3 -c 'import json,sys;print(json.load(open(sys.argv[1])).get("session",{}).get("token",""))' "$F.login" 2>/dev/null); }
get_status() { auth; curl -s -m 15 -o "$1" -w '%{http_code}' "${A[@]}" "$API/api/amanah"; }
name_of() { python3 -c 'import json,sys;print(json.load(open(sys.argv[1])).get("data",{}).get("emergencyCard",{}).get("name","<leer>"))' "$1" 2>/dev/null || echo "<keine Daten>"; }
put_name() { # file name: writes the whole folder back, as the client does
  python3 -c 'import json,sys;d=json.load(open(sys.argv[1]))["data"];d.setdefault("emergencyCard",{})["name"]=sys.argv[2];json.dump(d,open(sys.argv[1]+".put","w"))' "$1" "$2"
  auth; curl -s -m 15 -o /dev/null -w '%{http_code}' -X PUT "${A[@]}" -H 'Content-Type: application/json' -d @"$1.put" "$API/api/amanah"
}
is_enc() { q "SELECT count(*) FROM amanah_data WHERE data ? '\$enc'"; }
row_md5() { q "SELECT md5(data::text) FROM amanah_data"; }
restore_ref() { docker rm -f "$APP" >/dev/null 2>&1 </dev/null
  docker exec "$DB" psql -q -U test -d postgres -c 'DROP DATABASE rbp WITH (FORCE)' -c 'CREATE DATABASE rbp' </dev/null
  docker exec -i "$DB" psql -q -U test -d rbp -v ON_ERROR_STOP=1 < "$DUMP" >/dev/null || die "Restore"; }
F=$(mktemp); JAR="$F.jar"; TOK=; trap 'cleanup; rm -f "$F" "$F.put" "$F.login" "$JAR"' EXIT

docker network create --internal "$N" >/dev/null </dev/null || die "Netz"
docker network create "$PUB" >/dev/null </dev/null || die "Netz"
docker run -d --rm --name "$DB" --network "$N" --memory 256m --cpus 0.5 -e POSTGRES_USER=test -e POSTGRES_PASSWORD=testonly -e POSTGRES_DB=rbp --tmpfs /var/lib/postgresql/data postgres:16-alpine >/dev/null </dev/null || die "Datenbank"
for _ in $(seq 1 30); do docker exec "$DB" pg_isready -U test -d rbp >/dev/null 2>&1 </dev/null && break; sleep 1; done; sleep 2
docker exec -i "$DB" psql -q -U test -d rbp -v ON_ERROR_STOP=1 < "$MIG/$FIRST/migration.sql" >/dev/null || die "Migration 1"

echo "== 1 Produktionsstand: altes Image, Stand 1, Klartextzeile"
app "$OLD" "" || die "altes Image startet nicht"
TOK=$(curl -s -m 15 -H 'Content-Type: application/json' -d "{\"email\":\"$EM\",\"password\":\"$PW\",\"name\":\"Probe\"}" "$API/api/auth/register" | python3 -c 'import json,sys;print(json.load(sys.stdin).get("session",{}).get("token",""))')
[ -n "$TOK" ] || die "Registrierung"
get_status "$F" >/dev/null; echo "Schreiben alt: $(put_name "$F" Bestandsdaten); verschluesselte Zeilen: $(is_enc)"

echo "== 2 Migrationen 2 bis 6"
for m in $(ls "$MIG" | grep -v lock | grep -v "$FIRST" | sort); do docker exec -i "$DB" psql -q -U test -d rbp -v ON_ERROR_STOP=1 < "$MIG/$m/migration.sql" >/dev/null || die "Migration $m"; done
q "UPDATE users SET email_verified_at=now()" >/dev/null

echo "== 3 Kandidat mit Schluessel"
app "$NEW" "$K" || die "Kandidat startet nicht"
login_; [ "$LOGIN" = 200 ] || die "Anmeldung Kandidat"
echo "Lesen Klartextzeile: HTTP $(get_status "$F"), Name: $(name_of "$F")"
auth; V=$(curl -s -m 15 "${A[@]}" "$API/api/consent" | python3 -c 'import json,sys;print(json.load(sys.stdin)["definitions"]["sensitive_folder_storage"]["version"])')
curl -s -m 15 -o /dev/null -w 'Einwilligung HTTP %{http_code}\n' "${A[@]}" -H 'Content-Type: application/json' -d "{\"purpose\":\"sensitive_folder_storage\",\"version\":\"$V\",\"confirmed\":true}" "$API/api/consent"
echo "Schreiben: HTTP $(put_name "$F" NachMigration); verschluesselte Zeilen: $(is_enc); Klartext in Zeile: $(q "SELECT count(*) FROM amanah_data WHERE data::text LIKE '%NachMigration%'")"
echo "Lesen: HTTP $(get_status "$F"), Name: $(name_of "$F")"
REF=$(row_md5)
docker exec "$DB" pg_dump -U test -d rbp --no-owner --no-acl > "$DUMP" </dev/null; echo "Backup: $(wc -c <"$DUMP") Bytes"

echo "== 4 Kandidat ohne Schluessel und mit falschem Schluessel"
app "$NEW" "" || echo "startet ohne Schluessel nicht (sicher)"
if curl -s -o /dev/null -m 3 "$API/"; then login_; echo "Anmeldung $LOGIN"; echo "ohne Schluessel: HTTP $(get_status "$F"), Klartext: $(grep -c NachMigration "$F"), Zeile unveraendert: $([ "$(row_md5)" = "$REF" ] && echo ja || echo NEIN)"; fi
if curl -s -o /dev/null -m 3 "$API/"; then echo "Schreiben ohne Schluessel: HTTP $(echo '{"data":{}}' > "$F"; put_name "$F" OhneSchluessel), Zeile unveraendert: $([ "$(row_md5)" = "$REF" ] && echo ja || echo NEIN)"; fi
app "$NEW" "$WRONG" || die "Kandidat falscher Schluessel"
login_; echo "Anmeldung $LOGIN"; echo "falscher Schluessel: HTTP $(get_status "$F"), Klartext: $(grep -c NachMigration "$F"), Zeile unveraendert: $([ "$(row_md5)" = "$REF" ] && echo ja || echo NEIN)"
echo "Schreiben falscher Schluessel: HTTP $(echo '{"data":{}}' > "$F"; put_name "$F" FalscherSchluessel), Zeile unveraendert: $([ "$(row_md5)" = "$REF" ] && echo ja || echo NEIN)"

echo "== 4b Mit richtigem Schluessel nach dem Schreiben unter falschem"
app "$NEW" "$K" || die "Kandidat"
login_; echo "Lesen: HTTP $(get_status "$F"), Name: $(name_of "$F")"

restore_ref # each following scenario starts from the same backup
echo "== 5 Kandidat neu gestartet, gleicher Schluessel"
app "$NEW" "$K" || die "Kandidat"
login_; echo "Anmeldung $LOGIN"; echo "Lesen: HTTP $(get_status "$F"), Name: $(name_of "$F")"

echo "== 6 App-Rollback: altes Image, verschluesselte Zeile"
app "$OLD" "" || die "altes Image"
login_; echo "Anmeldung $LOGIN"
echo "Lesen: HTTP $(get_status "$F"), Name: $(name_of "$F"), Zeile unveraendert: $([ "$(row_md5)" = "$REF" ] && echo ja || echo NEIN)"
echo "Oberste Felder der Antwort mit \$enc: $(python3 -c 'import json,sys;print("$enc" in json.load(open(sys.argv[1])).get("data",{}))' "$F" 2>/dev/null)"
echo "Client speichert zurueck: HTTP $(put_name "$F" NachRollback)"
echo "Klartext jetzt in Zeile: $(q "SELECT count(*) FROM amanah_data WHERE data::text LIKE '%NachRollback%'")"
echo "Danach: verschluesselte Zeilen: $(is_enc); Zeile unveraendert: $([ "$(row_md5)" = "$REF" ] && echo ja || echo NEIN)"

echo "== 7 Wieder Kandidat nach diesem Schreiben"
app "$NEW" "$K" || die "Kandidat"
login_; echo "Anmeldung $LOGIN"; echo "Lesen: HTTP $(get_status "$F"), Name: $(name_of "$F")"

echo "== 8 Vollstaendige Wiederherstellung aus Backup, Kandidat mit Schluessel"
restore_ref
echo "Zeile wie im Backup: $([ "$(row_md5)" = "$REF" ] && echo ja || echo NEIN)"
app "$NEW" "$K" || die "Kandidat"
login_; echo "Anmeldung $LOGIN"; echo "Lesen: HTTP $(get_status "$F"), Name: $(name_of "$F")"
echo "PROBE_ENDE"
