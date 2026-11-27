#!/usr/bin/env bash
# The way to another app image, also for going back. The check is part of it: an incompatible image
# stops before anything changes. Checks what compose would really start, not what someone meant.
#
#   rollback-app.sh --compose <file> [--compose <file>] --env-file <file> [--apply]
#
# Without --apply it only checks. The target comes from the compose files, for example
#   AMANAH_RELEASE_IMAGE=amanah-app-app@sha256:… rollback-app.sh --compose docker-compose.release.yml --env-file release/.env.production.next
# Containers: APP_CONTAINER (default amanah-app), DB_CONTAINER (default amanah-postgres).
#
# Exit 0 allowed or done, 1 refused, 2 unknown (nothing changed), 3 started but not healthy.
# Prints counts and image names only. Docs: docs/release/produktionsplan.md "Wiederherstellung".
set -u
APP_CONTAINER="${APP_CONTAINER:-amanah-app}"; DB_CONTAINER="${DB_CONTAINER:-amanah-postgres}"
FILES=(); ENVF=; APPLY=0
while [ $# -gt 0 ]; do
  case "$1" in
    --compose) FILES+=(-f "$2"); shift 2 ;;
    --env-file) ENVF="$2"; shift 2 ;;
    --apply) APPLY=1; shift ;;
    *) echo "UNBEKANNT: Argument $1"; exit 2 ;;
  esac
done
{ [ "${#FILES[@]}" -gt 0 ] && [ -f "$ENVF" ]; } || { echo "UNBEKANNT: --compose und eine vorhandene --env-file sind Pflicht."; exit 2; }
compose() { docker compose "${FILES[@]}" --env-file "$ENVF" "$@" </dev/null; }

encrypted_rows() {
  local user db n
  user="$(grep -m1 '^POSTGRES_USER=' "$ENVF" | cut -d= -f2-)"; db="$(grep -m1 '^POSTGRES_DB=' "$ENVF" | cut -d= -f2-)"
  n="$(docker exec "$DB_CONTAINER" psql -X -At -U "${user:-amanah}" -d "${db:-amanah}" -c "SELECT count(*) FROM amanah_data WHERE data ? '\$enc'" 2>/dev/null </dev/null)"
  [[ "$n" =~ ^[0-9]+$ ]] || return 1
  echo "$n"
}

# As JSON: "config --images" lists the images of every service, whatever is asked for.
TARGET="$(compose config --format json 2>/dev/null | python3 -c 'import json,sys; print(json.load(sys.stdin)["services"]["app"]["image"])' 2>/dev/null)"
[ -n "$TARGET" ] || { echo "UNBEKANNT: Compose nennt kein Ziel-Image."; exit 2; }
docker image inspect "$TARGET" >/dev/null 2>&1 </dev/null || { echo "UNBEKANNT: Image fehlt auf diesem Host: $TARGET"; exit 2; }
ROWS="$(encrypted_rows)" || { echo "UNBEKANNT: Zaehlung fehlgeschlagen. Kein Wechsel ohne Klaerung."; exit 2; }
echo "Ziel: $TARGET"
echo "Verschluesselte Zeilen: $ROWS"

# Both marks in the built server code: it can open envelopes and refuses to write over unreadable rows.
understands_data() {
  docker run --rm --network none --entrypoint sh "$TARGET" -c 'grep -rlq "amanah-aes256gcm-v1" .next/server && grep -rlq "folder_unreadable" .next/server' >/dev/null 2>&1 </dev/null
}
refuse_image() {
  echo "ABGEBROCHEN: Dieses Image kann verschluesselte Daten nicht sicher behandeln. Es wuerde leere Ordner zeigen oder Daten ueberschreiben."
  echo "Stattdessen: kompatibles Image, oder vollstaendiger Restore mit passendem Image und Schluessel (docs/release/produktionsplan.md)."
}

if [ "$ROWS" -gt 0 ]; then
  understands_data || { refuse_image; exit 1; }
  echo "Image: kann verschluesselte Daten behandeln"
  # A dry run in the target image with the target configuration opens every row, writes nothing.
  if ! compose run --rm --no-deps -T --entrypoint node app scripts/reencrypt-amanah-data.mjs; then
    echo "ABGEBROCHEN: Mit diesem Image und dieser Konfiguration lassen sich nicht alle Zeilen oeffnen. Schluessel pruefen."
    exit 1
  fi
fi
# Images that know the key reference refuse folder access without a valid one: find out now, not after the start.
if docker run --rm --network none --entrypoint sh "$TARGET" -c 'test -f scripts/key-reference.mjs' >/dev/null 2>&1 </dev/null; then
  if ! compose run --rm --no-deps -T --entrypoint node app scripts/key-reference.mjs check; then
    echo "ABGEBROCHEN: Die Schluesselreferenz passt nicht zu dieser Konfiguration (docs/release/produktionsplan.md)."
    exit 1
  fi
fi
echo "ERLAUBT"
[ "$APPLY" = 1 ] || exit 0

# The running app could have written since the count: count again with the app stopped.
docker stop "$APP_CONTAINER" >/dev/null </dev/null
AFTER="$(encrypted_rows)" || { docker start "$APP_CONTAINER" >/dev/null </dev/null; echo "UNBEKANNT: Zaehlung fehlgeschlagen, alte App laeuft wieder."; exit 2; }
if [ "$AFTER" -gt 0 ] && [ "$ROWS" -eq 0 ] && ! understands_data; then
  docker start "$APP_CONTAINER" >/dev/null </dev/null
  refuse_image
  exit 1
fi
compose up -d --no-deps --no-build app || { echo "FEHLER: Start fehlgeschlagen."; exit 3; }
for _ in $(seq 1 "${HEALTH_TRIES:-60}"); do
  [ "$(docker inspect "$APP_CONTAINER" --format '{{.State.Health.Status}}' 2>/dev/null </dev/null)" = healthy ] && { echo "GESUND: $TARGET"; exit 0; }
  sleep "${HEALTH_WAIT:-2}"
done
echo "FEHLER: App wird nicht gesund."
exit 3
