#!/bin/sh
set -eu

if [ "${AMANAH_SERVER_STORAGE:-memory}" = "postgres" ] && [ -n "${DATABASE_URL:-}" ]; then
  echo "[entrypoint] Running Prisma migrate deploy..."
  if [ -x ./node_modules/.bin/prisma ]; then
    ./node_modules/.bin/prisma migrate deploy
  else
    npx prisma migrate deploy
  fi
fi

echo "[entrypoint] Starting Amanah app..."
exec "$@"
