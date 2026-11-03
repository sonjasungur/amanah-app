#!/usr/bin/env bash
# Complete local release check against a throwaway database. No production or staging data, no
# external services, no real payments. Every step has a time limit and its own log.
#
#   LOG_DIR=/some/dir scripts/testing/release-check.sh
#
# Exit 0 only if every step passed. Stops nothing it did not start.
set -u
cd "$(dirname "${BASH_SOURCE[0]}")/../.."
LOG="${LOG_DIR:-$(mktemp -d)}"; mkdir -p "$LOG"; SUMMARY="$LOG/summary.log"; : > "$SUMMARY"
CONTAINER=amanah-history-test-pg; DB_PORT=5447; PORT=3099
DB="postgresql://test:testonly@127.0.0.1:$DB_PORT/hist"
failed=0

cleanup() { server_stop; docker rm -f "$CONTAINER" >/dev/null 2>&1; echo "Logs: $LOG"; }
trap cleanup EXIT

# step <name> <max seconds> <command...>: reports status, and a process snapshot if the log stands still.
step() {
  local name=$1 max=$2; shift 2; local out="$LOG/$name.log"
  timeout -k 30 "$max" "$@" > "$out" 2>&1 & local pid=$!
  ( while kill -0 "$pid" 2>/dev/null; do sleep 60; if [ -n "$(find "$out" -mmin +5)" ]; then { echo "$name: 5 min ohne Ausgabe"; ps -eo pid,etime,pcpu,stat,comm --sort=-pcpu | head -6; } >> "$SUMMARY"; fi; done ) & local watcher=$!
  wait "$pid"; local rc=$?; kill "$watcher" 2>/dev/null; wait "$watcher" 2>/dev/null
  echo "$(date +%T) $name Exit=$rc" | tee -a "$SUMMARY"; [ "$rc" -eq 0 ] || failed=1
}

server_stop() { local p; p=$(ss -ltnp 2>/dev/null | grep ":$PORT " | grep -oE 'pid=[0-9]+' | head -1 | cut -d= -f2); [ -n "$p" ] && kill "$p"; for _ in 1 2 3 4 5 6 7 8 9 10; do ss -ltn | grep -q ":$PORT " || return 0; sleep 0.5; done; }

api_env() {
  export AMANAH_PUBLIC_REGISTRATION_ENABLED=true AMANAH_SERVER_STORAGE=postgres DATABASE_URL="$DB"
  export AMANAH_DATA_KEYS="t:$(openssl rand -base64 32)" AMANAH_DATA_KEY_ACTIVE=t SESSION_SECRET="$(openssl rand -hex 32)"
  export AMANAH_MAIL_TRANSPORT=outbox AMANAH_INTERNAL_TOOLS=true AMANAH_PUBLIC_BASE_URL="http://127.0.0.1:$PORT"
  export AMANAH_BILLING_MODE=sandbox AMANAH_SANDBOX_WEBHOOK_SECRET="$(openssl rand -hex 32)" AMANAH_DATA_HISTORY=true
}

# Fresh server per project: the registration brake counts per server and must stay in force.
browser_spec() {
  local name=$1 envs=$2 files=$3 project
  for project in chromium-desktop chromium-mobile; do
    (
      api_env
      # shellcheck disable=SC2086
      export $envs
      timeout -k 10 500 npx next start -p "$PORT" > "$LOG/$name.$project.server.log" 2>&1 &
      for _ in $(seq 1 60); do curl -fsS -m 2 "http://127.0.0.1:$PORT/api/health" >/dev/null 2>&1 && break; sleep 0.5; done
      # shellcheck disable=SC2086
      timeout -k 20 480 npx playwright test $files --project="$project" --reporter=list --output="$LOG/out-$name-$project" > "$LOG/$name.$project.log" 2>&1
      rc=$?; server_stop; exit "$rc"
    )
    local rc=$?; echo "$(date +%T) $name $project Exit=$rc $(grep -E '^ +[0-9]+ (passed|failed|skipped)' "$LOG/$name.$project.log" | tr -s ' ' | tr '\n' ';')" | tee -a "$SUMMARY"; [ "$rc" -eq 0 ] || failed=1
  done
}

docker rm -f "$CONTAINER" >/dev/null 2>&1
docker run -d --rm --name "$CONTAINER" -e POSTGRES_USER=test -e POSTGRES_PASSWORD=testonly -e POSTGRES_DB=hist --tmpfs /var/lib/postgresql/data -p "127.0.0.1:$DB_PORT:5432" postgres:16-alpine >/dev/null
for _ in $(seq 1 30); do docker exec "$CONTAINER" pg_isready -U test -d hist >/dev/null 2>&1 && break; sleep 1; done; sleep 2

step types 300 npx tsc --noEmit
step lint 300 npx eslint
step unit 600 npx vitest run
step migrate 90 env DATABASE_URL="$DB" npx prisma migrate deploy
step unit-postgres 400 env DATABASE_URL="$DB" AMANAH_SERVER_STORAGE=postgres npx vitest run src/__tests__/postgres
step migrate-diff 90 env DATABASE_URL="$DB" npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code
step migration-rehearsal 200 scripts/testing/migration-rehearsal.sh

step build-api 600 env NEXT_PUBLIC_AUTH_MODE=api NEXT_PUBLIC_STORAGE_MODE=api NEXT_PUBLIC_AMANAH_PUBLIC_REGISTRATION_ENABLED=true NEXT_PUBLIC_AMANAH_AI_ENABLED=true npx next build
BILLING="AMANAH_BILLING_ENFORCE=true AMANAH_PLUS_LAUNCH_AT=2000-01-01T00:00:00Z"
browser_spec regression "SECURITY_API_E2E=true PHASE2_API_TESTS=true" "e2e/security-session.spec.ts e2e/phase2-failure-paths.spec.ts e2e/legacy-email-verification.spec.ts"
browser_spec hydration "HYDRATION=api" "e2e/hydration-session.spec.ts"
browser_spec free "$BILLING FREE_ASSET_E2E=true" "e2e/free-asset-account.spec.ts"
browser_spec history "$BILLING DATA_HISTORY_E2E=true" "e2e/data-history.spec.ts"
browser_spec plus "$BILLING PLUS_TARIFF_E2E=true" "e2e/plus-tariff-account.spec.ts"
browser_spec core "RELEASE_E2E=true" "e2e/release-core-flows.spec.ts"
browser_spec keyfault "FOLDER_FAULT_E2E=true" "e2e/folder-unreadable.spec.ts"

# Phone profiles, WebKit needs system libraries: runs in the official image, nothing on the host.
mobile_project() {
  local project=$1 image="mcr.microsoft.com/playwright:v$(node -p "require('@playwright/test/package.json').version")-noble"
  (
    # Plain http on this machine: WebKit refuses Secure cookies there. HTTPS stays a real-device check.
    api_env; export MOBILE_E2E=true RELEASE_E2E=true AMANAH_COOKIE_SECURE=false
    timeout -k 10 500 npx next start -p "$PORT" > "$LOG/mobile.$project.server.log" 2>&1 &
    for _ in $(seq 1 60); do curl -fsS -m 2 "http://127.0.0.1:$PORT/api/health" >/dev/null 2>&1 && break; sleep 0.5; done
    timeout -k 20 480 docker run --rm --network host -u "$(id -u):$(id -g)" -e HOME=/tmp -e MOBILE_E2E=true -e RELEASE_E2E=true -e PLAYWRIGHT_OUTPUT_DIR="/tmp/out" -v "$PWD:/work" -w /work "$image" npx playwright test -c playwright.mobile.config.ts --project="$project" --reporter=list > "$LOG/mobile.$project.log" 2>&1
    rc=$?; server_stop; exit "$rc"
  )
  local rc=$?; echo "$(date +%T) mobile $project Exit=$rc $(grep -E '^ +[0-9]+ (passed|failed|skipped)' "$LOG/mobile.$project.log" | tr -s ' ' | tr '\n' ';')" | tee -a "$SUMMARY"; [ "$rc" -eq 0 ] || failed=1
}
mobile_project iphone-webkit
mobile_project android-chromium
step restore-drill 540 node scripts/testing/restore-drill.mjs

step build 600 npm run build
step build-flags 600 npm run build:e2e:flags
step browser-flags 500 npx playwright test -c playwright.flags.config.ts --reporter=list
step build-e2e 600 npm run build:e2e
step browser-all 1500 npx playwright test --reporter=list

step secrets-history 300 env GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=safe.directory GIT_CONFIG_VALUE_0='*' gitleaks git . --log-opts=--all --config .gitleaks.toml --baseline-path .gitleaks-baseline.json --redact --no-banner
step release-build 500 npm run build

cat "$SUMMARY"; [ "$failed" -eq 0 ] && echo "RELEASE-CHECK BESTANDEN" || echo "RELEASE-CHECK FEHLGESCHLAGEN"
exit "$failed"
