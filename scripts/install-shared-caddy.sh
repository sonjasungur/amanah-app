#!/usr/bin/env bash
# Install Amanah block into Gemeinsam1 shared Caddy (non-destructive).
set -euo pipefail

# Appends the public production route. The route is closed until the owner releases production.
if [[ "${AMANAH_PRODUCTION_ROUTE_RELEASED:-}" != "yes" ]]; then
  echo "Abbruch: Die Produktionsroute ist gesperrt (docs/strategy/45). Nur nach Owner-Freigabe mit AMANAH_PRODUCTION_ROUTE_RELEASED=yes." >&2
  exit 1
fi

AMANAH_ROOT="${AMANAH_ROOT:-/opt/amanah-app}"
GEM_ROOT="${GEM_ROOT:-/opt/gemeinsam1}"
CADDY_FILE="${GEM_ROOT}/deploy/Caddyfile"
SNIPPET="${AMANAH_ROOT}/deploy/Caddyfile.shared-snippet"
CONTAINER="${CADDY_CONTAINER:-gemeinsam1-prod-caddy}"
MARKER="# --- AmanahOrdner (amanahordner.de) ---"

if [[ ! -f "$CADDY_FILE" ]]; then
  echo "Missing $CADDY_FILE" >&2
  exit 1
fi
if [[ ! -f "$SNIPPET" ]]; then
  echo "Missing $SNIPPET" >&2
  exit 1
fi

if grep -q "amanahordner.de" "$CADDY_FILE"; then
  echo "Caddyfile already contains amanahordner.de — skipping insert."
else
  BACKUP="${CADDY_FILE}.backup.$(date +%Y%m%d-%H%M%S)"
  cp "$CADDY_FILE" "$BACKUP"
  echo "Backup: $BACKUP"
  {
    echo ""
    echo "$MARKER"
    cat "$SNIPPET"
  } >> "$CADDY_FILE"
  echo "Appended Amanah block to $CADDY_FILE"
fi

# Through stdin: the file inside the container can be older than the host file (docs/strategy/45 §4.2).
docker exec -i "$CONTAINER" caddy validate --config /dev/stdin --adapter caddyfile < "$CADDY_FILE"
docker exec -i "$CONTAINER" caddy reload --config /dev/stdin --adapter caddyfile < "$CADDY_FILE"
echo "Caddy validate + reload OK"
