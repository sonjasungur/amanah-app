import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Replays the migrations in a throwaway schema: accounts from before e-mail confirmation
 * must end up as legacy (unverified), real confirmations must stay untouched.
 * Throwaway Postgres only (DATABASE_URL + AMANAH_SERVER_STORAGE=postgres); synthetic data.
 */
const runIntegration = Boolean(process.env.DATABASE_URL && process.env.AMANAH_SERVER_STORAGE === "postgres");

function statements(migration: string): string[] {
  const sql = readFileSync(path.join(process.cwd(), "prisma/migrations", migration, "migration.sql"), "utf8");
  return sql
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n")
    .split(/;\s*\n/)
    .map((s) => s.trim().replace(/;$/, ""))
    .filter(Boolean);
}

describe.runIf(runIntegration)("Postgres: migration of legacy accounts", () => {
  it("revokes the blanket confirmation and marks only legacy accounts", async () => {
    const { prisma } = await import("@/lib/server/prisma");
    const schema = `legacy_mig_${crypto.randomUUID().replaceAll("-", "")}`;
    try {
      const rows = await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
        await tx.$executeRawUnsafe(`SET LOCAL search_path TO "${schema}"`);
        const run = async (migration: string) => {
          for (const statement of statements(migration)) await tx.$executeRawUnsafe(statement);
        };
        await run("20260705105925_init");
        await tx.$executeRawUnsafe(
          `INSERT INTO users (id, email, name, password_hash, created_at, updated_at) VALUES ('old', 'old@test.invalid', 'Alt', 'x', '2026-01-01', '2026-01-01')`
        );
        await run("20261030125505_consent_and_auth_tokens");
        // Accounts created with the new flow between the two migrations (pre-release test systems),
        // including one that never received a link because mail was disabled.
        await tx.$executeRawUnsafe(
          `INSERT INTO users (id, email, name, password_hash, created_at, updated_at, email_verified_at) VALUES
           ('confirmed', 'c@test.invalid', 'C', 'x', '2026-10-30 10:00', '2026-10-30', '2026-10-30 10:05'),
           ('pending', 'p@test.invalid', 'P', 'x', '2026-10-30 11:00', '2026-10-30', NULL),
           ('nomail', 'n@test.invalid', 'N', 'x', '2026-10-30 12:00', '2026-10-30', NULL)`
        );
        await tx.$executeRawUnsafe(
          `INSERT INTO auth_tokens (id, token_hash, user_id, purpose, expires_at) VALUES ('t1', 'h1', 'pending', 'verify_email', '2026-10-31')`
        );
        await run("20261030133500_billing_sandbox");
        await run("20261031090000_legacy_email_verification");
        return tx.$queryRawUnsafe<{ id: string; verified: boolean; legacy: boolean }[]>(
          `SELECT id, email_verified_at IS NOT NULL AS verified, email_verification_legacy_at IS NOT NULL AS legacy FROM users ORDER BY id`
        );
      });
      expect(rows).toEqual([
        { id: "confirmed", verified: true, legacy: false },
        { id: "nomail", verified: false, legacy: false },
        { id: "old", verified: false, legacy: true },
        { id: "pending", verified: false, legacy: false },
      ]);
    } finally {
      await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    }
  });
});
