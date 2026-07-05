#!/usr/bin/env bash
# Create .env.production on server with generated secrets (never prints secret values).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

ENV_FILE="${ENV_FILE:-.env.production}"
EXAMPLE="${EXAMPLE:-.env.production.example}"

if [[ -f "$ENV_FILE" ]]; then
  echo "$ENV_FILE already exists — not overwriting."
  exit 0
fi

if [[ ! -f "$EXAMPLE" ]]; then
  echo "Missing $EXAMPLE" >&2
  exit 1
fi

PG_PASS="$(openssl rand -base64 24 | tr -d '/+=' | head -c 32)"
SESSION="$(openssl rand -base64 48 | tr -d '/+=' | head -c 48)"
BASE_URL="${BASE_URL:-http://127.0.0.1:3001}"

cp "$EXAMPLE" "$ENV_FILE"

# Replace placeholders (macOS/Linux sed)
if sed --version >/dev/null 2>&1; then
  SED=(sed -i)
else
  SED=(sed -i '')
fi

"${SED[@]}" "s|REPLACE_WITH_STRONG_DB_PASSWORD|${PG_PASS}|g" "$ENV_FILE"
"${SED[@]}" "s|REPLACE_WITH_LONG_RANDOM_SECRET_MIN_32_CHARS|${SESSION}|g" "$ENV_FILE"
"${SED[@]}" "s|https://amanah.example.com|${BASE_URL}|g" "$ENV_FILE"

chmod 600 "$ENV_FILE"
echo "Created $ENV_FILE with generated secrets."
echo "BASE_URL=${BASE_URL}"
echo "Review NEXT_PUBLIC_SITE_URL before production go-live with a real domain."
