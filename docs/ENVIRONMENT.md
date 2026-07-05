# AmanahOrdner — Environment Variables

This document describes configuration for **local development** and **production (Hetzner/VPS)**.

## Files

| File | Purpose | Commit? |
|------|---------|---------|
| `.env.example` | Local dev template | Yes |
| `.env.local` | Your local secrets | **Never** |
| `.env.production.example` | Production template | Yes |
| `.env.production` | Server secrets | **Never** |

## Local development (default)

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
npm run dev
```

Defaults keep data in **LocalStorage** (`NEXT_PUBLIC_AUTH_MODE=local`, `NEXT_PUBLIC_STORAGE_MODE=local`).

Optional Postgres local dev:

```bash
docker compose -f docker-compose.local.yml up -d postgres
# Set in .env.local:
# DATABASE_URL=postgresql://amanah:amanah_dev_password@localhost:5436/amanah_dev
# AMANAH_SERVER_STORAGE=postgres
# NEXT_PUBLIC_AUTH_MODE=api
# NEXT_PUBLIC_STORAGE_MODE=api
npm run db:migrate
```

## Production (Hetzner)

Copy `.env.production.example` to `.env.production` on the server:

```bash
cp .env.production.example .env.production
```

### Required production values

| Variable | Production value |
|----------|------------------|
| `NODE_ENV` | `production` |
| `NEXT_PUBLIC_AUTH_MODE` | `api` |
| `NEXT_PUBLIC_STORAGE_MODE` | `api` |
| `AMANAH_SERVER_STORAGE` | `postgres` |
| `DATABASE_URL` | Internal Postgres URL (see compose) |
| `POSTGRES_PASSWORD` | Strong random password |
| `SESSION_SECRET` | Min. 32 random characters |
| `NEXT_PUBLIC_SITE_URL` | `https://your-domain.de` |

### Recommended AI defaults

| Variable | Recommended |
|----------|-------------|
| `AMANAH_AI_ENABLED` | `true` |
| `AMANAH_AI_PROVIDER` | `rules` (no external API cost) |
| `OPENAI_API_KEY` | Empty unless OpenAI is explicitly enabled |
| `AMANAH_KNOWLEDGE_RETRIEVAL` | `keyword` |
| `AMANAH_EMBEDDING_PROVIDER` | `none` |

OpenAI remains **optional** and **consent-gated** in the UI.

## Validation

Before deploy:

```bash
./scripts/deploy-preflight.sh
```

## Security notes

- Never commit `.env.local` or `.env.production`
- Never log `OPENAI_API_KEY`, `DATABASE_URL`, or `SESSION_SECRET`
- `/api/health` exposes status only — no secrets
- Postgres is not exposed publicly in `docker-compose.prod.yml`

See also: [DEPLOY_HETZNER.md](./DEPLOY_HETZNER.md), [LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md)
