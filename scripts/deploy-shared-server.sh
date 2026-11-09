#!/usr/bin/env bash
# Deploy Amanah on a shared Hetzner host (existing Caddy on 80/443).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

ENV_FILE="${ENV_FILE:-.env.production}"
COMPOSE=(docker compose -f docker-compose.prod.yml -f docker-compose.prod.nocaddy.yml --env-file "$ENV_FILE")

echo "== Amanah shared-server deploy =="

# The production app runs from the pinned stack; this script would build and replace it.
managed_by="$(docker inspect amanah-app --format '{{index .Config.Labels "com.docker.compose.project.config_files"}}' 2>/dev/null || true)"
if [[ "$managed_by" == *amanah-prod* ]]; then
  echo "GESPERRT: amanah-app laeuft aus dem festgenagelten Stack in /opt/amanah-prod. Dieses Skript wuerde den Container ersetzen und bricht ab; es wurde nichts geaendert." >&2
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Run ./scripts/init-production-env.sh first." >&2
  exit 1
fi

# Checked on the resolved configuration, so an edited overlay or an environment variable cannot slip through.
# The output holds secrets: it stays in this variable and is never printed.
resolved="$("${COMPOSE[@]}" config 2>/dev/null)" || {
  echo "GESPERRT: Compose-Konfiguration nicht lesbar, Abbruch." >&2
  exit 1
}
if grep -qE 'shared_proxy|gemeinsam1-prod_internal|published: "?(80|443)"?$' <<<"$resolved"; then
  echo "GESPERRT: Die App wuerde an das Netz des gemeinsamen Proxys oder an oeffentliche Ports angebunden. Abbruch, es wurde nichts geaendert." >&2
  exit 1
fi

./scripts/deploy-preflight.sh

echo "Building and starting (app + postgres, no dedicated Caddy)..."
"${COMPOSE[@]}" up -d --build

echo "Container status:"
"${COMPOSE[@]}" ps

echo "Waiting for app health..."
for i in $(seq 1 30); do
  if curl -sf "http://127.0.0.1:3001/api/health" >/dev/null 2>&1; then
    echo "App healthy."
    break
  fi
  sleep 2
  if [[ "$i" -eq 30 ]]; then
    echo "App health timeout — check logs:" >&2
    "${COMPOSE[@]}" logs --tail=50 app >&2
    exit 1
  fi
done

BASE_URL="${BASE_URL:-http://127.0.0.1:3001}" ./scripts/prod-smoke-test.sh

echo "Deploy complete. The app stays on localhost:3001; this deploy opens no public route."
