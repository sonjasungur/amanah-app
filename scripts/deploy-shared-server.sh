#!/usr/bin/env bash
# Deploy Amanah on a shared Hetzner host (existing Caddy on 80/443).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

ENV_FILE="${ENV_FILE:-.env.production}"
COMPOSE=(docker compose -f docker-compose.prod.yml -f docker-compose.prod.nocaddy.yml --env-file "$ENV_FILE")

echo "== Amanah shared-server deploy =="

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Run ./scripts/init-production-env.sh first." >&2
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

echo "Deploy complete. For public HTTPS, add deploy/Caddyfile.shared-snippet to your existing Caddy and set DNS."
