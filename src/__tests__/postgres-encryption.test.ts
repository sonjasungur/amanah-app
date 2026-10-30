import { spawnSync } from "child_process";
import { afterEach, describe, expect, it, vi } from "vitest";
import { demoAmanahData } from "@/lib/domain/demo-data";
import { isEncryptedEnvelope } from "@/lib/server/data-encryption";

/**
 * Runs only against a throwaway Postgres (DATABASE_URL + AMANAH_SERVER_STORAGE=postgres).
 * Synthetic data only; keys are generated for the test run.
 */
const runIntegration = Boolean(process.env.DATABASE_URL && process.env.AMANAH_SERVER_STORAGE === "postgres");
const keyA = Buffer.alloc(32, 3).toString("base64");
const keyB = Buffer.alloc(32, 4).toString("base64");

async function freshUser() {
  const { PostgresRepository } = await import("@/lib/server/repository/postgres-repository");
  const repo = new PostgresRepository();
  const user = await repo.registerUser(`pgenc-${crypto.randomUUID()}@test.invalid`, "testpass1", "PG Enc");
  if ("error" in user) throw new Error(user.error);
  return { repo, user };
}

function runScript(args: string[], env: Record<string, string>) {
  return spawnSync("node", ["scripts/reencrypt-amanah-data.mjs", ...args], {
    cwd: process.cwd(),
    env: { ...process.env, ...env },
    encoding: "utf8",
  });
}

describe.runIf(runIntegration)("Postgres: data encryption at rest", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("stores only ciphertext in amanah_data and reads it back for the owner", async () => {
    vi.stubEnv("AMANAH_DATA_KEYS", `a:${keyA}`);
    vi.stubEnv("AMANAH_DATA_KEY_ACTIVE", "a");
    const { repo, user } = await freshUser();
    await repo.saveAmanahData(user.id, demoAmanahData);

    const { prisma } = await import("@/lib/server/prisma");
    const row = await prisma.amanahData.findUnique({ where: { userId: user.id } });
    expect(isEncryptedEnvelope(row?.data)).toBe(true);
    expect(JSON.stringify(row?.data)).not.toContain("Ahmed Demo");
    expect((await repo.getAmanahData(user.id))?.userProfile.name).toBe("Ahmed Demo");
    await repo.deleteUser(user.id);
  });

  it("migrates legacy plaintext rows and rotates keys with the operator script", async () => {
    vi.stubEnv("AMANAH_DATA_ENCRYPTION", "optional");
    vi.stubEnv("AMANAH_DATA_KEYS", "");
    const { repo, user } = await freshUser();
    await repo.saveAmanahData(user.id, demoAmanahData); // legacy plaintext row
    const { prisma } = await import("@/lib/server/prisma");
    const read = async () => (await prisma.amanahData.findUnique({ where: { userId: user.id } }))?.data;
    expect(isEncryptedEnvelope(await read())).toBe(false);
    // Other test files share this database — touch only this user's row.
    const only = { AMANAH_REENCRYPT_USER_IDS: user.id };

    const dry = runScript([], { ...only, AMANAH_DATA_KEYS: `a:${keyA}`, AMANAH_DATA_KEY_ACTIVE: "a" });
    expect(dry.status, dry.stderr).toBe(0);
    expect(dry.stdout).toContain("dry run");
    expect(isEncryptedEnvelope(await read())).toBe(false);

    const refused = runScript(["--apply"], { ...only, AMANAH_DATA_KEYS: `a:${keyA}` });
    expect(refused.status).toBe(2);

    const applied = runScript(["--apply"], { ...only, AMANAH_DATA_KEYS: `a:${keyA}`, AMANAH_DATA_KEY_ACTIVE: "a", AMANAH_REENCRYPT_CONFIRM: "yes" });
    expect(applied.status, applied.stderr).toBe(0);
    expect(applied.stdout + applied.stderr).not.toContain("Ahmed Demo");
    const encrypted = await read();
    expect(isEncryptedEnvelope(encrypted) && encrypted.kid).toBe("a");

    const rotated = runScript(["--apply"], { ...only, AMANAH_DATA_KEYS: `a:${keyA},b:${keyB}`, AMANAH_DATA_KEY_ACTIVE: "b", AMANAH_REENCRYPT_CONFIRM: "yes" });
    expect(rotated.status, rotated.stderr).toBe(0);
    const afterRotation = await read();
    expect(isEncryptedEnvelope(afterRotation) && afterRotation.kid).toBe("b");

    vi.stubEnv("AMANAH_DATA_KEYS", `b:${keyB}`);
    vi.stubEnv("AMANAH_DATA_KEY_ACTIVE", "b");
    expect((await repo.getAmanahData(user.id))?.userProfile.name).toBe("Ahmed Demo");
    await repo.deleteUser(user.id);
  });

  it("deleteUser removes user, sessions and data rows", async () => {
    vi.stubEnv("AMANAH_DATA_KEYS", `a:${keyA}`);
    const { repo, user } = await freshUser();
    const session = await repo.createSession(user.id);
    await repo.saveAmanahData(user.id, demoAmanahData);
    await repo.deleteUser(user.id);
    const { prisma } = await import("@/lib/server/prisma");
    expect(await prisma.user.findUnique({ where: { id: user.id } })).toBeNull();
    expect(await prisma.amanahData.findUnique({ where: { userId: user.id } })).toBeNull();
    expect(await repo.getSessionByToken(session.token)).toBeNull();
  });
});
