# AmanahOrdner — Production Dockerfile (Next.js standalone + Prisma)
# Node 24 LTS: matches local tests; Node 20 is end-of-life; needed for scripts/*.mjs that load .ts modules
FROM node:24-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./
RUN npm ci

FROM deps AS migrate
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate
CMD ["npx", "prisma", "migrate", "deploy"]

FROM base AS builder
ARG NEXT_PUBLIC_AUTH_MODE=api
ARG NEXT_PUBLIC_STORAGE_MODE=api
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ARG NEXT_PUBLIC_APP_URL=
# Staging builds show a banner and send noindex; defaults keep production behaviour
ARG NEXT_PUBLIC_AMANAH_ENVIRONMENT=
ARG NEXT_PUBLIC_AMANAH_PUBLIC_REGISTRATION_ENABLED=false
ENV NEXT_PUBLIC_AMANAH_ENVIRONMENT=$NEXT_PUBLIC_AMANAH_ENVIRONMENT
ENV NEXT_PUBLIC_AMANAH_PUBLIC_REGISTRATION_ENABLED=$NEXT_PUBLIC_AMANAH_PUBLIC_REGISTRATION_ENABLED
ENV NEXT_PUBLIC_AUTH_MODE=$NEXT_PUBLIC_AUTH_MODE
ENV NEXT_PUBLIC_STORAGE_MODE=$NEXT_PUBLIC_STORAGE_MODE
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL:-$NEXT_PUBLIC_SITE_URL}
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY scripts/docker-entrypoint.sh ./docker-entrypoint.sh
# Operator tool: key check and rotation with exactly this image.
COPY scripts/reencrypt-amanah-data.mjs ./scripts/reencrypt-amanah-data.mjs
COPY scripts/key-reference.mjs ./scripts/key-reference.mjs
COPY src/lib/server/data-encryption.ts ./src/lib/server/data-encryption.ts

RUN chmod +x ./docker-entrypoint.sh \
  && chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
