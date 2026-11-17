import { createHmac } from "crypto";
import { isIP } from "net";
import { isPostgresStorage } from "./config";
import { prisma } from "./prisma";
import { memoryClear, memoryHit, memoryPeek } from "./auth-rate-limit-memory";

/**
 * Limits for login, registration and account recovery that survive a restart and hold across app
 * instances: with Postgres storage the counters live in the database and every hit is one atomic
 * upsert, so parallel requests cannot slip past a limit. Keys are HMACs of the e-mail address or the
 * client address, so the table holds neither in clear. Nothing here logs an address or a password.
 */

export const MINUTE = 60_000;
export const FIFTEEN_MINUTES = 15 * MINUTE;
const DAY_MS = 24 * 60 * MINUTE;

export interface LimitRule {
  /** What is counted, e.g. "login:ip". Part of the key, never shown. */
  scope: string;
  /** The address, e-mail or other value the rule counts; hashed before it is stored. */
  subject: string;
  max: number;
  windowMs: number;
}

export interface LimitResult {
  allowed: boolean;
  /** Seconds until the longest exceeded window ends; only set when not allowed. */
  retryAfterSeconds?: number;
}

function limitSecret(): string {
  const secret = process.env.SESSION_SECRET || process.env.AUTH_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET (or AUTH_SECRET) must be set in production.");
  }
  return "dev-only-rate-limit";
}

export function limitKey(scope: string, subject: string): string {
  const digest = createHmac("sha256", limitSecret()).update(`${scope}\n${subject}`).digest("hex").slice(0, 40);
  return `${scope}:${digest}`;
}

/**
 * The client address as seen by the trusted reverse proxy. Caddy replaces X-Forwarded-For from
 * untrusted clients, so the entry added by the last trusted hop is the right-most one. Entries to its
 * left come from the client and are ignored. AMANAH_TRUSTED_PROXY_HOPS (default 1) is the number of
 * trusted proxies in front of the app; 0 ignores the header, for an app reached without a proxy.
 */
export function clientAddress(request: Request, env: Record<string, string | undefined> = process.env): string {
  const hops = Number.parseInt(env.AMANAH_TRUSTED_PROXY_HOPS ?? "1", 10);
  if (!Number.isFinite(hops) || hops <= 0) return "direct";
  const header = request.headers.get("x-forwarded-for");
  if (!header) return "direct";
  const entries = header.split(",").map((part) => part.trim()).filter(Boolean);
  const candidate = entries[entries.length - hops];
  return candidate && isIP(candidate) ? candidate : "unparsable";
}

interface CounterStore {
  hit(key: string, windowMs: number): Promise<{ count: number; windowStart: number }>;
  peek(key: string, windowMs: number): Promise<number>;
  clear(key: string): Promise<void>;
}

const memoryStore: CounterStore = {
  hit: async (key, windowMs) => memoryHit(key, windowMs),
  peek: async (key, windowMs) => memoryPeek(key, windowMs),
  clear: async (key) => memoryClear(key),
};

const postgresStore: CounterStore = {
  async hit(key, windowMs) {
    const seconds = windowMs / 1000;
    // One statement, so the row lock serialises concurrent hits on the same key; the database clock
    // is shared by every instance.
    const rows = await prisma.$queryRaw<{ count: number; window_start: Date }[]>`
      INSERT INTO "auth_rate_limits" ("key", "count", "window_start")
      VALUES (${key}, 1, CURRENT_TIMESTAMP)
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE WHEN "auth_rate_limits"."window_start" <= CURRENT_TIMESTAMP - make_interval(secs => ${seconds}::double precision)
                       THEN 1 ELSE "auth_rate_limits"."count" + 1 END,
        "window_start" = CASE WHEN "auth_rate_limits"."window_start" <= CURRENT_TIMESTAMP - make_interval(secs => ${seconds}::double precision)
                       THEN CURRENT_TIMESTAMP ELSE "auth_rate_limits"."window_start" END
      RETURNING "count", "window_start"`;
    const row = rows[0];
    return { count: Number(row.count), windowStart: new Date(row.window_start).getTime() };
  },
  async peek(key, windowMs) {
    const seconds = windowMs / 1000;
    const rows = await prisma.$queryRaw<{ count: number }[]>`
      SELECT "count" FROM "auth_rate_limits"
      WHERE "key" = ${key} AND "window_start" > CURRENT_TIMESTAMP - make_interval(secs => ${seconds}::double precision)`;
    return rows.length ? Number(rows[0].count) : 0;
  },
  async clear(key) {
    await prisma.$executeRaw`DELETE FROM "auth_rate_limits" WHERE "key" = ${key}`;
  },
};

function store(): CounterStore {
  return isPostgresStorage() ? postgresStore : memoryStore;
}

function retryAfter(windowStart: number, windowMs: number): number {
  return Math.max(1, Math.ceil((windowStart + windowMs - Date.now()) / 1000));
}

/** Counts one attempt against every rule; refused if any rule is over its limit. */
export async function consumeLimits(rules: LimitRule[]): Promise<LimitResult> {
  let retryAfterSeconds = 0;
  for (const rule of rules) {
    const { count, windowStart } = await store().hit(limitKey(rule.scope, rule.subject), rule.windowMs);
    if (count > rule.max) retryAfterSeconds = Math.max(retryAfterSeconds, retryAfter(windowStart, rule.windowMs));
  }
  return retryAfterSeconds > 0 ? { allowed: false, retryAfterSeconds } : { allowed: true };
}

/** Whether a rule has already reached its limit, without counting. */
export async function isLimitReached(rule: LimitRule): Promise<boolean> {
  return (await store().peek(limitKey(rule.scope, rule.subject), rule.windowMs)) >= rule.max;
}

/** Counts one event (e.g. a failed password) without checking it. */
export async function recordLimitHit(rule: LimitRule): Promise<void> {
  await store().hit(limitKey(rule.scope, rule.subject), rule.windowMs);
}

export async function clearLimit(rule: Pick<LimitRule, "scope" | "subject">): Promise<void> {
  await store().clear(limitKey(rule.scope, rule.subject));
}

/** Removes counters whose window ended more than a day ago. Postgres only; returns the number removed. */
export async function purgeExpiredLimits(): Promise<number> {
  if (!isPostgresStorage()) return 0;
  const cutoff = new Date(Date.now() - DAY_MS);
  return prisma.$executeRaw`DELETE FROM "auth_rate_limits" WHERE "window_start" < ${cutoff}`;
}

/** A refusal that says nothing about whether the account exists. */
export function tooManyAttempts(result: LimitResult, message = "Zu viele Versuche. Bitte später erneut versuchen."): Response {
  return Response.json(
    { error: message },
    { status: 429, headers: { "Retry-After": String(result.retryAfterSeconds ?? 60), "Cache-Control": "no-store" } }
  );
}
