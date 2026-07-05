#!/usr/bin/env bash
# Update public site URL in .env.production without printing secrets.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT/.env.production}"
SITE_URL="${1:-https://amanahordner.de}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE" >&2
  exit 1
fi

BACKUP="${ENV_FILE}.backup.$(date +%Y%m%d-%H%M%S)"
cp "$ENV_FILE" "$BACKUP"
echo "Backup: $BACKUP"

if sed --version >/dev/null 2>&1; then
  sed -i "s|^NEXT_PUBLIC_SITE_URL=.*|NEXT_PUBLIC_SITE_URL=${SITE_URL}|" "$ENV_FILE"
  sed -i "s|^NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=${SITE_URL}|" "$ENV_FILE"
else
  sed -i '' "s|^NEXT_PUBLIC_SITE_URL=.*|NEXT_PUBLIC_SITE_URL=${SITE_URL}|" "$ENV_FILE"
  sed -i '' "s|^NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=${SITE_URL}|" "$ENV_FILE"
fi

echo "Updated NEXT_PUBLIC_SITE_URL and NEXT_PUBLIC_APP_URL to ${SITE_URL}"
