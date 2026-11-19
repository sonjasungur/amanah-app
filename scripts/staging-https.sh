#!/usr/bin/env bash
# Protected HTTPS access to staging for tests on real phones (docs/strategy/43). Runs on the server.
# The block is complete, password included, before Caddy learns the host name: there is no moment
# without protection. No path is exempt. The password stays in a root-only file and is never printed.
#
#   staging-https.sh enable <host>   DNS check, staging base URL, proxy network, shared Caddy, checks
#   staging-https.sh disable         removes the block, back to loopback only
#   staging-https.sh status
#   staging-https.sh probe-up        throwaway Caddy on 127.0.0.1:3443 with its own certificate;
#   staging-https.sh probe-check     does not touch the shared Caddy
#   staging-https.sh probe-down
set -euo pipefail
ROOT="${STAGING_ROOT:-/opt/amanah-staging}"
CADDY="${CADDY_CONTAINER:-gemeinsam1-prod-caddy}"
CADDYFILE="${CADDYFILE:-/opt/gemeinsam1/deploy/Caddyfile}"
NET=amanah_staging_proxy
ACCESS="$ROOT/state/https-access"
ENVF="$ROOT/.env.staging"
BEGIN='# BEGIN amanah-staging-https'; END='# END amanah-staging-https'
PROBE_C=amanah-https-probe; PROBE_HOST=staging-probe.test.invalid; PROBE_PORT=3443; PROBE_F=/dev/shm/amanah-https-probe.Caddyfile

compose() { ( cd "$ROOT" && docker compose -f docker-compose.staging.yml -f docker-compose.staging.proxy.yml --env-file .env.staging "$@" </dev/null ); }
env_get() { grep -m1 "^$1=" "$ENVF" | cut -d= -f2-; }

# Creates the access file once; prints only the bcrypt hash for the Caddy block.
access_hash() { # caddy-container
  umask 077
  if [ ! -f "$ACCESS" ]; then
    printf 'user=tester\npassword=%s\n' "$(openssl rand -base64 18 | tr '+/' '-_')" > "$ACCESS"
  fi
  local pw; pw="$(grep -m1 '^password=' "$ACCESS" | cut -d= -f2-)"
  printf '%s\n%s\n' "$pw" "$pw" | docker exec -i "$1" caddy hash-password | tail -1
}

site_block() { # host hash extra-line
  cat <<B
$BEGIN
$1 {
	$3
	basic_auth {
		tester $2
	}
	@internal path /intern /intern/* /wissen/redaktion /wissen/redaktion/* /brand-review /brand-review/*
	respond @internal 404
	encode gzip
	reverse_proxy amanah-staging-app:3000
	header {
		Strict-Transport-Security "max-age=31536000"
		X-Robots-Tag "noindex, nofollow"
		-Server
	}
}
$END
B
}

# Always the host file, through stdin. The container's mount still shows an older file with the closed
# production route (other inode, doc 41 §2): loading /etc/caddy/Caddyfile would reopen that route.
caddy_reload_host_file() {
  docker exec -i "$CADDY" caddy reload --config /dev/stdin --adapter caddyfile < "$CADDYFILE" >/dev/null 2>&1 || return 1
  if docker exec "$CADDY" wget -qO- http://127.0.0.1:2019/config/ </dev/null 2>/dev/null | grep -qE 'amanah-app:3000|amanahordner'; then
    echo "FAIL Produktionsroute in der laufenden Konfiguration"
    return 1
  fi
}

# Points staging at the public address. Remembers only these two lines: a copy of the whole file
# would bring back everything else as it was then, such as the release.
set_base_url() {
  [ -f "$ROOT/rollback/base-url.vor-https" ] || grep -E '^(AMANAH_PUBLIC_BASE_URL|NEXT_PUBLIC_SITE_URL)=' "$ENVF" > "$ROOT/rollback/base-url.vor-https"
  grep -vE '^(AMANAH_PUBLIC_BASE_URL|NEXT_PUBLIC_SITE_URL)=' "$ENVF" > "$ENVF.new"
  printf 'AMANAH_PUBLIC_BASE_URL=%s\nNEXT_PUBLIC_SITE_URL=%s\n' "$1" "$1" >> "$ENVF.new"
  chmod --reference="$ENVF" "$ENVF.new"; mv "$ENVF.new" "$ENVF"
}
restore_base_url() {
  [ -f "$ROOT/rollback/base-url.vor-https" ] || return 0
  grep -vE '^(AMANAH_PUBLIC_BASE_URL|NEXT_PUBLIC_SITE_URL)=' "$ENVF" > "$ENVF.new"
  cat "$ROOT/rollback/base-url.vor-https" >> "$ENVF.new"
  chmod --reference="$ENVF" "$ENVF.new"; mv "$ENVF.new" "$ENVF"
  rm -f "$ROOT/rollback/base-url.vor-https"
}
app_up() { compose up -d --no-deps app; for _ in $(seq 1 60); do [ "$(docker inspect amanah-staging-app --format '{{.State.Health.Status}}' </dev/null)" = healthy ] && return 0; sleep 2; done; echo "FAIL Staging-App wird nicht gesund"; return 1; }

curl_auth() { # curl args; credentials through a config on stdin, never on the command line
  local pw; pw="$(grep -m1 '^password=' "$ACCESS" | cut -d= -f2-)"
  printf 'user = "tester:%s"\n' "$pw" | curl -sS -K - "$@"
}

check_access() { # base-url, extra curl args...
  local base="$1" failed=0 code; shift
  for p in / /register /api/health /api/dev/outbox /api/auth/me /api/billing/webhook /dashboard; do
    code="$(curl -sS -o /dev/null -m 15 -w '%{http_code}' "$@" "$base$p" || true)"
    if [ "$code" = 401 ]; then echo "OK   ohne Passwort 401: $p"; else echo "FAIL ohne Passwort $code: $p"; failed=1; fi
  done
  code="$(printf 'user = "tester:falsch"\n' | curl -sS -K - -o /dev/null -m 15 -w '%{http_code}' "$@" "$base/" || true)"
  if [ "$code" = 401 ]; then echo "OK   falsches Passwort 401"; else echo "FAIL falsches Passwort $code"; failed=1; fi
  code="$(curl_auth -o /dev/null -m 15 -w '%{http_code}' "$@" "$base/api/health" || true)"
  if [ "$code" = 200 ]; then echo "OK   mit Passwort 200"; else echo "FAIL mit Passwort $code"; failed=1; fi
  code="$(curl_auth -o /dev/null -m 15 -w '%{http_code}' "$@" "$base/brand-review" || true)"
  if [ "$code" = 404 ]; then echo "OK   interne Seiten 404"; else echo "FAIL interne Seite $code"; failed=1; fi
  if curl_auth -o /dev/null -D - -m 15 "$@" "$base/" | grep -qi '^x-robots-tag: noindex'; then echo "OK   noindex"; else echo "FAIL noindex fehlt"; failed=1; fi
  return "$failed"
}

# The probe has its own throwaway password, so testing never touches the real one.
case "${1:-}" in probe-*) ACCESS=/dev/shm/amanah-https-probe.access ;; esac

case "${1:-}" in
  enable)
    HOST="${2:-}"
    [[ "$HOST" =~ ^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$ ]] || { echo "Aufruf: $0 enable <host>" >&2; exit 2; }
    grep -qF "$BEGIN" "$CADDYFILE" && { echo "Block ist schon eingetragen." >&2; exit 1; }
    "$ROOT/scripts/staging-domain-preflight.sh" "$HOST"
    other_before="$(curl -sS -m 15 https://gemeinsam1.com/ | wc -c)"
    hash="$(access_hash "$CADDY")"
    [[ "$hash" == \$2* ]] || { echo "FAIL Passwort-Hash"; exit 1; }
    set_base_url "https://$HOST"
    app_up
    docker inspect "$CADDY" --format '{{json .NetworkSettings.Networks}}' </dev/null | grep -q "\"$NET\"" || docker network connect "$NET" "$CADDY" </dev/null
    new="$(mktemp)"; cat "$CADDYFILE" > "$new"; { echo; site_block "$HOST" "$hash" "# staging only, synthetic data"; } >> "$new"
    docker cp "$new" "$CADDY:/tmp/Caddyfile.new" </dev/null >/dev/null
    docker exec "$CADDY" caddy validate --adapter caddyfile --config /tmp/Caddyfile.new </dev/null >/dev/null 2>&1 || { rm -f "$new"; echo "FAIL Caddyfile ungueltig, nichts eingespielt"; exit 1; }
    cp -p "$CADDYFILE" "$ROOT/rollback/Caddyfile.vor-https"
    # A bind-mounted single file: write in place. A failed reload keeps the running configuration.
    cat "$new" > "$CADDYFILE"; rm -f "$new"
    caddy_reload_host_file || { cat "$ROOT/rollback/Caddyfile.vor-https" > "$CADDYFILE"; caddy_reload_host_file; echo "FAIL Reload, Datei zurueckgesetzt"; exit 1; }
    echo "Warte auf das Zertifikat ..."
    for _ in $(seq 1 30); do [ "$(curl -sS -o /dev/null -m 5 -w '%{http_code}' "https://$HOST/" 2>/dev/null || true)" = 401 ] && break; sleep 5; done
    check_access "https://$HOST"
    [ "$(curl -sS -m 15 https://gemeinsam1.com/ | wc -c)" = "$other_before" ] && echo "OK   gemeinsam1 unveraendert" || echo "FAIL gemeinsam1 antwortet anders"
    echo "Testlink: https://$HOST"
    echo "Zugang:   ssh gemeinsam1-prod cat $ACCESS"
    ;;
  disable)
    if grep -qF "$BEGIN" "$CADDYFILE"; then
      new="$(mktemp)"; sed "/^$BEGIN\$/,/^$END\$/d" "$CADDYFILE" > "$new"; cat "$new" > "$CADDYFILE"; rm -f "$new"
      caddy_reload_host_file && echo "OK   Block entfernt"
    fi
    docker network disconnect "$NET" "$CADDY" </dev/null 2>/dev/null || true
    restore_base_url; app_up || exit 1; echo "OK   Staging wieder nur ueber 127.0.0.1"
    ;;
  status)
    grep -A1 -F "$BEGIN" "$CADDYFILE" | tail -1 | cut -d' ' -f1 | grep . || echo "Kein HTTPS-Zugang eingetragen."
    docker network inspect "$NET" --format 'Netz: {{range .Containers}}{{.Name}} {{end}}' </dev/null 2>/dev/null || echo "Netz: fehlt"
    ;;
  probe-up)
    docker rm -f "$PROBE_C" >/dev/null 2>&1 </dev/null || true
    umask 077
    hash="$(access_hash "$CADDY")"
    { printf '{\n\tauto_https disable_redirects\n}\n'; site_block "$PROBE_HOST:443" "$hash" "tls internal"; } > "$PROBE_F"; chmod 644 "$PROBE_F"
    set_base_url "https://$PROBE_HOST:$PROBE_PORT"; app_up
    # An internal network cannot publish a port, so the probe starts on the default bridge and joins it after.
    docker run -d --name "$PROBE_C" --memory 128m -p "127.0.0.1:$PROBE_PORT:443" -v "$PROBE_F:/etc/caddy/Caddyfile:ro" caddy:2-alpine >/dev/null </dev/null
    docker network connect "$NET" "$PROBE_C" </dev/null
    up=""; for _ in $(seq 1 20); do curl -sk -o /dev/null -m 2 --resolve "$PROBE_HOST:$PROBE_PORT:127.0.0.1" "https://$PROBE_HOST:$PROBE_PORT/" && { up=1; break; }; sleep 1; done
    [ -n "$up" ] && echo "OK   Probe-Caddy laeuft" || { echo "FAIL Probe-Caddy antwortet nicht"; exit 1; }
    ;;
  probe-check)
    check_access "https://$PROBE_HOST:$PROBE_PORT" -k --resolve "$PROBE_HOST:$PROBE_PORT:127.0.0.1"
    ;;
  probe-down)
    docker rm -f "$PROBE_C" >/dev/null 2>&1 </dev/null || true
    rm -f "$PROBE_F" "$ACCESS"; restore_base_url; app_up || exit 1; echo "OK   Probe entfernt, Staging-Adresse wie vorher"
    ;;
  *) sed -n 2,11p "$0" | sed 's/^# \{0,1\}//'; exit 2 ;;
esac
