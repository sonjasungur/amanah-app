#!/usr/bin/env bash
# Read-only preflight for variant B (docs 29 §4): run on the server before touching DNS-dependent
# steps or the shared Caddy. Changes nothing.
#
#   scripts/staging-domain-preflight.sh staging.amanahordner.de
#   Optional: EXPECT_IPV4=167.233.152.17 EXPECT_IPV6=2a01:4f8:1c16:2102::1 CADDY_CONTAINER=gemeinsam1-prod-caddy
#             CADDYFILE=/opt/gemeinsam1/deploy/Caddyfile
set -uo pipefail

HOST="${1:-}"
[[ "$HOST" =~ ^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$ ]] || { echo "usage: $0 <staging host name>" >&2; exit 2; }
EXPECT_IPV4="${EXPECT_IPV4:-167.233.152.17}"
EXPECT_IPV6="${EXPECT_IPV6:-2a01:4f8:1c16:2102::1}"
CADDY="${CADDY_CONTAINER:-gemeinsam1-prod-caddy}"
CADDYFILE="${CADDYFILE:-/opt/gemeinsam1/deploy/Caddyfile}"
FAILED=0
ok() { echo "OK   $1"; }
bad() { echo "FAIL $1"; FAILED=1; }
info() { echo "INFO $1"; }

zone="${HOST#*.}"
[[ -n "$(dig +short NS "$zone")" ]] && ok "zone $zone has name servers" || bad "zone $zone has no name servers (not registered or not delegated)"
a="$(dig +short A "$HOST" | grep -E '^[0-9.]+$' | sort | tr '\n' ' ')"
[[ "$a" == "$EXPECT_IPV4 " ]] && ok "A $HOST -> $EXPECT_IPV4" || bad "A $HOST is '${a% }', expected $EXPECT_IPV4"
aaaa="$(dig +short AAAA "$HOST" | grep ':' | sort | tr '\n' ' ')"
if [[ -z "$aaaa" ]]; then info "no AAAA record (IPv4 only is fine)"; elif [[ "$aaaa" == "$EXPECT_IPV6 " ]]; then ok "AAAA $HOST -> $EXPECT_IPV6"; else bad "AAAA $HOST is '${aaaa% }', expected $EXPECT_IPV6 or none"; fi
caa="$(dig +short CAA "$zone")"
if [[ -z "$caa" ]] || grep -q 'letsencrypt.org' <<<"$caa"; then ok "CAA allows Let's Encrypt"; else bad "CAA for $zone does not allow letsencrypt.org"; fi

if [[ -f "$CADDYFILE" ]]; then
  grep -qE "^[^#]*\b${HOST//./\\.}\b" "$CADDYFILE" && info "$HOST already appears in $CADDYFILE" || ok "$HOST not yet in $CADDYFILE"
  grep -qE "reverse_proxy +amanah-staging-app" "$CADDYFILE" && info "a staging upstream already exists in $CADDYFILE" || true
else
  bad "Caddyfile $CADDYFILE not found"
fi
if docker inspect "$CADDY" >/dev/null 2>&1; then
  ok "Caddy container $CADDY running ($(docker exec "$CADDY" caddy version 2>/dev/null | cut -d' ' -f1))"
  docker inspect "$CADDY" --format '{{range $k, $v := .NetworkSettings.Networks}}{{$k}} {{end}}' | grep -qw amanah_staging_proxy \
    && info "Caddy is connected to amanah_staging_proxy" || info "Caddy not yet connected to amanah_staging_proxy (step 3)"
else
  bad "Caddy container $CADDY not found"
fi
if docker network inspect amanah_staging_proxy >/dev/null 2>&1; then
  [[ "$(docker network inspect amanah_staging_proxy --format '{{.Internal}}')" == "true" ]] && ok "amanah_staging_proxy is internal" || bad "amanah_staging_proxy is NOT internal"
  members="$(docker network inspect amanah_staging_proxy --format '{{range .Containers}}{{.Name}} {{end}}')"
  extra="$(tr ' ' '\n' <<<"$members" | grep -vE "^(amanah-staging-app|$CADDY)?$" || true)"
  [[ -z "$extra" ]] && ok "proxy network members: ${members:-none}" || bad "unexpected containers on amanah_staging_proxy: $extra"
else
  info "network amanah_staging_proxy not created yet (step 2)"
fi
ss -ltn | grep -qE ':80 ' && ok "port 80 listening (ACME HTTP challenge)" || bad "nothing listening on port 80"
exit "$FAILED"
