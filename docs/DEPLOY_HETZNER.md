# Deploy AmanahOrdner on Hetzner (Production)

This guide prepares a production deployment using **Docker Compose**, **PostgreSQL**, **Caddy**, and the Next.js standalone build.

> **No secrets in git.** All real credentials live in `.env.production` on the server only.

## 1. Server preparation

Recommended: Ubuntu 22.04+ or Debian 12+ on Hetzner Cloud.

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl ca-certificates
```

Install Docker (official convenience script or Hetzner docs):

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker "$USER"
# Log out and back in
docker compose version
```

Optional: configure firewall (UFW) — allow SSH, 80, 443 only.

## 2. Clone repository

```bash
sudo mkdir -p /opt/amanah-app
sudo chown "$USER:$USER" /opt/amanah-app
git clone https://github.com/sonjasungur/amanah-app.git /opt/amanah-app
cd /opt/amanah-app
```

## 3. Configure environment

```bash
cp .env.production.example .env.production
cp deploy/Caddyfile.example deploy/Caddyfile   # if not already present
nano .env.production
nano deploy/Caddyfile
```

Set in `.env.production`:

- `POSTGRES_PASSWORD` — strong random password
- `SESSION_SECRET` / `AUTH_SECRET` — min. 32 random characters
- `NEXT_PUBLIC_SITE_URL` — `https://your-domain.de`
- `DATABASE_URL` — match Postgres user/password/db (compose sets host `postgres`)
- Keep `AMANAH_AI_PROVIDER=rules` unless OpenAI is intentionally enabled

Set in `deploy/Caddyfile`:

- Replace `amanah.example.com` with your real domain

## 4. DNS

Point your domain A/AAAA record to the Hetzner server IP.

## 5. Preflight check

```bash
chmod +x scripts/*.sh
./scripts/deploy-preflight.sh
```

Fix any validation errors before continuing.

## 6. Build and start

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

This will:

1. Start Postgres (persistent volume `amanah_pg_prod`)
2. Build the Next.js app image
3. Run `prisma migrate deploy` on app startup
4. Start Caddy on ports 80/443 (only public service)

## 7. Verify logs

```bash
docker compose -f docker-compose.prod.yml logs -f app
docker compose -f docker-compose.prod.yml logs -f caddy
docker compose -f docker-compose.prod.yml ps
```

## 8. Smoke test

From the server (via Caddy):

```bash
BASE_URL=https://your-domain.de ./scripts/prod-smoke-test.sh
```

Or locally on the server through Caddy HTTP before TLS:

```bash
BASE_URL=http://localhost ./scripts/prod-smoke-test.sh
```

Check `/api/health` — expect `dbReachable: true`, `environment: "production"`.

## 9. Backups

Create a cron job for daily Postgres backups:

```bash
mkdir -p /opt/amanah-app/backups
crontab -e
# Example: daily at 03:15
15 3 * * * cd /opt/amanah-app && ./scripts/backup-postgres.sh >> /var/log/amanah-backup.log 2>&1
```

Backups are stored in `backups/` (gitignored).

### Restore (disaster recovery)

```bash
./scripts/restore-postgres.sh backups/amanah_amanah_YYYYMMDD_HHMMSS.sql.gz
```

## 10. Updates / redeploy

```bash
cd /opt/amanah-app
git pull origin main
./scripts/deploy-preflight.sh
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
./scripts/prod-smoke-test.sh
```

## Rollback

1. Stop stack: `docker compose -f docker-compose.prod.yml down` (does **not** remove Postgres volume by default)
2. Checkout previous commit: `git checkout <previous-tag>`
3. Rebuild: `docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build`
4. If DB migration failed, restore from backup: `./scripts/restore-postgres.sh ...`

## Shared server (existing Caddy on 80/443)

If another app already uses ports 80/443 (e.g. on `gemeinsam1-prod`):

```bash
cd /opt/amanah-app
git pull origin main
./scripts/init-production-env.sh          # once — generates .env.production
./scripts/deploy-shared-server.sh         # app + postgres on localhost:3001
./scripts/backup-postgres.sh              # test backup
```

Public HTTPS: add `deploy/Caddyfile.shared-snippet` to your existing Caddy and set DNS for your Amanah domain.

Dedicated server (own Caddy):

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production --profile caddy up -d --build
```

## Architecture

```
Internet → Caddy (:443/:80) → app:3000 (internal)
                              ↘ postgres:5432 (internal only)
```

- **Public:** Caddy only
- **Private:** Next.js app, PostgreSQL
- **Secrets:** `.env.production` on server

## Troubleshooting

| Issue | Check |
|-------|-------|
| 502 from Caddy | `docker compose logs app` — app health |
| DB connection failed | `DATABASE_URL`, Postgres health, migrations |
| TLS not issued | DNS propagated, port 443 open |
| Migrations fail | `docker exec -it amanah-app npx prisma migrate deploy` |

See also: [ENVIRONMENT.md](./ENVIRONMENT.md), [LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md)
