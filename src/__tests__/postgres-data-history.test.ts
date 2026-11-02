import { spawnSync } from "child_process";
import { afterEach, describe, expect, it, vi } from "vitest";
import { defaultAmanahData } from "@/lib/domain/defaults";
import type { AmanahOrdnerData } from "@/lib/domain/types";
import { isEncryptedEnvelope } from "@/lib/server/data-encryption";
import { HISTORY_RETENTION_DAYS } from "@/lib/server/data-history";

/** Throwaway Postgres only (DATABASE_URL + AMANAH_SERVER_STORAGE=postgres); synthetic data. */
const runIntegration = Boolean(process.env.DATABASE_URL && process.env.AMANAH_SERVER_STORAGE === "postgres");
const keyA = Buffer.alloc(32, 5).toString("base64");
const keyB = Buffer.alloc(32, 6).toString("base64");
const withLetter = (familyLetter: string): AmanahOrdnerData => ({ ...defaultAmanahData, familyMessage: { ...defaultAmanahData.familyMessage, familyLetter } });

async function setup() {
  const { PostgresRepository } = await import("@/lib/server/repository/postgres-repository");
  const { prisma } = await import("@/lib/server/prisma");
  const repo = new PostgresRepository();
  const user = await repo.registerUser(`pghist-${crypto.randomUUID()}@test.invalid`, "testpass1", "PG Hist");
  if ("error" in user) throw new Error(user.error);
  /** Leaves the coalescing window, as if time had passed. */
  const age = (ms = 20 * 60 * 1000) => prisma.$executeRaw`UPDATE amanah_data_versions SET created_at = created_at - make_interval(secs => ${ms / 1000}) WHERE user_id = ${user.id}`;
  return { repo, prisma, user, age };
}

describe.runIf(runIntegration)("Postgres: change history", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("writes nothing while switched off", async () => {
    const { repo, prisma, user } = await setup();
    await repo.saveAmanahData(user.id, withLetter("a"));
    await repo.saveAmanahData(user.id, withLetter("b"));
    expect(await prisma.amanahDataVersion.count({ where: { userId: user.id } })).toBe(0);
    await repo.deleteUser(user.id);
  });

  it("records, seals, restores across changes and can undo", async () => {
    vi.stubEnv("AMANAH_DATA_HISTORY", "true");
    vi.stubEnv("AMANAH_DATA_KEYS", `a:${keyA}`);
    const { repo, prisma, user, age } = await setup();
    await repo.saveAmanahData(user.id, withLetter("eins"));
    await repo.saveAmanahData(user.id, withLetter("zwei"));
    await age();
    await repo.saveAmanahData(user.id, withLetter("drei"));
    await age();
    const versions = await repo.listDataVersions(user.id);
    expect(versions.map((v) => v.sections)).toEqual([["familyMessage"], ["familyMessage"]]);

    const raw = await prisma.amanahDataVersion.findMany({ where: { userId: user.id } });
    for (const row of raw) {
      expect(isEncryptedEnvelope(row.data)).toBe(true);
      expect(JSON.stringify(row.data)).not.toMatch(/eins|zwei|familyMessage/);
    }

    const restored = await repo.restoreDataVersion(user.id, versions.at(-1)!.id);
    expect(restored?.familyMessage.familyLetter).toBe("eins");
    expect((await repo.getAmanahData(user.id))?.familyMessage.familyLetter).toBe("eins");
    const [undo] = await repo.listDataVersions(user.id);
    expect(undo.changeType).toBe("restore");
    await repo.restoreDataVersion(user.id, undo.id);
    expect((await repo.getAmanahData(user.id))?.familyMessage.familyLetter).toBe("drei");
    await repo.deleteUser(user.id);
  });

  it("keeps accounts apart: a foreign version id does nothing, a copied row cannot be read", async () => {
    vi.stubEnv("AMANAH_DATA_HISTORY", "true");
    vi.stubEnv("AMANAH_DATA_KEYS", `a:${keyA}`);
    const a = await setup();
    const b = await setup();
    await a.repo.saveAmanahData(a.user.id, withLetter("a alt"));
    await a.repo.saveAmanahData(a.user.id, withLetter("a neu"));
    await b.repo.saveAmanahData(b.user.id, withLetter("b"));
    const [version] = await a.repo.listDataVersions(a.user.id);
    expect(await b.repo.restoreDataVersion(b.user.id, version.id)).toBeNull();
    expect((await b.repo.getAmanahData(b.user.id))?.familyMessage.familyLetter).toBe("b");
    expect(await b.repo.listDataVersions(b.user.id)).toEqual([]);

    const row = await a.prisma.amanahDataVersion.findFirstOrThrow({ where: { userId: a.user.id } });
    await a.prisma.amanahDataVersion.create({ data: { userId: b.user.id, seq: row.seq, changeType: "save", sizeBytes: row.sizeBytes, data: row.data as object } });
    const [copied] = await b.repo.listDataVersions(b.user.id);
    expect(copied.sections).toEqual([]);
    await expect(b.repo.restoreDataVersion(b.user.id, copied.id)).rejects.toThrow();
    await a.repo.deleteUser(a.user.id);
    await b.repo.deleteUser(b.user.id);
  });

  it("concurrent saves leave one consistent sequence and no error", async () => {
    vi.stubEnv("AMANAH_DATA_HISTORY", "true");
    const { repo, prisma, user } = await setup();
    await repo.saveAmanahData(user.id, withLetter("start"));
    await Promise.all(["a", "b", "c", "d", "e"].map((t) => repo.saveAmanahData(user.id, withLetter(t))));
    const rows = await prisma.amanahDataVersion.findMany({ where: { userId: user.id } });
    expect(rows).toHaveLength(1);
    const versions = await repo.exportDataVersions(user.id);
    expect((versions[0].prior?.familyMessage as { familyLetter: string }).familyLetter).toBe("start");
    await repo.deleteUser(user.id);
  });

  it("is removed with the folder, the account, the history delete and at the end of retention", async () => {
    vi.stubEnv("AMANAH_DATA_HISTORY", "true");
    const { repo, prisma, user, age } = await setup();
    const count = () => prisma.amanahDataVersion.count({ where: { userId: user.id } });
    const fill = async () => {
      await repo.saveAmanahData(user.id, withLetter(crypto.randomUUID()));
      await repo.saveAmanahData(user.id, withLetter(crypto.randomUUID()));
    };
    await fill();
    expect(await count()).toBeGreaterThan(0);
    await repo.deleteDataVersions(user.id);
    expect(await count()).toBe(0);

    await fill();
    await repo.deleteAmanahData(user.id);
    expect(await count()).toBe(0);

    await fill();
    await fill();
    await age((HISTORY_RETENTION_DAYS + 1) * 24 * 60 * 60 * 1000);
    expect(await repo.listDataVersions(user.id)).toEqual([]);
    expect(await repo.purgeExpiredDataVersions()).toBeGreaterThan(0);
    expect(await count()).toBe(0);

    await fill();
    await repo.deleteUser(user.id);
    expect(await count()).toBe(0);
  });

  it("key rotation covers the history; the purge script is a dry run by default", async () => {
    vi.stubEnv("AMANAH_DATA_HISTORY", "true");
    vi.stubEnv("AMANAH_DATA_KEYS", `a:${keyA}`);
    const { repo, user, age } = await setup();
    await repo.saveAmanahData(user.id, withLetter("alt"));
    await repo.saveAmanahData(user.id, withLetter("neu"));
    const run = (script: string, args: string[], env: Record<string, string>) =>
      spawnSync("node", [script, ...args], { cwd: process.cwd(), env: { ...process.env, ...env }, encoding: "utf8" });

    const keys = { AMANAH_DATA_KEYS: `a:${keyA},b:${keyB}`, AMANAH_DATA_KEY_ACTIVE: "b", AMANAH_REENCRYPT_USER_IDS: user.id, AMANAH_REENCRYPT_CONFIRM: "yes" };
    const rotated = run("scripts/reencrypt-amanah-data.mjs", ["--apply"], keys);
    expect(rotated.status).toBe(0);
    expect(rotated.stdout).toContain('"rewrap":2');
    vi.stubEnv("AMANAH_DATA_KEYS", `b:${keyB}`);
    const [version] = await repo.listDataVersions(user.id);
    expect(version.sections).toEqual(["familyMessage"]);
    expect((await repo.restoreDataVersion(user.id, version.id))?.familyMessage.familyLetter).toBe("alt");

    await age((HISTORY_RETENTION_DAYS + 1) * 24 * 60 * 60 * 1000);
    const dry = run("scripts/purge-data-history.mjs", [], {});
    expect(dry.status).toBe(0);
    expect(dry.stdout).toContain("dry run");
    const count = () => repo.exportDataVersions(user.id);
    expect((await count()).length).toBeGreaterThan(0);
    expect(run("scripts/purge-data-history.mjs", ["--apply"], {}).status).toBe(2);
    expect(run("scripts/purge-data-history.mjs", ["--apply"], { AMANAH_PURGE_CONFIRM: "yes" }).status).toBe(0);
    expect(await count()).toEqual([]);
    await repo.deleteUser(user.id);
  });
});
