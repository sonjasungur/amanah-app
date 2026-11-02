import { readFileSync } from "fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET as historyGET, DELETE as historyDELETE } from "@/app/api/amanah/history/route";
import { POST as restorePOST } from "@/app/api/amanah/history/[id]/restore/route";
import { DELETE as versionDELETE, GET as versionGET } from "@/app/api/amanah/history/[id]/route";
import { DELETE as amanahDELETE, GET as amanahGET, PUT as amanahPUT } from "@/app/api/amanah/route";
import { DELETE as accountDELETE } from "@/app/api/account/route";
import { GET as exportGET } from "@/app/api/account/export/route";
import { DELETE as consentDELETE } from "@/app/api/consent/route";
import { defaultAmanahData } from "@/lib/domain/defaults";
import { normalizeData } from "@/lib/domain/migration";
import type { AmanahOrdnerData } from "@/lib/domain/types";
import { resetRateLimits } from "@/lib/ai/rate-limit";
import { isEncryptedEnvelope } from "@/lib/server/data-encryption";
import {
  changedSections,
  HISTORY_COALESCE_MS,
  HISTORY_MAX_BYTES,
  HISTORY_MAX_VERSIONS,
  HISTORY_RETENTION_DAYS,
  HISTORY_SECTIONS,
  isDataHistoryEnabled,
  openVersion,
  overlayVersions,
  planHistoryWrite,
  retentionCutoff,
  sealVersion,
  stripSecretFields,
  versionsToPrune,
  type VersionPayload,
} from "@/lib/server/data-history";
import { runHistoryPurge } from "@/lib/server/history-purge";
import { clearOutbox } from "@/lib/server/mailer";
import type { ServerRepository } from "@/lib/server/repository/types";
import { getMemoryStore } from "@/lib/server/memory-store";
import { getServerRepository, resetServerRepository } from "@/lib/server/repository";
import { browserRequest, registerVerified } from "./session-helpers";

const BASE = "http://localhost";
const KEY = Buffer.alloc(32, 7).toString("base64");
const withLetter = (familyLetter: string): AmanahOrdnerData => ({ ...defaultAmanahData, familyMessage: { ...defaultAmanahData.familyMessage, familyLetter } });
const newEmail = () => `hist-${crypto.randomUUID()}@test.invalid`;

const put = (body: unknown, cookie: string) =>
  amanahPUT(browserRequest(`${BASE}/api/amanah`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }, cookie));
const list = async (cookie: string) => (await (await historyGET(browserRequest(`${BASE}/api/amanah/history`, {}, cookie))).json()).versions as { id: string; sections: string[]; changeType: string; createdAt: string }[];
const restore = (id: string, cookie: string, body: unknown = { confirmed: true }) =>
  restorePOST(browserRequest(`${BASE}/api/amanah/history/${id}/restore`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }, cookie), { params: Promise.resolve({ id }) });
const letter = async (cookie: string) => (await (await amanahGET(browserRequest(`${BASE}/api/amanah`, {}, cookie))).json()).data.familyMessage.familyLetter;
/** Moves all versions out of the coalescing window, as if time had passed. */
const age = (ms = HISTORY_COALESCE_MS + 1000) => {
  for (const v of getMemoryStore().dataVersions) v.createdAt = new Date(v.createdAt.getTime() - ms);
};

beforeEach(() => {
  resetRateLimits();
  resetServerRepository();
  clearOutbox();
  globalThis.__amanahMemoryStore = undefined;
  delete process.env.AMANAH_SERVER_STORAGE;
  delete process.env.DATABASE_URL;
});

afterEach(() => vi.unstubAllEnvs());

describe("switched off (default)", () => {
  it("writes no version and hides the API, deleting stays possible", async () => {
    const cookie = await registerVerified(BASE, newEmail(), "testpass1");
    await put(withLetter("a"), cookie);
    await put(withLetter("b"), cookie);
    expect(getMemoryStore().dataVersions).toHaveLength(0);
    expect((await historyGET(browserRequest(`${BASE}/api/amanah/history`, {}, cookie))).status).toBe(404);
    expect((await restore("x", cookie)).status).toBe(404);
    expect((await historyDELETE(browserRequest(`${BASE}/api/amanah/history`, { method: "DELETE" }, cookie))).status).toBe(200);
  });
});

describe("recording", () => {
  beforeEach(() => vi.stubEnv("AMANAH_DATA_HISTORY", "true"));

  it("the first save has nothing to go back to; a change stores only the changed section", async () => {
    const cookie = await registerVerified(BASE, newEmail(), "testpass1");
    await put(withLetter("erste Fassung"), cookie);
    expect(await list(cookie)).toEqual([]);
    await put(withLetter("zweite Fassung"), cookie);
    const [version, ...rest] = await list(cookie);
    expect(rest).toEqual([]);
    expect(version.sections).toEqual(["familyMessage"]);
    expect(version.changeType).toBe("save");
    expect(new Date(version.createdAt).getTime()).toBeLessThanOrEqual(Date.now());
  });

  it("listing returns dates and kinds, never content", async () => {
    const cookie = await registerVerified(BASE, newEmail(), "testpass1");
    await put(withLetter("Geheimer Inhalt"), cookie);
    await put(withLetter("neu"), cookie);
    const raw = await (await historyGET(browserRequest(`${BASE}/api/amanah/history`, {}, cookie))).text();
    expect(raw).not.toContain("Geheimer Inhalt");
    expect(raw).toContain("retentionDays");
  });

  it("ignores saves without a change and changes outside the content", async () => {
    const cookie = await registerVerified(BASE, newEmail(), "testpass1");
    await put(withLetter("a"), cookie);
    await put(withLetter("a"), cookie);
    await put({ ...withLetter("a"), selectedPath: "/x", knowledgeBookmarks: ["slug"] }, cookie);
    expect(await list(cookie)).toEqual([]);
  });

  it("treats typing within the window as one change and keeps the oldest value", async () => {
    const cookie = await registerVerified(BASE, newEmail(), "testpass1");
    await put(withLetter("Anfang"), cookie);
    await put(withLetter("Anfang b"), cookie);
    await put(withLetter("Anfang bc"), cookie);
    const versions = await list(cookie);
    expect(versions).toHaveLength(1);
    expect((await restore(versions[0].id, cookie)).status).toBe(200);
    expect(await letter(cookie)).toBe("Anfang");
  });

  it("stores versions encrypted and bound to the owner when keys are set", async () => {
    vi.stubEnv("AMANAH_DATA_KEYS", `k1:${KEY}`);
    const email = newEmail();
    const cookie = await registerVerified(BASE, email, "testpass1");
    await put(withLetter("Klartext darf nicht sichtbar sein"), cookie);
    await put(withLetter("neu"), cookie);
    const [row] = getMemoryStore().dataVersions;
    expect(isEncryptedEnvelope(row.data)).toBe(true);
    expect(JSON.stringify(row)).not.toContain("Klartext");
    expect(() => openVersion(row.data, "other-user", row.seq)).toThrow();
    expect(() => openVersion(row.data, row.userId, row.seq + 1)).toThrow();
    expect(openVersion(row.data, row.userId, row.seq).sections).toEqual(["familyMessage"]);
  });
});

describe("restoring", () => {
  beforeEach(() => vi.stubEnv("AMANAH_DATA_HISTORY", "true"));

  async function threeStates() {
    const cookie = await registerVerified(BASE, newEmail(), "testpass1");
    await put(withLetter("eins"), cookie);
    await put(withLetter("zwei"), cookie);
    age();
    await put(withLetter("drei"), cookie);
    age();
    return cookie;
  }

  it("happens only with an explicit confirmation", async () => {
    const cookie = await threeStates();
    const [v] = await list(cookie);
    expect((await restore(v.id, cookie, {})).status).toBe(400);
    expect((await restore(v.id, cookie, { confirmed: "true" })).status).toBe(400);
    expect(await letter(cookie)).toBe("drei");
    expect((await list(cookie))[0].id).toBe(v.id);
  });

  it("goes back to the state before the chosen change, also across several changes, and can be undone", async () => {
    const cookie = await threeStates();
    const versions = await list(cookie);
    const oldest = versions.at(-1)!;
    expect((await restore(oldest.id, cookie)).status).toBe(200);
    expect(await letter(cookie)).toBe("eins");
    const [undo] = await list(cookie);
    expect(undo.changeType).toBe("restore");
    expect((await restore(undo.id, cookie)).status).toBe(200);
    expect(await letter(cookie)).toBe("drei");
  });

  it("is rejected across origins and without a session", async () => {
    const cookie = await threeStates();
    const [v] = await list(cookie);
    const foreign = new Request(`${BASE}/api/amanah/history/${v.id}/restore`, { method: "POST", headers: { Origin: "https://evil.example", "Sec-Fetch-Site": "cross-site", Cookie: cookie, "Content-Type": "application/json" }, body: JSON.stringify({ confirmed: true }) });
    expect((await restorePOST(foreign, { params: Promise.resolve({ id: v.id }) })).status).toBe(403);
    expect(await letter(cookie)).toBe("drei");
  });

  it("a free account gets back only the free sections", async () => {
    const cookie = await registerVerified(BASE, newEmail(), "testpass1");
    const asset = { id: "a1", type: "bank", description: "Alt" };
    await put({ ...withLetter("alt"), assets: [asset] }, cookie);
    await put({ ...withLetter("neu"), assets: [{ ...asset, description: "Neu" }] }, cookie);
    vi.stubEnv("AMANAH_BILLING_ENFORCE", "true");
    vi.stubEnv("AMANAH_PLUS_LAUNCH_AT", "2000-01-01T00:00:00Z");
    const [v] = await list(cookie);
    const res = await restore(v.id, cookie);
    expect(res.status).toBe(200);
    const { data } = await res.json();
    expect(data.assets[0].description).toBe("Alt");
    expect(data.familyMessage.familyLetter).toBe("neu");
  });
});

describe("separation between accounts", () => {
  beforeEach(() => vi.stubEnv("AMANAH_DATA_HISTORY", "true"));

  it("another user neither sees nor restores a version", async () => {
    const owner = await registerVerified(BASE, newEmail(), "testpass1");
    const other = await registerVerified(BASE, newEmail(), "testpass1");
    await put(withLetter("Besitzer alt"), owner);
    await put(withLetter("Besitzer neu"), owner);
    await put(withLetter("Anderer"), other);
    const [v] = await list(owner);
    expect(await list(other)).toEqual([]);
    expect((await restore(v.id, other)).status).toBe(404);
    expect(await letter(other)).toBe("Anderer");
    expect(await letter(owner)).toBe("Besitzer neu");
    expect((await historyGET(browserRequest(`${BASE}/api/amanah/history`, {}))).status).toBe(401);
  });

  it("an export contains only the own history", async () => {
    const owner = await registerVerified(BASE, newEmail(), "testpass1");
    const other = await registerVerified(BASE, newEmail(), "testpass1");
    await put(withLetter("Nur Besitzer"), owner);
    await put(withLetter("neu"), owner);
    const exported = await (await exportGET(browserRequest(`${BASE}/api/account/export`, {}, other))).json();
    expect(exported.dataHistory).toEqual([]);
    expect(JSON.stringify(exported)).not.toContain("Nur Besitzer");
  });
});

describe("deleting and retention", () => {
  beforeEach(() => vi.stubEnv("AMANAH_DATA_HISTORY", "true"));

  async function withVersion() {
    const email = newEmail();
    const cookie = await registerVerified(BASE, email, "testpass1");
    await put(withLetter("alt"), cookie);
    await put(withLetter("neu"), cookie);
    expect(getMemoryStore().dataVersions).toHaveLength(1);
    return { email, cookie };
  }

  it("deleting the history keeps the folder", async () => {
    const { cookie } = await withVersion();
    expect((await historyDELETE(browserRequest(`${BASE}/api/amanah/history`, { method: "DELETE" }, cookie))).status).toBe(200);
    expect(getMemoryStore().dataVersions).toHaveLength(0);
    expect(await letter(cookie)).toBe("neu");
  });

  it("deleting the folder deletes the history", async () => {
    const { cookie } = await withVersion();
    await amanahDELETE(browserRequest(`${BASE}/api/amanah`, { method: "DELETE" }, cookie));
    expect(getMemoryStore().dataVersions).toHaveLength(0);
  });

  it("withdrawing consent deletes the history with the server copy", async () => {
    const { cookie } = await withVersion();
    await consentDELETE(browserRequest(`${BASE}/api/consent`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ purpose: "sensitive_folder_storage" }) }, cookie));
    expect(getMemoryStore().dataVersions).toHaveLength(0);
  });

  it("deleting the account deletes the history", async () => {
    const { cookie } = await withVersion();
    const res = await accountDELETE(browserRequest(`${BASE}/api/account`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: "testpass1" }) }, cookie));
    expect(res.status).toBe(200);
    expect(getMemoryStore().dataVersions).toHaveLength(0);
  });

  it("expired versions are not listed, not restorable, and purged", async () => {
    const { cookie } = await withVersion();
    const [v] = await list(cookie);
    age((HISTORY_RETENTION_DAYS + 1) * 24 * 60 * 60 * 1000);
    expect(await list(cookie)).toEqual([]);
    expect((await restore(v.id, cookie)).status).toBe(404);
    expect(await getServerRepository().purgeExpiredDataVersions()).toBe(1);
    expect(getMemoryStore().dataVersions).toHaveLength(0);
  });

  it("the export contains the stored history and purchases", async () => {
    const { email, cookie } = await withVersion();
    const repo = getServerRepository();
    const user = (await repo.findUserByEmail(email))!;
    await repo.createPurchase({ userId: user.id, productId: "vorsorge_plus", provider: "sandbox", providerRef: "ref-export", status: "paid", amountCents: 3900, currency: "eur" });
    const res = await exportGET(browserRequest(`${BASE}/api/account/export`, {}, cookie));
    const exported = await res.json();
    expect(exported.format).toBe("amanah-account-export@2");
    expect(exported.dataHistory[0].prior.familyMessage.familyLetter).toBe("alt");
    expect(exported.purchases[0]).toMatchObject({ productId: "vorsorge_plus", status: "paid", amountCents: 3900 });
    expect(JSON.stringify(exported.purchases)).not.toContain(user.id);
    expect(JSON.stringify(exported)).not.toContain("passwordHash");
    expect(JSON.stringify(exported)).not.toMatch(/tokenHash/);
  });

  it("a version that can no longer be read still appears in the export, without breaking it", async () => {
    const { cookie } = await withVersion();
    getMemoryStore().dataVersions[0].data = { damaged: true };
    const exported = await (await exportGET(browserRequest(`${BASE}/api/account/export`, {}, cookie))).json();
    expect(exported.dataHistory[0].prior).toBeNull();
    const [v] = await list(cookie);
    const res = await restore(v.id, cookie);
    expect(res.status).toBe(500);
    expect(await letter(cookie)).toBe("neu");
  });
});

describe("viewing and deleting single versions", () => {
  beforeEach(() => vi.stubEnv("AMANAH_DATA_HISTORY", "true"));
  const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
  const get = (id: string, cookie?: string) => versionGET(browserRequest(`${BASE}/api/amanah/history/${id}`, {}, cookie), ctx(id));
  const del = (id: string, cookie?: string) => versionDELETE(browserRequest(`${BASE}/api/amanah/history/${id}`, { method: "DELETE" }, cookie), ctx(id));

  async function twoVersions() {
    const cookie = await registerVerified(BASE, newEmail(), "testpass1");
    await put(withLetter("eins"), cookie);
    await put(withLetter("zwei"), cookie);
    age();
    await put(withLetter("drei"), cookie);
    return { cookie, versions: await list(cookie) };
  }

  it("shows the content to the owner, uncached", async () => {
    const { cookie, versions } = await twoVersions();
    const res = await get(versions[1].id, cookie);
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    const { version } = await res.json();
    expect(version.prior.familyMessage.familyLetter).toBe("eins");
  });

  it("refuses others and anonymous requests for reading and deleting, and changes nothing", async () => {
    const { cookie, versions } = await twoVersions();
    const other = await registerVerified(BASE, newEmail(), "testpass1");
    expect((await get(versions[0].id, other)).status).toBe(404);
    expect((await get(versions[0].id)).status).toBe(401);
    expect((await del(versions[0].id, other)).status).toBe(404);
    expect((await del(versions[0].id)).status).toBe(401);
    const foreign = new Request(`${BASE}/api/amanah/history/${versions[0].id}`, { method: "DELETE", headers: { Origin: "https://evil.example", "Sec-Fetch-Site": "cross-site", Cookie: cookie } });
    expect((await versionDELETE(foreign, ctx(versions[0].id))).status).toBe(403);
    expect(await list(cookie)).toHaveLength(2);
  });

  it("deleting removes this and all older versions, and keeps newer ones and the folder", async () => {
    const { cookie, versions } = await twoVersions();
    expect((await del(versions[1].id, cookie)).status).toBe(200);
    expect((await list(cookie)).map((v) => v.id)).toEqual([versions[0].id]);
    expect((await del(versions[0].id, cookie)).status).toBe(200);
    expect(await list(cookie)).toEqual([]);
    expect(await letter(cookie)).toBe("drei");
  });

  it("is hidden while switched off, but deleting still works", async () => {
    const { cookie, versions } = await twoVersions();
    vi.stubEnv("AMANAH_DATA_HISTORY", "false");
    expect((await get(versions[0].id, cookie)).status).toBe(404);
    expect((await del(versions[0].id, cookie)).status).toBe(200);
  });
});

describe("automatic removal", () => {
  beforeEach(() => vi.stubEnv("AMANAH_DATA_HISTORY", "true"));

  it("removes expired versions of every account, also when nobody writes or the history is off, and logs only a count", async () => {
    const a = await registerVerified(BASE, newEmail(), "testpass1");
    const b = await registerVerified(BASE, newEmail(), "testpass1");
    for (const cookie of [a, b]) {
      await put(withLetter("Persönlich alt"), cookie);
      await put(withLetter("neu"), cookie);
    }
    age((HISTORY_RETENTION_DAYS + 1) * 864e5);
    await put(withLetter("neuer"), a);
    vi.stubEnv("AMANAH_DATA_HISTORY", "false");
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    expect(await runHistoryPurge()).toBeGreaterThanOrEqual(1);
    expect(getMemoryStore().dataVersions.every((v) => v.createdAt >= retentionCutoff())).toBe(true);
    expect(info.mock.calls[0][0]).toMatch(/^\[history\] removed \d+ expired versions$/);
    info.mockRestore();
  });

  it("a failure is logged without details and does not throw", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const broken = { purgeExpiredDataVersions: () => Promise.reject(new Error("secret detail")) } as unknown as ServerRepository;
    expect(await runHistoryPurge(broken)).toBe(0);
    expect(JSON.stringify(error.mock.calls)).not.toContain("secret detail");
    error.mockRestore();
  });

  it("an expired version is not exported, even before the daily run", async () => {
    const cookie = await registerVerified(BASE, newEmail(), "testpass1");
    await put(withLetter("Alt und abgelaufen"), cookie);
    await put(withLetter("neu"), cookie);
    age((HISTORY_RETENTION_DAYS + 1) * 864e5);
    const exported = await (await exportGET(browserRequest(`${BASE}/api/account/export`, {}, cookie))).json();
    expect(exported.dataHistory).toEqual([]);
    expect(JSON.stringify(exported)).not.toContain("Alt und abgelaufen");
    expect(getMemoryStore().dataVersions).toHaveLength(0);
  });

  it("the script uses the same retention", () => {
    expect(readFileSync("scripts/purge-data-history.mjs", "utf8")).toContain(`RETENTION_DAYS = ${HISTORY_RETENTION_DAYS}`);
    expect(HISTORY_RETENTION_DAYS).toBe(90);
    expect(HISTORY_MAX_VERSIONS).toBe(50);
    expect(HISTORY_MAX_BYTES).toBe(5 * 1024 * 1024);
  });

  it("nothing switches the history on by default", () => {
    expect(isDataHistoryEnabled({} as NodeJS.ProcessEnv)).toBe(false);
    for (const file of [".env.example", ".env.production.example", ".env.staging.example"]) {
      expect(readFileSync(file, "utf8"), file).not.toMatch(/AMANAH_DATA_HISTORY\s*=\s*true/);
    }
  });
});

describe("rules", () => {
  const row = (seq: number, over: Partial<{ createdAt: Date; sizeBytes: number }> = {}) => ({ id: `v${seq}`, seq, changeType: "save", sizeBytes: 10, createdAt: new Date(), ...over });

  it("prunes by age, then the oldest above the count and size limits, and keeps the newest", () => {
    const now = new Date();
    expect(versionsToPrune([row(1, { createdAt: new Date(now.getTime() - (HISTORY_RETENTION_DAYS + 1) * 864e5) }), row(2)], now)).toEqual(["v1"]);
    const many = Array.from({ length: HISTORY_MAX_VERSIONS + 2 }, (_, i) => row(i + 1));
    expect(versionsToPrune(many, now)).toEqual(["v1", "v2"]);
    expect(versionsToPrune([row(1, { sizeBytes: HISTORY_MAX_BYTES }), row(2, { sizeBytes: 10 })], now)).toEqual(["v1"]);
  });

  it("does not keep a change above the account limit at all", () => {
    const before = normalizeData({});
    const after = withLetter("x");
    const huge = "ä".repeat(HISTORY_MAX_BYTES);
    expect(planHistoryWrite({ before: withLetter(huge), after, latest: null, changeType: "save" }).kind).toBe("none");
    const payload: VersionPayload = { kind: "amanah-data-version", seq: 1, sections: ["assets"], prior: { assets: [] } };
    expect(planHistoryWrite({ before: withLetter(huge), after, latest: { row: row(1), payload }, changeType: "save" }).kind).toBe("none");
    expect(planHistoryWrite({ before, after, latest: null, changeType: "save" }).kind).toBe("create");
  });

  it("removes fields that look like secrets, at any depth", () => {
    expect(stripSecretFields({ a: 1, password: "x", nested: [{ apiKey: "y", pin: "1", locationHint: "Ordner", Passwort: "z", accessToken: "t" }] })).toEqual({ a: 1, nested: [{ locationHint: "Ordner" }] });
  });

  it("covers every section with content and leaves out bookkeeping", () => {
    const covered = new Set<string>(HISTORY_SECTIONS);
    const left = Object.keys(defaultAmanahData).filter((k) => !covered.has(k)).sort();
    expect(left).toEqual(["checkProgress", "knowledgeBookmarks", "lastSaved", "reviewStatus", "schemaVersion", "selectedPath"]);
  });

  it("moving through the questionnaire is no change", () => {
    const before = normalizeData({});
    const after = normalizeData({ testamentPreparation: { ...before.testamentPreparation, currentStep: 5 } });
    expect(changedSections(before, after)).toEqual([]);
  });

  it("a restore is always its own version and never merged into an earlier one", () => {
    const before = normalizeData({});
    const after = withLetter("x");
    const payload: VersionPayload = { kind: "amanah-data-version", seq: 3, sections: ["assets"], prior: { assets: [] } };
    const latest = { row: row(3), payload };
    expect(planHistoryWrite({ before, after, latest, changeType: "restore" }).kind).toBe("create");
    expect(planHistoryWrite({ before, after, latest, changeType: "save" }).kind).toBe("extend");
    expect(planHistoryWrite({ before, after, latest: { row: { ...row(3), changeType: "restore" }, payload }, changeType: "save" }).kind).toBe("create");
    expect(planHistoryWrite({ before, after, latest: { row: row(3), payload: null }, changeType: "save" }).kind).toBe("create");
  });

  it("overlay ignores unknown sections and respects the allowed list", () => {
    const current = withLetter("jetzt");
    const version: VersionPayload = { kind: "amanah-data-version", seq: 1, sections: [], prior: { familyMessage: { familyLetter: "alt" }, evil: 1, assets: [] } };
    expect((overlayVersions(current, [version]) as unknown as Record<string, unknown>).evil).toBeUndefined();
    expect(overlayVersions(current, [version], ["assets"]).familyMessage.familyLetter).toBe("jetzt");
  });

  it("reports the plaintext size of a version", () => {
    const payload: VersionPayload = { kind: "amanah-data-version", seq: 1, sections: [], prior: {} };
    expect(sealVersion(payload, "u", {} as NodeJS.ProcessEnv).sizeBytes).toBeGreaterThan(0);
  });
});
