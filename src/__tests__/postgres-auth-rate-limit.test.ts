import { describe, expect, it } from "vitest";

/** Throwaway Postgres only (DATABASE_URL + AMANAH_SERVER_STORAGE=postgres); no personal data. */
const runIntegration = Boolean(process.env.DATABASE_URL && process.env.AMANAH_SERVER_STORAGE === "postgres");

describe.runIf(runIntegration)("Postgres: login and registration limits", () => {
  it("parallel attempts cannot slip past the limit", async () => {
    const { consumeLimits, MINUTE } = await import("@/lib/server/auth-rate-limit");
    const rule = { scope: "test:parallel", subject: crypto.randomUUID(), max: 10, windowMs: MINUTE };
    const results = await Promise.all(Array.from({ length: 40 }, () => consumeLimits([rule])));
    expect(results.filter((r) => r.allowed)).toHaveLength(10);
  });

  it("holds across a restart and across a second instance with its own connection", async () => {
    const { consumeLimits, MINUTE } = await import("@/lib/server/auth-rate-limit");
    const { resetMemoryAuthLimits } = await import("@/lib/server/auth-rate-limit-memory");
    const rule = { scope: "test:instances", subject: crypto.randomUUID(), max: 3, windowMs: MINUTE };
    for (let i = 0; i < 3; i++) expect((await consumeLimits([rule])).allowed).toBe(true);
    resetMemoryAuthLimits(); // a restarted process has no counters of its own

    const { PrismaPg } = await import("@prisma/adapter-pg");
    const { PrismaClient } = await import("@/generated/prisma/client");
    const other = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
    const { limitKey } = await import("@/lib/server/auth-rate-limit");
    const rows = await other.$queryRaw<{ count: number }[]>`SELECT "count" FROM "auth_rate_limits" WHERE "key" = ${limitKey(rule.scope, rule.subject)}`;
    expect(Number(rows[0].count)).toBe(3);
    await other.$disconnect();

    expect((await consumeLimits([rule])).allowed).toBe(false);
  });

  it("a window that ended starts again from one, and expired rows are purged", async () => {
    const { consumeLimits, limitKey, purgeExpiredLimits } = await import("@/lib/server/auth-rate-limit");
    const { prisma } = await import("@/lib/server/prisma");
    const rule = { scope: "test:window", subject: crypto.randomUUID(), max: 1, windowMs: 1_000 };
    expect((await consumeLimits([rule])).allowed).toBe(true);
    expect((await consumeLimits([rule])).allowed).toBe(false);
    await prisma.$executeRaw`UPDATE "auth_rate_limits" SET "window_start" = CURRENT_TIMESTAMP - interval '2 days' WHERE "key" = ${limitKey(rule.scope, rule.subject)}`;
    expect((await consumeLimits([rule])).allowed).toBe(true);
    await prisma.$executeRaw`UPDATE "auth_rate_limits" SET "window_start" = CURRENT_TIMESTAMP - interval '2 days' WHERE "key" = ${limitKey(rule.scope, rule.subject)}`;
    expect(await purgeExpiredLimits()).toBeGreaterThanOrEqual(1);
    const left = await prisma.$queryRaw<unknown[]>`SELECT 1 FROM "auth_rate_limits" WHERE "key" = ${limitKey(rule.scope, rule.subject)}`;
    expect(left).toHaveLength(0);
  });
});
