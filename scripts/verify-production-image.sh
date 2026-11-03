#!/usr/bin/env bash
# Read-only check of production: pinned image, health, closed route, network isolation, encrypted
# backup. Prints no configuration values. Exit 0 only if everything fits. Repairs nothing.
set -u
EXPECTED="sha256:f7f29e2ac4ef5db126d3e280f0dc4c01b6108a713d51474fad151684e1858d75"
ROLLBACK="sha256:ec6e55a2bda27dc4e5bbab0031bea3e5df24044fba6bb20a347b7a3037dd4f8e"
BACKUP_DIR="${BACKUP_DIR:-/opt/amanah-prod/backups}"
MAX_BACKUP_AGE_MIN="${MAX_BACKUP_AGE_MIN:-1560}"
CADDY="${CADDY_CONTAINER:-gemeinsam1-prod-caddy}"
CADDYFILE="${CADDYFILE:-/opt/gemeinsam1/deploy/Caddyfile}"
POLICY="${ROUTE_POLICY:-$(dirname "$(readlink -f "$0")")/caddy-route-policy.py}"
failed=0
check() { if [ "$2" = "$3" ]; then echo "OK   $1"; else echo "FAIL $1"; failed=1; fi; }

check "running image is the pinned one" "$(docker inspect amanah-app --format '{{.Image}}' 2>/dev/null)" "$EXPECTED"
check "container is healthy" "$(docker inspect amanah-app --format '{{.State.Health.Status}}' 2>/dev/null)" "healthy"
check "health answers" "$(curl -s -o /dev/null -m 8 -w '%{http_code}' http://127.0.0.1:3001/api/health)" "200"
check "pinned image is present" "$(docker image inspect "$EXPECTED" --format '{{.Id}}' 2>/dev/null)" "$EXPECTED"
check "rollback image is present" "$(docker image inspect "$ROLLBACK" --format '{{.Id}}' 2>/dev/null)" "$ROLLBACK"
# What Caddy runs right now, not what a file says. caddy-route-policy.py allows only the staging host with
# password and upstream, and fails if the configuration cannot be read.
running="$(docker exec "$CADDY" wget -qO- http://127.0.0.1:2019/config/ 2>/dev/null)"
denied="$(docker inspect amanah-app --format '{{range .NetworkSettings.Networks}}{{.IPAddress}} {{end}}' 2>/dev/null)"
# shellcheck disable=SC2086
route_result="$(printf '%s' "$running" | python3 "$POLICY" $denied 2>/dev/null)"
if [ "$route_result" = ok ]; then echo "OK   proxy has no Amanah route besides protected staging"; else echo "FAIL proxy route policy: ${route_result:-not checked}"; failed=1; fi
# Reload and a later container start must load the same file, and it must be what is running. A replaced
# host file leaves the container on the old one (single-file mount): that is how the closed route came back.
check "proxy container sees the host file" "$(docker exec "$CADDY" cat /etc/caddy/Caddyfile 2>/dev/null | sha256sum)" "$(sha256sum < "$CADDYFILE" 2>/dev/null)"
adapted="$(docker exec -i "$CADDY" caddy adapt --config /dev/stdin --adapter caddyfile < "$CADDYFILE" 2>/dev/null | jq -S . 2>/dev/null)"
check "proxy runs the host file" "$([ -n "$adapted" ] && [ "$adapted" = "$(printf '%s' "$running" | jq -S . 2>/dev/null)" ] && echo same)" "same"
check "app only on its own network" "$(docker inspect amanah-app --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}' 2>/dev/null)" "amanah-app_amanah_internal "
check "drafts stay locked" "$(curl -s -o /dev/null -m 8 -w '%{http_code}' http://127.0.0.1:3001/api/knowledge/entries)" "404"
check "database volume in place" "$(docker inspect amanah-postgres --format '{{range .Mounts}}{{.Name}}{{end}}' 2>/dev/null)" "amanah_pg_prod"

newest="$(find "$BACKUP_DIR" -maxdepth 1 -name 'amanah_*.sql.gz.age' -mmin "-$MAX_BACKUP_AGE_MIN" 2>/dev/null | sort | tail -1)"
if [ -n "$newest" ]; then echo "OK   encrypted backup younger than $((MAX_BACKUP_AGE_MIN / 60)) h"; else echo "FAIL no recent encrypted backup"; failed=1; fi
if [ -n "$newest" ]; then check "backup is age encrypted" "$(head -c 21 "$newest")" "age-encryption.org/v1"; fi
check "no unencrypted backup in the old folder" "$(find /opt/amanah-app/backups -maxdepth 1 -name '*.sql.gz' 2>/dev/null | wc -l)" "0"
check "no secret copy in the old folder" "$(find /opt/amanah-app -maxdepth 1 -name '.env.production.backup*' 2>/dev/null | wc -l)" "0"

exit "$failed"
