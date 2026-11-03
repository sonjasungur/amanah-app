#!/usr/bin/env bash
# Rehearses the production migration: from the single migration production has, with a synthetic
# account, up to the current schema. Only against its own throwaway database in memory.
set -u
cd "$(dirname "${BASH_SOURCE[0]}")/../.."
C=amanah-migration-rehearsal; PORT=5449; URL="postgresql://test:testonly@127.0.0.1:$PORT/rehearsal"
FIRST=20260705105925_init
fail() { echo "FAIL $1"; exit 1; }
trap 'docker rm -f "$C" >/dev/null 2>&1' EXIT
docker rm -f "$C" >/dev/null 2>&1
docker run -d --rm --name "$C" -e POSTGRES_USER=test -e POSTGRES_PASSWORD=testonly -e POSTGRES_DB=rehearsal --tmpfs /var/lib/postgresql/data -p "127.0.0.1:$PORT:5432" postgres:16-alpine >/dev/null
for _ in $(seq 1 30); do docker exec "$C" pg_isready -U test -d rehearsal >/dev/null 2>&1 && break; sleep 1; done; sleep 2
psql_() { docker exec -i "$C" psql -q -At -v ON_ERROR_STOP=1 -U test -d rehearsal "$@"; }

psql_ < "prisma/migrations/$FIRST/migration.sql" || fail "first migration"
DATABASE_URL="$URL" timeout -k 10 60 npx prisma migrate resolve --applied "$FIRST" >/dev/null 2>&1 || fail "mark first migration"
psql_ <<'SQL' || fail "synthetic data"
INSERT INTO users (id, email, name, password_hash, updated_at) VALUES ('rehearsal-user', 'rehearsal@test.invalid', 'Synthetisch', 'nicht-echt', now());
INSERT INTO amanah_data (id, user_id, data, updated_at) VALUES ('rehearsal-data', 'rehearsal-user', '{"emergencyCard":{"name":"Synthetisch"}}', now());
SQL
echo "OK   start: 1 migration, 1 synthetic account"
DATABASE_URL="$URL" timeout -k 10 120 npx prisma migrate deploy > /tmp/amanah-rehearsal.$$ 2>&1 || { tail -3 /tmp/amanah-rehearsal.$$; rm -f /tmp/amanah-rehearsal.$$; fail "migrate deploy"; }
rm -f /tmp/amanah-rehearsal.$$
[ "$(psql_ -c 'SELECT count(*) FROM _prisma_migrations WHERE finished_at IS NOT NULL')" = "$(ls prisma/migrations | grep -vc lock)" ] || fail "not all migrations applied"
echo "OK   all $(ls prisma/migrations | grep -vc lock) migrations applied"
[ "$(psql_ -c "SELECT count(*) FROM users WHERE id='rehearsal-user' AND email='rehearsal@test.invalid'")" = 1 ] || fail "account lost"
[ "$(psql_ -c "SELECT data->'emergencyCard'->>'name' FROM amanah_data WHERE id='rehearsal-data'")" = "Synthetisch" ] || fail "folder lost"
echo "OK   account and folder unchanged"
[ "$(psql_ -c "SELECT count(*) FROM users WHERE email_verification_legacy_at IS NOT NULL AND email_verified_at IS NULL")" = 1 ] || fail "existing account not treated as legacy"
echo "OK   existing account follows the legacy e-mail rule"
DATABASE_URL="$URL" timeout -k 10 60 npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code >/dev/null 2>&1 || fail "schema differs"
echo "OK   schema matches"
echo "ALL CHECKS PASSED"
