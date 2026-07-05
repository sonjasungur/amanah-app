#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

ENV_FILE="${ENV_FILE:-.env.production}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

fail() { echo -e "${RED}✗${NC} $1" >&2; FAILED=1; }
pass() { echo -e "${GREEN}✓${NC} $1"; }

FAILED=0

echo "Amanah deploy preflight"
echo "======================="

if [[ ! -f "$ENV_FILE" ]]; then
  fail "$ENV_FILE missing — copy from .env.production.example"
else
  pass "$ENV_FILE exists"
fi

for f in "$COMPOSE_FILE" Dockerfile prisma/schema.prisma deploy/Caddyfile; do
  if [[ -f "$f" ]]; then pass "$f present"; else fail "$f missing"; fi
done

if command -v docker >/dev/null 2>&1; then
  if [[ -f "$ENV_FILE" ]]; then
    if docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" config >/dev/null 2>&1; then
      pass "docker compose config valid"
    else
      fail "docker compose config invalid (check .env.production and compose file)"
    fi
  else
    echo "⚠ skipping docker compose config (no env file)"
  fi
else
  echo "⚠ docker not installed — skipping compose config validation"
fi

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a

  if command -v node >/dev/null 2>&1; then
    if node scripts/validate-production-env.mjs; then
      pass "production env validation passed"
    else
      fail "production env validation failed"
    fi
  else
    echo "⚠ node not installed — using bash env checks"
    [[ -n "${DATABASE_URL:-}" ]] && pass "DATABASE_URL set" || fail "DATABASE_URL missing"
    [[ -n "${SESSION_SECRET:-}" ]] && [[ ${#SESSION_SECRET} -ge 32 ]] && pass "SESSION_SECRET length OK" || fail "SESSION_SECRET invalid"
    [[ "${NEXT_PUBLIC_AUTH_MODE:-}" == "api" ]] && pass "NEXT_PUBLIC_AUTH_MODE=api" || fail "NEXT_PUBLIC_AUTH_MODE must be api"
    [[ "${NEXT_PUBLIC_STORAGE_MODE:-}" == "api" ]] && pass "NEXT_PUBLIC_STORAGE_MODE=api" || fail "NEXT_PUBLIC_STORAGE_MODE must be api"
    [[ "${AMANAH_SERVER_STORAGE:-}" == "postgres" ]] && pass "AMANAH_SERVER_STORAGE=postgres" || fail "AMANAH_SERVER_STORAGE must be postgres"
    [[ "${AMANAH_AI_PROVIDER:-rules}" == "rules" || "${AMANAH_AI_PROVIDER:-}" == "rules" ]] && pass "AI provider rules (default)" || echo "⚠ AI provider: ${AMANAH_AI_PROVIDER:-unset}"
  fi

  if [[ -n "${OPENAI_API_KEY:-}" ]]; then
    pass "OPENAI_API_KEY is set (value not logged)"
  else
    pass "OPENAI_API_KEY empty — rules mode recommended"
  fi

  if grep -qE 'sk-[a-zA-Z0-9]{20,}' "$ENV_FILE" 2>/dev/null; then
    echo "⚠ OpenAI key pattern detected in $ENV_FILE — ensure file is gitignored"
  fi
fi

echo
if [[ "${FAILED:-0}" -ne 0 ]]; then
  echo -e "${RED}Preflight failed.${NC}"
  exit 1
fi

echo -e "${GREEN}Preflight passed.${NC} Ready for: docker compose -f $COMPOSE_FILE --env-file $ENV_FILE up -d --build"
