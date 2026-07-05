#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost}"
FAILED=0

check() {
  local path="$1"
  local code
  code="$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}${path}")"
  if [[ "$code" =~ ^2 ]]; then
    echo "✓ ${path} -> ${code}"
  else
    echo "✗ ${path} -> ${code}" >&2
    FAILED=1
  fi
}

echo "Amanah production smoke test"
echo "BASE_URL=${BASE_URL}"
echo "----------------------------"

check "/api/health"
check "/"
check "/login"
check "/register"
check "/dashboard"
check "/datenschutz"
check "/sicherheit"
check "/api/knowledge/entries"

HEALTH="$(curl -s "${BASE_URL}/api/health")"
echo "Health: ${HEALTH}" | head -c 400
echo

if echo "$HEALTH" | grep -q '"dbReachable":true'; then
  echo "✓ dbReachable true"
elif echo "$HEALTH" | grep -q '"serverStorage":"postgres"'; then
  echo "⚠ serverStorage postgres but dbReachable not true (may be expected before DB ready)"
else
  echo "✓ dbReachable check skipped (non-postgres mode)"
fi

if echo "$HEALTH" | grep -qi 'sk-'; then
  echo "✗ Health response may contain secrets" >&2
  FAILED=1
else
  echo "✓ Health response has no obvious API keys"
fi

echo
if [[ "$FAILED" -ne 0 ]]; then
  echo "Smoke test failed."
  exit 1
fi

echo "Smoke test passed."
