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

  describe.each([
    ["without history", "false"],
    ["with history", "true"],
  ])("a key problem %s", (_name, history) => {
    const seeded = async () => {
      vi.stubEnv("AMANAH_DATA_HISTORY", history);
      vi.stubEnv("AMANAH_DATA_KEYS", `a:${keyA}`);
      vi.stubEnv("AMANAH_DATA_KEY_ACTIVE", "a");
      vi.stubEnv("AMANAH_DATA_ENCRYPTION", "required");
      const { repo, user } = await freshUser();
      await repo.saveAmanahData(user.id, demoAmanahData);
      await repo.saveAmanahData(user.id, { ...demoAmanahData, userProfile: { ...demoAmanahData.userProfile, name: "Stand Zwei" } });
      const { prisma } = await import("@/lib/server/prisma");
      const snapshot = async () =>
        JSON.stringify([
          await prisma.amanahData.findUnique({ where: { userId: user.id } }),
          await prisma.amanahDataVersion.findMany({ where: { userId: user.id }, orderBy: { seq: "asc" } }),
        ]);
      return { repo, user, snapshot };
    };

    it.each([
      ["a wrong key", () => vi.stubEnv("AMANAH_DATA_KEYS", `a:${keyB}`)],
      ["no key", () => vi.stubEnv("AMANAH_DATA_KEYS", "")],
    ])("with %s, every write is rejected and the row stays byte-identical", async (_fault, fault) => {
      const { repo, user, snapshot } = await seeded();
      const before = await snapshot();
      const versions = await repo.listDataVersions(user.id);
      fault();
      const { DataEncryptionError } = await import("@/lib/server/data-encryption");
      await expect(repo.getAmanahData(user.id)).rejects.toBeInstanceOf(DataEncryptionError);
      await expect(repo.saveAmanahData(user.id, demoAmanahData)).rejects.toBeInstanceOf(DataEncryptionError);
      await expect(repo.patchAmanahData(user.id, { lastSaved: "x" } as never)).rejects.toBeInstanceOf(DataEncryptionError);
      if (versions[0]) await expect(repo.restoreDataVersion(user.id, versions[0].id)).rejects.toBeInstanceOf(DataEncryptionError);
      expect(await snapshot()).toBe(before);

      vi.stubEnv("AMANAH_DATA_KEYS", `a:${keyA}`);
      expect((await repo.getAmanahData(user.id))?.userProfile.name).toBe("Stand Zwei");
      await repo.deleteUser(user.id);
    });

    it("parallel partial writes lose nothing", async () => {
      const { repo, user } = await seeded();
      await Promise.all([
        repo.patchAmanahData(user.id, { emergencyCard: { ...demoAmanahData.emergencyCard, name: "Parallel A" } }),
        repo.patchAmanahData(user.id, { userProfile: { ...demoAmanahData.userProfile, name: "Parallel B" } }),
        repo.patchAmanahData(user.id, { familyMessage: { ...demoAmanahData.familyMessage, familyLetter: "Parallel C" } }),
      ]);
      const after = await repo.getAmanahData(user.id);
      expect(after?.emergencyCard.name).toBe("Parallel A");
      expect(after?.userProfile.name).toBe("Parallel B");
      expect(after?.familyMessage.familyLetter).toBe("Parallel C");
      await repo.deleteUser(user.id);
    });
  });

  it("the operator tool: a dry run reports a wrong key, and a rotation keeps a save made in between", async () => {
    vi.stubEnv("AMANAH_DATA_KEYS", `a:${keyA}`);
    vi.stubEnv("AMANAH_DATA_KEY_ACTIVE", "a");
    const { repo, user } = await freshUser();
    await repo.saveAmanahData(user.id, demoAmanahData);
    const only = { AMANAH_REENCRYPT_USER_IDS: user.id };

    const wrong = runScript([], { ...only, AMANAH_DATA_KEYS: `a:${keyB}`, AMANAH_DATA_KEY_ACTIVE: "a" });
    expect(wrong.status).toBe(1);
    expect(wrong.stdout).toContain('"failed":1');
    expect(`${wrong.stdout}${wrong.stderr}`).not.toContain(keyB);

    const { prisma } = await import("@/lib/server/prisma");
    const row = await prisma.$queryRaw<{ data: unknown }[]>`SELECT data FROM amanah_data WHERE user_id = ${user.id}`;
    // The script's conditional update, with the row changed after it was read.
    await repo.saveAmanahData(user.id, { ...demoAmanahData, userProfile: { ...demoAmanahData.userProfile, name: "Neuer Stand" } });
    const updated = await prisma.$executeRaw`UPDATE amanah_data SET data = ${JSON.stringify({ stale: true })}::jsonb WHERE user_id = ${user.id} AND data = ${JSON.stringify(row[0].data)}::jsonb`;
    expect(updated).toBe(0);
    expect((await repo.getAmanahData(user.id))?.userProfile.name).toBe("Neuer Stand");

    const rotate = runScript(["--apply"], { ...only, AMANAH_REENCRYPT_CONFIRM: "yes", AMANAH_DATA_KEYS: `a:${keyA},b:${keyB}`, AMANAH_DATA_KEY_ACTIVE: "b" });
    expect(rotate.status, rotate.stderr).toBe(0);
    vi.stubEnv("AMANAH_DATA_KEYS", `a:${keyA},b:${keyB}`);
    vi.stubEnv("AMANAH_DATA_KEY_ACTIVE", "b");
    expect((await repo.getAmanahData(user.id))?.userProfile.name).toBe("Neuer Stand");
    await repo.deleteUser(user.id);
  });
});
