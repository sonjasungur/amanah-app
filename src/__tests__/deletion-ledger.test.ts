import { mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE as accountDELETE } from "@/app/api/account/route";
import { DELETE as amanahDELETE, PUT as amanahPUT } from "@/app/api/amanah/route";
import { DELETE as consentDELETE } from "@/app/api/consent/route";
import { resetRateLimits } from "@/lib/ai/rate-limit";
import { withDeletionLedger, enforceDeletionLedger } from "@/lib/server/deletion-gate";
import {
  acceptLedgerLoss,
  assertBackupCovered,
  cancelDeletion,
  initLedger,
  isDeletionLedgerEnabled,
  isRestorePending,
  ledgerCoversFrom,
  lockForRestore,
  openLedger,
  pseudonymFor,
  purgeLedger,
  readLedgerConfig,
  recordDeletion,
  replayDeletions,
  unlockAfterRestore,
  verifyLedger,
  type LedgerConfig,
  type ReplayDb,
} from "@/lib/server/deletion-ledger";
import { clearOutbox } from "@/lib/server/mailer";
import { getServerRepository, resetServerRepository } from "@/lib/server/repository";
import type { ServerRepository } from "@/lib/server/repository/types";
import { browserRequest, registerVerified } from "./session-helpers";

const KEY_A = Buffer.alloc(32, 1).toString("base64");
const KEY_B = Buffer.alloc(32, 2).toString("base64");
const DAY = 864e5;
let base: string;

function envFor(over: Record<string, string> = {}): NodeJS.ProcessEnv {
  return {
    AMANAH_DELETION_LEDGER: "required",
    AMANAH_DELETION_LEDGER_DIR: join(base, "ledger"),
    AMANAH_DELETION_LEDGER_HEAD: join(base, "other", "head.json"),
    AMANAH_DELETION_LEDGER_KEYS: `a:${KEY_A}`,
    AMANAH_BACKUP_MAX_RETENTION_DAYS: "30",
    ...over,
  } as unknown as NodeJS.ProcessEnv;
}

const config = (over: Record<string, string> = {}): LedgerConfig => readLedgerConfig(envFor(over));
const file = () => join(base, "ledger", "deletions.jsonl");
const event = (userId = "user-1") => ({ kind: "account_deleted" as const, userId });

beforeEach(() => {
  base = mkdtempSync(join(tmpdir(), "ledger-"));
});
afterEach(() => {
  rmSync(base, { recursive: true, force: true });
  vi.unstubAllEnvs();
});

describe("configuration", () => {
  it("is off by default and in every example file", () => {
    expect(isDeletionLedgerEnabled({} as NodeJS.ProcessEnv)).toBe(false);
    for (const name of [".env.example", ".env.production.example", ".env.staging.example"]) {
      expect(readFileSync(name, "utf8"), name).not.toMatch(/^AMANAH_DELETION_LEDGER=required/m);
    }
  });

  it("refuses to run without keys, paths or a backup retention, and has no unlimited default", () => {
    for (const missing of ["AMANAH_DELETION_LEDGER_DIR", "AMANAH_DELETION_LEDGER_HEAD", "AMANAH_DELETION_LEDGER_KEYS", "AMANAH_BACKUP_MAX_RETENTION_DAYS"]) {
      expect(() => readLedgerConfig(envFor({ [missing]: "" })), missing).toThrow("config_invalid");
    }
    expect(() => config({ AMANAH_BACKUP_MAX_RETENTION_DAYS: "99999" })).toThrow("config_invalid");
    expect(() => config({ AMANAH_DELETION_LEDGER_KEYS: "a:short" })).toThrow("config_invalid");
  });

  it("the head must not lie next to the ledger", () => {
    expect(() => config({ AMANAH_DELETION_LEDGER_HEAD: join(base, "ledger", "head.json") })).toThrow("config_invalid");
  });

  it("couples the retention to the backup retention, with a small margin", () => {
    expect(config({ AMANAH_BACKUP_MAX_RETENTION_DAYS: "30" }).retentionDays).toBe(37);
  });
});

describe("content", () => {
  it("holds no id, name or e-mail, and the pseudonym needs the key", () => {
    const c = config();
    recordDeletion(c, { kind: "account_deleted", userId: "user-klartext-id" });
    const raw = readFileSync(file(), "utf8");
    expect(raw).not.toContain("user-klartext-id");
    expect(raw).not.toContain("@");
    expect(pseudonymFor(c, "user-1")).not.toBe(pseudonymFor(config({ AMANAH_DELETION_LEDGER_KEYS: `b:${KEY_B}` }), "user-1"));
    expect(pseudonymFor(c, "user-1")).not.toBe(pseudonymFor(c, "user-2"));
    expect(pseudonymFor(c, "user-1")).toBe(pseudonymFor(c, "user-1"));
  });
});

describe("manipulation and loss are noticed", () => {
  function filled() {
    const c = config();
    recordDeletion(c, event("u1"));
    recordDeletion(c, event("u2"));
    recordDeletion(c, event("u3"));
    return c;
  }
  const lines = () => readFileSync(file(), "utf8").split("\n").filter(Boolean);

  it("accepts an intact ledger", () => {
    expect(verifyLedger(filled())).toHaveLength(4);
  });

  it("a changed entry", () => {
    const c = filled();
    const all = lines();
    const entry = JSON.parse(all[2]);
    entry.at = "2000-01-01T00:00:00.000Z";
    all[2] = JSON.stringify(entry);
    writeFileSync(file(), `${all.join("\n")}\n`);
    expect(() => verifyLedger(c)).toThrow("ledger_tampered");
  });

  it("a removed entry in the middle", () => {
    const c = filled();
    const all = lines();
    all.splice(2, 1);
    writeFileSync(file(), `${all.join("\n")}\n`);
    expect(() => verifyLedger(c)).toThrow("ledger_tampered");
  });

  it("a cut-off end, found through the head", () => {
    const c = filled();
    writeFileSync(file(), `${lines().slice(0, -1).join("\n")}\n`);
    expect(() => verifyLedger(c)).toThrow("ledger_truncated");
  });

  it("a cut-off end together with an old head, found through the database anchor", () => {
    const c = filled();
    const headBefore = readFileSync(join(base, "other", "head.json"), "utf8");
    const before = readFileSync(file(), "utf8");
    recordDeletion(c, event("u4"));
    writeFileSync(file(), before);
    writeFileSync(join(base, "other", "head.json"), headBefore);
    expect(() => verifyLedger(c, { epoch: 1, seq: 5 })).toThrow("ledger_truncated");
  });

  it("a forged entry without the key", () => {
    const c = filled();
    const all = lines();
    const last = JSON.parse(all.at(-1)!);
    all.push(JSON.stringify({ ...last, seq: last.seq + 1, prev: last.mac, mac: "AAAA" }));
    writeFileSync(file(), `${all.join("\n")}\n`);
    expect(() => verifyLedger(c)).toThrow("ledger_tampered");
  });

  it("a missing ledger when the head or the anchor knows it existed", () => {
    const c = filled();
    renameSync(file(), `${file()}.gone`);
    expect(() => verifyLedger(c)).toThrow("ledger_lost");
    rmSync(join(base, "other", "head.json"));
    expect(() => verifyLedger(c, { epoch: 1, seq: 4 })).toThrow("ledger_lost");
    expect(verifyLedger(c, null)).toEqual([]);
  });

  it("a missing head", () => {
    const c = filled();
    rmSync(join(base, "other", "head.json"));
    expect(() => verifyLedger(c)).toThrow("head_missing");
  });

  it("a changed head", () => {
    const c = filled();
    const head = JSON.parse(readFileSync(join(base, "other", "head.json"), "utf8"));
    writeFileSync(join(base, "other", "head.json"), JSON.stringify({ ...head, seq: 1 }));
    expect(() => verifyLedger(c)).toThrow("ledger_tampered");
  });

  it("a crash between ledger and head repairs itself", () => {
    const c = filled();
    const headBefore = readFileSync(join(base, "other", "head.json"), "utf8");
    recordDeletion(c, event("u4"));
    writeFileSync(join(base, "other", "head.json"), headBefore);
    expect(verifyLedger(c)).toHaveLength(5);
    expect(JSON.parse(readFileSync(join(base, "other", "head.json"), "utf8")).seq).toBe(5);
  });
});

describe("accepting a loss", () => {
  it("is a new epoch and refuses older backups", () => {
    const c = config();
    recordDeletion(c, event());
    renameSync(file(), `${file()}.gone`);
    const now = new Date("2026-11-02T12:00:00Z");
    const entries = acceptLedgerLoss(c, { epoch: 1, seq: 2 }, now);
    expect(entries[0].epoch).toBe(2);
    expect(verifyLedger(c, { epoch: 2, seq: 1 })).toHaveLength(1);
    expect(() => assertBackupCovered(entries, new Date("2026-11-01T00:00:00Z"))).toThrow("backup_not_covered");
    expect(() => assertBackupCovered(entries, new Date("2026-11-03T00:00:00Z"))).not.toThrow();
  });
});

describe("key rotation", () => {
  it("old entries stay valid and replayable; a removed old key stops the start", async () => {
    const old = config();
    const before = recordDeletion(old, event("u-old"));
    const rotated = config({ AMANAH_DELETION_LEDGER_KEYS: `a:${KEY_A},b:${KEY_B}`, AMANAH_DELETION_LEDGER_KEY_ACTIVE: "b" });
    const after = recordDeletion(rotated, event("u-new"));
    expect(before.kid).toBe("a");
    expect(after.kid).toBe("b");
    const entries = verifyLedger(rotated);
    expect(entries).toHaveLength(3);

    const deleted: string[] = [];
    const db: ReplayDb = {
      rows: async () => [{ id: "u-old" }, { id: "u-new" }, { id: "u-keep" }],
      exec: async (_sql, params) => {
        deleted.push(params[0] as string);
        return 1;
      },
    };
    await replayDeletions(db, rotated, entries);
    expect(deleted.sort()).toEqual(["u-new", "u-old"]);

    expect(() => verifyLedger(config({ AMANAH_DELETION_LEDGER_KEYS: `b:${KEY_B}` }))).toThrow("unknown_key");
    purgeLedger(rotated, new Date(Date.now() + 100 * DAY));
    expect(verifyLedger(rotated).at(-1)?.type).toBe("checkpoint");
  });
});

describe("retention", () => {
  it("removes old entries, keeps recent ones valid, and states what is no longer covered", () => {
    const c = config();
    const start = new Date("2026-01-01T00:00:00Z");
    initLedger(c, start);
    recordDeletion(c, event("old"), new Date("2026-01-02T00:00:00Z"));
    const recentAt = new Date("2026-03-01T00:00:00Z");
    recordDeletion(c, event("recent"), recentAt);
    const now = new Date("2026-03-10T00:00:00Z");
    expect(purgeLedger(c, now)).toBe(1);
    const entries = verifyLedger(c);
    expect(entries.map((e) => e.type)).toEqual(["checkpoint", "account_deleted"]);
    expect(entries[1].subject).toBe(pseudonymFor(c, "recent"));
    const covered = new Date(now.getTime() - 37 * DAY);
    expect(ledgerCoversFrom(entries)).toEqual(covered);
    expect(() => assertBackupCovered(entries, new Date(covered.getTime() - 1000))).toThrow("backup_not_covered");
    expect(() => assertBackupCovered(entries, new Date(covered.getTime() + 1000))).not.toThrow();
    expect(purgeLedger(c, now)).toBe(0);
    recordDeletion(c, event("next"), now);
    expect(verifyLedger(c, { epoch: 1, seq: entries.at(-1)!.seq })).toHaveLength(3);
  });

  it("a cancellation follows its deletion", async () => {
    const c = config();
    initLedger(c, new Date("2026-01-01T00:00:00Z"));
    const recent = recordDeletion(c, event("x"), new Date("2026-03-01T00:00:00Z"));
    cancelDeletion(c, recent.seq, new Date("2026-03-01T00:00:01Z"));
    purgeLedger(c, new Date("2026-03-02T00:00:00Z"));
    purgeLedger(c, new Date("2026-03-20T00:00:00Z"));
    const entries = verifyLedger(c);
    const exec = vi.fn(async () => 1);
    await replayDeletions({ rows: async () => [{ id: "x" }], exec }, c, entries);
    expect(exec).not.toHaveBeenCalled();
  });
});

describe("replay", () => {
  it("skips cancelled deletions and unknown accounts, and carries the kind's condition", async () => {
    const c = config();
    recordDeletion(c, { kind: "account_deleted", userId: "gone" });
    const cancelled = recordDeletion(c, { kind: "folder_deleted", userId: "kept" });
    cancelDeletion(c, cancelled.seq);
    recordDeletion(c, { kind: "consent_withdrawn", userId: "w", purpose: "sensitive_folder_storage" });
    const calls: string[] = [];
    await replayDeletions(
      { rows: async () => [{ id: "kept" }, { id: "w" }], exec: async (sql) => (calls.push(sql), 1) },
      c,
      verifyLedger(c),
    );
    expect(calls).toHaveLength(1);
    expect(calls[0]).toContain("UPDATE consent_records");
  });
});

describe("restore lock", () => {
  it("is set and cleared", () => {
    const c = config();
    expect(isRestorePending(c)).toBe(false);
    lockForRestore(c);
    expect(isRestorePending(c)).toBe(true);
    unlockAfterRestore(c);
    expect(isRestorePending(c)).toBe(false);
  });

  it("stops the start while set", async () => {
    const env = envFor();
    for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value as string);
    lockForRestore(config());
    await expect(enforceDeletionLedger()).rejects.toThrow("restore_pending");
  });

  it("does nothing while switched off", async () => {
    await expect(enforceDeletionLedger()).resolves.toBeUndefined();
  });
});

describe("recording around a deletion", () => {
  const fakeRepo = (over: Partial<ServerRepository> = {}) => ({ deleteUser: vi.fn(async () => undefined), ...over }) as unknown as ServerRepository;

  it("nothing is deleted if recording fails", async () => {
    const c = config();
    recordDeletion(c, event());
    writeFileSync(file(), "broken\n");
    const repo = fakeRepo();
    await expect(withDeletionLedger(repo, c).deleteUser("u")).rejects.toThrow("ledger_tampered");
    expect(repo.deleteUser).not.toHaveBeenCalled();
  });

  it("a failed deletion is cancelled and its error passed on", async () => {
    const c = config();
    const repo = fakeRepo({ deleteUser: vi.fn(async () => Promise.reject(new Error("db"))) });
    await expect(withDeletionLedger(repo, c).deleteUser("u")).rejects.toThrow("db");
    expect(verifyLedger(c).map((e) => e.type)).toEqual(["genesis", "account_deleted", "cancelled"]);
  });
});

describe("through the real routes", () => {
  const BASE = "http://localhost";
  const json = (method: string, body?: unknown) => ({ method, headers: { "Content-Type": "application/json" }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });

  beforeEach(() => {
    resetRateLimits();
    resetServerRepository();
    clearOutbox();
    globalThis.__amanahMemoryStore = undefined;
    delete process.env.AMANAH_SERVER_STORAGE;
    delete process.env.DATABASE_URL;
    for (const [key, value] of Object.entries(envFor())) vi.stubEnv(key, value as string);
  });
  afterEach(() => resetServerRepository());

  it("records folder deletion, consent withdrawal and account deletion, without personal data", async () => {
    const email = `ledger-${crypto.randomUUID()}@test.invalid`;
    const cookie = await registerVerified(BASE, email, "testpass1");
    await amanahPUT(browserRequest(`${BASE}/api/amanah`, json("PUT", { assets: [] }), cookie));
    await amanahDELETE(browserRequest(`${BASE}/api/amanah`, { method: "DELETE" }, cookie));
    await consentDELETE(browserRequest(`${BASE}/api/consent`, json("DELETE", { purpose: "sensitive_folder_storage" }), cookie));
    const user = await getServerRepository().findUserByEmail(email);
    const res = await accountDELETE(browserRequest(`${BASE}/api/account`, json("DELETE", { password: "testpass1" }), cookie));
    expect(res.status).toBe(200);

    const c = readLedgerConfig();
    const entries = verifyLedger(c);
    expect(entries.map((e) => e.type)).toEqual(["genesis", "folder_deleted", "consent_withdrawn", "folder_deleted", "account_deleted"]);
    expect(entries.filter((e) => e.subject).every((e) => e.subject === pseudonymFor(c, user!.id))).toBe(true);
    const raw = readFileSync(file(), "utf8");
    expect(raw).not.toContain(email);
    expect(raw).not.toContain(user!.id);
  });

  it("a broken ledger refuses the deletion instead of losing track of it", async () => {
    const cookie = await registerVerified(BASE, `ledger-${crypto.randomUUID()}@test.invalid`, "testpass1");
    openLedger(readLedgerConfig());
    writeFileSync(file(), "broken\n");
    const res = await amanahDELETE(browserRequest(`${BASE}/api/amanah`, { method: "DELETE" }, cookie));
    expect(res.status).toBe(500);
  });
});
