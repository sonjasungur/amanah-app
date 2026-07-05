# AmanahOrdner — Launch Checklist

Use before opening production to beta users.

## Security & privacy

- [ ] `.env.production` exists on server only — **not** in git
- [ ] `SESSION_SECRET` is 32+ random characters
- [ ] `POSTGRES_PASSWORD` is strong and unique
- [ ] No `OPENAI_API_KEY` in repository or logs
- [ ] `./scripts/deploy-preflight.sh` passes
- [ ] `/datenschutz` and `/sicherheit` pages reviewed
- [ ] `/impressum` page reviewed
- [ ] Beta notice visible (Dashboard status card / Sicherheit page)

## Infrastructure

- [ ] DNS A/AAAA records point to Hetzner server
- [ ] `deploy/Caddyfile` uses correct domain
- [ ] Only ports 80/443 public; Postgres not exposed
- [ ] `docker compose -f docker-compose.prod.yml ps` — all healthy
- [ ] `/api/health` returns `status: ok`
- [ ] `/api/health` shows `dbReachable: true` (Postgres mode)
- [ ] `/api/health` shows no secrets (no URLs with passwords, no API keys)

## Auth & data

- [ ] Register new account works (`/register`)
- [ ] Login works (`/login`)
- [ ] Save Amanah data persists after reload
- [ ] `DELETE /api/amanah` removes data, account remains
- [ ] LocalStorage demo still works in local dev (regression)

## Core features

- [ ] Guided flow (`/dashboard/ausfuellen`) — answer, preview, confirm save
- [ ] Readable emergency export opens / prints
- [ ] JSON emergency export downloads
- [ ] AI rules mode works without API key
- [ ] OpenAI only after user consent (if enabled)
- [ ] Blocked questions: legal validity, medical, fatwa, auto-notify

## Operations

- [ ] `./scripts/backup-postgres.sh` creates timestamped gzip in `backups/`
- [ ] Backup cron scheduled
- [ ] `./scripts/prod-smoke-test.sh` passes against production URL
- [ ] `npm run release:check` passed on release commit
- [ ] Rollback steps documented and understood

## Final sign-off

- [ ] Fachliche Prüfung empfohlen — disclaimers visible
- [ ] No guarantee of legal/medical/religious validity communicated
- [ ] Team knows: **Angehörige erhalten nichts automatisch**
