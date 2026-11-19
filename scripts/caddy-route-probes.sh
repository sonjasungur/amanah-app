#!/usr/bin/env bash
# Isolated probes of the route policy, on the server. Each sample is only translated to JSON with `caddy adapt`
# in a throwaway container without network, using the image of the real proxy. Nothing is loaded or started,
# so no sample route is ever active. Prints no configuration values. Exit 0 if every verdict is as expected.
set -uo pipefail
CADDY="${CADDY_CONTAINER:-gemeinsam1-prod-caddy}"
CADDYFILE="${CADDYFILE:-/opt/gemeinsam1/deploy/Caddyfile}"
POLICY="${ROUTE_POLICY:-$(dirname "$(readlink -f "$0")")/caddy-route-policy.py}"
BEGIN='# BEGIN amanah-staging-https'; END='# END amanah-staging-https'
IMAGE="$(docker inspect "$CADDY" --format '{{.Image}}')"
failed=0

base() { sed "/^$BEGIN\$/,/^$END\$/d" "$CADDYFILE"; }
staging() { sed -n "/^$BEGIN\$/,/^$END\$/p" "$CADDYFILE"; }
adapt() { docker run --rm -i --network none --memory 128m "$IMAGE" caddy adapt --config /dev/stdin --adapter caddyfile 2>/dev/null; }

probe() { # name expected(ok|reject) ; sample on stdin
  local verdict result
  result="$(adapt | python3 "$POLICY" 2>/dev/null)"
  if [ "$result" = ok ]; then verdict=ok; else verdict=reject; fi
  if [ "$verdict" = "$2" ]; then echo "OK   $1: $result"; else echo "FAIL $1: erwartet $2, Ergebnis ${result:-leer}"; failed=1; fi
}

staging | grep -q 'reverse_proxy amanah-staging-app:3000' || { echo "FAIL kein Staging-Block in der Vorlage"; exit 1; }

{ base; staging; } | probe "erlaubt: Gemeinsam1 und geschuetztes Staging" ok
base | probe "erlaubt: Gemeinsam1 ohne Staging" ok
{ base; staging; printf 'amanahordner.de {\n\treverse_proxy amanah-app:3000\n}\n'; } | probe "zusaetzliche Produktionsroute" reject
{ base; staging; printf 'www.amanahordner.de {\n\tredir https://amanahordner.de{uri} permanent\n}\n'; } | probe "Weiterleitung der alten Domain" reject
{ base; staging | sed 's/reverse_proxy amanah-staging-app:3000/reverse_proxy amanah-app:3000/'; } | probe "Staging-Host auf Produktions-App" reject
{ base; staging | sed 's/reverse_proxy amanah-staging-app:3000/reverse_proxy 10.0.0.5:3000/'; } | probe "Staging-Host auf fremde Adresse" reject
{ base; staging | sed '/basic_auth {/,/}/d'; } | probe "Staging ohne Passwort" reject
{ base; staging; printf 'offen.example.org {\n\treverse_proxy amanah-staging-app:3000\n}\n'; } | probe "fremder Host auf Staging-Upstream" reject
{ base; staging; printf 'offen.example.org {\n\treverse_proxy host.docker.internal:3001\n}\n'; } | probe "fremder Host auf Produktions-Port" reject
docker exec "$CADDY" cat /etc/caddy/Caddyfile 2>/dev/null | grep -q amanahordner \
  && { docker exec "$CADDY" cat /etc/caddy/Caddyfile | probe "echte Altdatei im Container (Vorfall 03.11.)" reject; } \
  || echo "OK   Altdatei im Container nicht mehr vorhanden"
result="$(printf '' | python3 "$POLICY" 2>/dev/null)"
if [ "$result" = config-unreadable ]; then echo "OK   leere Antwort gilt als Fehler: $result"; else echo "FAIL leere Antwort: ${result:-leer}"; failed=1; fi
exit "$failed"
