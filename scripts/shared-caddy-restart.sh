#!/usr/bin/env bash
# Planned restart of the shared Caddy (gemeinsam1 and amanah staging), so that the container loads the host
# file again (docs/strategy/45 §4.2). `docker restart` keeps networks, volumes and certificates; `compose up`
# would recreate the container and drop the staging network, so it is not used here.
#
#   shared-caddy-restart.sh prepare   read-only checks and a backup of the working configuration
#   shared-caddy-restart.sh run       needs CONFIRM_SHARED_RESTART=yes; only after the owner's go
#   shared-caddy-restart.sh verify    state after the restart, changes nothing
set -uo pipefail
ROOT="${STAGING_ROOT:-/opt/amanah-staging}"
CADDY="${CADDY_CONTAINER:-gemeinsam1-prod-caddy}"
CADDYFILE="${CADDYFILE:-/opt/gemeinsam1/deploy/Caddyfile}"
POLICY="${ROUTE_POLICY:-/opt/amanah-prod/caddy-route-policy.py}"
ACCESS="$ROOT/state/https-access"
STAGING_NET=amanah_staging_proxy
STAGING_HOST=amanah-test.mscisystems.com
failed=0
ok() { echo "OK   $1"; }
bad() { echo "FAIL $1"; failed=1; }
expect() { if [ "$2" = "$3" ]; then ok "$1"; else bad "$1 ($2)"; fi; }
running() { docker exec "$CADDY" wget -qO- http://127.0.0.1:2019/config/ 2>/dev/null; }
code() { curl -sS -o /dev/null -m 15 -w '%{http_code}' "$@" 2>/dev/null; }
code_auth() { printf 'user = "tester:%s"\n' "$(grep -m1 '^password=' "$ACCESS" | cut -d= -f2-)" | curl -sS -K - -o /dev/null -m 15 -w '%{http_code}' "$@" 2>/dev/null; }

config_checks() {
  local adapted result
  expect "Start laedt die Datei im Mount" "$(docker inspect "$CADDY" --format '{{json .Config.Cmd}}')" '["caddy","run","--config","/etc/caddy/Caddyfile","--adapter","caddyfile"]'
  expect "Mount kommt von der Host-Datei" "$(docker inspect "$CADDY" --format '{{range .Mounts}}{{if eq .Destination "/etc/caddy/Caddyfile"}}{{.Source}}{{end}}{{end}}')" "$CADDYFILE"
  docker exec -i "$CADDY" caddy adapt --config /dev/stdin --adapter caddyfile --validate < "$CADDYFILE" >/dev/null 2>&1 && ok "Host-Datei gueltig" || bad "Host-Datei ungueltig"
  adapted="$(docker exec -i "$CADDY" caddy adapt --config /dev/stdin --adapter caddyfile < "$CADDYFILE" 2>/dev/null)"
  result="$(printf '%s' "$adapted" | python3 "$POLICY" 2>/dev/null)"; expect "Host-Datei erfuellt die Routenregel" "$result" ok
  result="$(running | python3 "$POLICY" 2>/dev/null)"; expect "laufende Konfiguration erfuellt die Routenregel" "$result" ok
  [ -n "$adapted" ] && [ "$(printf '%s' "$adapted" | jq -S .)" = "$(running | jq -S .)" ] && ok "laufende Konfiguration gleich Host-Datei" || bad "laufende Konfiguration weicht von der Host-Datei ab"
}

service_checks() {
  expect "gemeinsam1.com" "$(code https://gemeinsam1.com/)" 200
  expect "www leitet weiter" "$(code https://www.gemeinsam1.com/)" 301
  expect "api.gemeinsam1.com" "$(code https://api.gemeinsam1.com/health)" 200
  expect "Staging ohne Passwort" "$(code "https://$STAGING_HOST/")" 401
  expect "Staging mit Passwort" "$(code_auth "https://$STAGING_HOST/api/health")" 200
  expect "alte Domain ohne Route" "$(curl -sk -o /dev/null -m 10 -w '%{http_code}' --resolve amanahordner.de:443:127.0.0.1 https://amanahordner.de/ 2>/dev/null)" 000
  docker inspect "$CADDY" --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}' | grep -qw "$STAGING_NET" && ok "Staging-Netz verbunden" || bad "Staging-Netz fehlt"
}

case "${1:-}" in
  prepare)
    dir="$ROOT/rollback/caddy-$(date +%Y%m%d-%H%M%S)"; umask 077; mkdir -p "$dir"
    cp -p "$CADDYFILE" "$dir/Caddyfile.host"
    running > "$dir/laufend.json"
    docker exec "$CADDY" cat /etc/caddy/Caddyfile > "$dir/Caddyfile.altdatei-nicht-laden"
    docker inspect "$CADDY" > "$dir/container.json"
    [ -s "$dir/laufend.json" ] && [ -s "$dir/Caddyfile.host" ] && ok "Sicherung $dir" || bad "Sicherung unvollstaendig"
    config_checks
    service_checks
    exit "$failed"
    ;;
  run)
    [ "${CONFIRM_SHARED_RESTART:-}" = yes ] || { echo "Abbruch: Neustart nur nach Owner-Freigabe mit CONFIRM_SHARED_RESTART=yes." >&2; exit 2; }
    config_checks
    [ "$failed" = 0 ] || { echo "Abbruch vor dem Neustart, nichts geaendert." >&2; exit 1; }
    start="$(date +%s.%N)"
    docker restart -t 5 "$CADDY" >/dev/null || { echo "FAIL docker restart"; exit 1; }
    up=""; for _ in $(seq 1 120); do [ "$(curl -sS -o /dev/null -m 2 -w '%{http_code}' https://gemeinsam1.com/ 2>/dev/null)" = 200 ] && { up=1; break; }; sleep 0.25; done
    echo "Dauer bis gemeinsam1.com wieder antwortet: $(python3 -c "import time;print(round(time.time()-$start,1))") s"
    [ -n "$up" ] || { echo "FAIL gemeinsam1.com antwortet nicht. Der Container nutzt die Sicherung nicht von selbst; Log pruefen, /etc/caddy/Caddyfile nicht von Hand laden."; exit 1; }
    "$0" verify; exit $?
    ;;
  verify)
    expect "Container sieht die Host-Datei" "$(docker exec "$CADDY" cat /etc/caddy/Caddyfile 2>/dev/null | sha256sum)" "$(sha256sum < "$CADDYFILE")"
    config_checks
    service_checks
    exit "$failed"
    ;;
  *) sed -n 2,8p "$0" | sed 's/^# \{0,1\}//'; exit 2 ;;
esac
