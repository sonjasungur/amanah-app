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

  it("large synthetic folders save, encrypt and read back; the size report shows classes, not content", async () => {
    vi.stubEnv("AMANAH_DATA_KEYS", `a:${keyA}`);
    const { repo, user } = await setup();
    const huge = "ä".repeat(5 * 1024 * 1024);
    const started = Date.now();
    await repo.saveAmanahData(user.id, withLetter(huge));
    expect((await repo.getAmanahData(user.id))?.familyMessage.familyLetter).toBe(huge);
    expect(Date.now() - started).toBeLessThan(5000);
    const report = spawnSync("node", ["scripts/report-folder-sizes.mjs"], { cwd: process.cwd(), env: process.env, encoding: "utf8" });
    expect(report.status).toBe(0);
    expect(JSON.parse(report.stdout)["über 2,67 MiB"]).toBeGreaterThanOrEqual(1);
    expect(report.stdout).not.toContain(user.id);
    await repo.deleteUser(user.id);
  });

  it("an expired version is removed by the export and not returned", async () => {
    vi.stubEnv("AMANAH_DATA_HISTORY", "true");
    const { repo, user, age } = await setup();
    await repo.saveAmanahData(user.id, withLetter("alt"));
    await repo.saveAmanahData(user.id, withLetter("neu"));
    await age((HISTORY_RETENTION_DAYS + 1) * 24 * 60 * 60 * 1000);
    expect(await repo.exportDataVersions(user.id)).toEqual([]);
    expect(await repo.getDataVersion(user.id, "missing")).toBeNull();
    await repo.deleteUser(user.id);
  });

  it("a single version is reachable and deletable by its owner only; deleting takes older ones along", async () => {
    vi.stubEnv("AMANAH_DATA_HISTORY", "true");
    const a = await setup();
    const b = await setup();
    await a.repo.saveAmanahData(a.user.id, withLetter("eins"));
    await a.repo.saveAmanahData(a.user.id, withLetter("zwei"));
    await a.age();
    await a.repo.saveAmanahData(a.user.id, withLetter("drei"));
    const [newer, older] = await a.repo.listDataVersions(a.user.id);
    expect(await b.repo.getDataVersion(b.user.id, older.id)).toBeNull();
    expect(await b.repo.deleteDataVersionsUpTo(b.user.id, older.id)).toBe(false);
    expect(((await a.repo.getDataVersion(a.user.id, older.id))?.prior?.familyMessage as { familyLetter: string }).familyLetter).toBe("eins");
    expect(await a.repo.deleteDataVersionsUpTo(a.user.id, newer.id)).toBe(true);
    expect(await a.repo.listDataVersions(a.user.id)).toEqual([]);
    await a.repo.deleteUser(a.user.id);
    await b.repo.deleteUser(b.user.id);
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
    const { repo, prisma, user, age } = await setup();
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
    const count = () => prisma.amanahDataVersion.count({ where: { userId: user.id } });
    expect(await count()).toBeGreaterThan(0);
    expect(run("scripts/purge-data-history.mjs", ["--apply"], {}).status).toBe(2);
    expect(run("scripts/purge-data-history.mjs", ["--apply"], { AMANAH_PURGE_CONFIRM: "yes" }).status).toBe(0);
    expect(await count()).toBe(0);
    await repo.deleteUser(user.id);
  });
});

describe.runIf(runIntegration)("Postgres: deletion ledger replay", () => {
  afterEach(() => vi.unstubAllEnvs());

  async function ledger() {
    const { mkdtempSync } = await import("fs");
    const { tmpdir } = await import("os");
    const { join } = await import("path");
    const mod = await import("@/lib/server/deletion-ledger");
    const base = mkdtempSync(join(tmpdir(), "pgledger-"));
    const config = mod.readLedgerConfig({
      AMANAH_DELETION_LEDGER_DIR: join(base, "l"),
      AMANAH_DELETION_LEDGER_HEAD: join(base, "h", "head.json"),
      AMANAH_DELETION_LEDGER_KEYS: `a:${keyA}`,
      AMANAH_BACKUP_MAX_RETENTION_DAYS: "30",
    } as unknown as NodeJS.ProcessEnv);
    return { mod, config };
  }

  function dbFor(prisma: Awaited<ReturnType<typeof setup>>["prisma"], only: string[]) {
    return {
      rows: async () => only.map((id) => ({ id })),
      exec: (sql: string, params: unknown[]) => prisma.$executeRawUnsafe(sql, ...params),
    };
  }

  it("removes what was deleted, repeats harmlessly, and keeps what came afterwards", async () => {
    vi.stubEnv("AMANAH_DATA_HISTORY", "true");
    const { mod, config } = await ledger();
    const gone = await setup();
    const folder = await setup();
    const again = await setup();
    const withdrawn = await setup();
    const keep = await setup();
    for (const a of [gone, folder, again, withdrawn, keep]) {
      await a.repo.saveAmanahData(a.user.id, withLetter("alt"));
      await a.repo.saveAmanahData(a.user.id, withLetter("mit Version"));
      await a.repo.grantConsent(a.user.id, "sensitive_folder_storage", "v1");
    }
    const t = (ms: number) => new Date(Date.now() + ms);
    mod.recordDeletion(config, { kind: "account_deleted", userId: gone.user.id }, t(60_000));
    mod.recordDeletion(config, { kind: "folder_deleted", userId: folder.user.id }, t(60_000));
    mod.recordDeletion(config, { kind: "consent_withdrawn", userId: withdrawn.user.id, purpose: "sensitive_folder_storage" }, t(60_000));
    mod.recordDeletion(config, { kind: "folder_deleted", userId: withdrawn.user.id }, t(60_000));
    // Deleted first and saved anew afterwards: the new folder must stay.
    mod.recordDeletion(config, { kind: "folder_deleted", userId: again.user.id }, t(-60_000));

    const entries = mod.verifyLedger(config);
    const db = dbFor(gone.prisma, [gone, folder, again, withdrawn, keep].map((a) => a.user.id));
    const first = await mod.replayDeletions(db, config, entries);
    expect(first.accounts).toBe(1);
    expect(first.folders).toBe(2);
    expect(first.consents).toBe(1);
    expect(await mod.replayDeletions(dbFor(gone.prisma, [folder, again, withdrawn, keep].map((a) => a.user.id)), config, entries)).toEqual({ accounts: 0, folders: 0, versions: 0, consents: 0 });

    expect(await gone.repo.getUserById(gone.user.id)).toBeNull();
    expect(await folder.repo.getAmanahData(folder.user.id)).toBeNull();
    expect(await folder.prisma.amanahDataVersion.count({ where: { userId: folder.user.id } })).toBe(0);
    expect(await withdrawn.repo.getAmanahData(withdrawn.user.id)).toBeNull();
    expect((await withdrawn.repo.listConsents(withdrawn.user.id))[0].revokedAt).toBeTruthy();
    expect((await again.repo.getAmanahData(again.user.id))?.familyMessage.familyLetter).toBe("mit Version");
    expect((await keep.repo.getAmanahData(keep.user.id))?.familyMessage.familyLetter).toBe("mit Version");
    expect((await keep.repo.listConsents(keep.user.id))[0].revokedAt).toBeNull();
    for (const a of [folder, again, withdrawn, keep]) await a.repo.deleteUser(a.user.id);
  });
});
