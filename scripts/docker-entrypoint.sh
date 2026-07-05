#!/bin/sh
set -eu

if [ "${AMANAH_SERVER_STORAGE:-memory}" = "postgres" ] && [ -n "${DATABASE_URL:-}" ]; then
  echo "[entrypoint] Running Prisma migrate deploy..."
  node ./node_modules/prisma/build/index.js migrate deploy
fi

echo "[entrypoint] Starting Amanah app..."
exec "$@"
