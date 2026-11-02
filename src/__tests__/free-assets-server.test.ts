import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE as amanahDELETE, GET as amanahGET, PATCH as amanahPATCH, PUT as amanahPUT } from "@/app/api/amanah/route";
import { GET as exportGET } from "@/app/api/account/export/route";
import { DELETE as accountDELETE } from "@/app/api/account/route";
import { DELETE as consentDELETE } from "@/app/api/consent/route";
import { GET as statusGET } from "@/app/api/billing/status/route";
import { featureForRoute, FREE_ACCOUNT_SECTIONS, planFeature } from "@/lib/billing/plan-matrix";
import { defaultAmanahData } from "@/lib/domain/defaults";
import { normalizeData } from "@/lib/domain/migration";
import type { AmanahOrdnerData, AssetEntry } from "@/lib/domain/types";
import { resetRateLimits } from "@/lib/ai/rate-limit";
import { HARD_FOLDER_BODY_BYTES, MAX_ASSETS, notStoredSections } from "@/lib/server/folder-access";
import { clearOutbox } from "@/lib/server/mailer";
import { getMemoryStore } from "@/lib/server/memory-store";
import { getServerRepository, resetServerRepository } from "@/lib/server/repository";
import { keepLocalOnlySections } from "@/lib/storage/store-sync";
import { sanitizeAssets } from "@/lib/testament/asset-labels";
import { browserRequest, registerVerified } from "./session-helpers";

const BASE = "http://localhost";
const LAUNCH_IN_THE_PAST = "2000-01-01T00:00:00Z";
const asset = (over: Partial<AssetEntry> = {}): AssetEntry => ({ id: "a1", type: "bank", description: "Girokonto", ...over });

function write(method: "PUT" | "PATCH", body: unknown, cookie: string) {
  return browserRequest(`${BASE}/api/amanah`, { method, headers: { "Content-Type": "application/json" }, body: typeof body === "string" ? body : JSON.stringify(body) }, cookie);
}

const put = (body: unknown, cookie: string) => amanahPUT(write("PUT", body, cookie));

async function stored(cookie: string): Promise<AmanahOrdnerData> {
  return (await (await amanahGET(browserRequest(`${BASE}/api/amanah`, {}, cookie))).json()).data;
}

async function userOf(email: string) {
  return (await getServerRepository().findUserByEmail(email))!;
}

/** Plus is enforced and this account is too new to keep access from before the launch. */
function enforce() {
  vi.stubEnv("AMANAH_BILLING_ENFORCE", "true");
  vi.stubEnv("AMANAH_PLUS_LAUNCH_AT", LAUNCH_IN_THE_PAST);
}

const newEmail = () => `free-${crypto.randomUUID()}@test.invalid`;

beforeEach(() => {
  resetRateLimits();
  resetServerRepository();
  clearOutbox();
  globalThis.__amanahMemoryStore = undefined;
  delete process.env.AMANAH_SERVER_STORAGE;
  delete process.env.DATABASE_URL;
});

afterEach(() => vi.unstubAllEnvs());

describe("plan matrix", () => {
  it("keeps the asset overview free and impossible to lock", () => {
    const feature = featureForRoute("/dashboard/vermoegen")!;
    expect(feature.tier).toBe("free");
    expect(feature.enforcement).toBe("never");
    expect(feature.note).toContain("Dauerhaft kostenlos");
    expect([...FREE_ACCOUNT_SECTIONS].sort()).toEqual(["assets", "checkProgress", "emergencyCard", "knowledgeBookmarks"]);
    expect(planFeature("persistent_folder")?.tier).toBe("plus");
  });
});

describe("with enforcement off nothing changes", () => {
  it("stores the whole folder and reports the full scope", async () => {
    const cookie = await registerVerified(BASE, newEmail(), "testpass1");
    const res = await put({ ...defaultAmanahData, assets: [asset()], familyMessage: { ...defaultAmanahData.familyMessage, familyLetter: "Brief" } }, cookie);
    expect(res.status).toBe(200);
    expect((await res.json()).notStored).toEqual([]);
    const data = await stored(cookie);
    expect(data.familyMessage.familyLetter).toBe("Brief");
    expect(data.assets).toHaveLength(1);
    expect((await (await amanahGET(browserRequest(`${BASE}/api/amanah`, {}, cookie))).json()).writeScope).toBe("full");
  });
});

describe("free account with Plus enforced", () => {
  it("creates, edits and deletes assets on the server, without amounts", async () => {
    enforce();
    const cookie = await registerVerified(BASE, newEmail(), "testpass1");
    expect((await (await amanahGET(browserRequest(`${BASE}/api/amanah`, {}, cookie))).json()).writeScope).toBe("free_sections");

    let res = await put({ ...defaultAmanahData, assets: [asset()] }, cookie);
    expect(res.status).toBe(200);
    expect((await res.json()).notStored).toEqual([]);
    expect((await stored(cookie)).assets).toEqual([asset()]);

    res = await put({ ...defaultAmanahData, assets: [asset({ description: "Tagesgeld" })] }, cookie);
    expect(res.status).toBe(200);
    expect((await stored(cookie)).assets[0].description).toBe("Tagesgeld");

    res = await put({ ...defaultAmanahData, assets: [] }, cookie);
    expect(res.status).toBe(200);
    expect((await stored(cookie)).assets).toEqual([]);
  });

  it("does not store other sections, says so, and also blocks them through PATCH", async () => {
    enforce();
    const cookie = await registerVerified(BASE, newEmail(), "testpass1");
    const letter = { ...defaultAmanahData.familyMessage, familyLetter: "Nicht im Konto" };
    const res = await put({ ...defaultAmanahData, assets: [asset()], familyMessage: letter }, cookie);
    expect((await res.json()).notStored).toEqual(["familyMessage"]);
    let data = await stored(cookie);
    expect(data.familyMessage.familyLetter).toBe("");
    expect(data.assets).toHaveLength(1);

    const patched = await amanahPATCH(write("PATCH", { familyMessage: letter }, cookie));
    expect((await patched.json()).notStored).toEqual(["familyMessage"]);
    data = await stored(cookie);
    expect(data.familyMessage.familyLetter).toBe("");
    expect(data.assets).toHaveLength(1);
  });

  it("drops malformed entries and unknown fields from an untrusted body", async () => {
    enforce();
    const cookie = await registerVerified(BASE, newEmail(), "testpass1");
    await put({ assets: [asset({ notes: "ok" }), { id: "x", type: "unknown", description: "bad" }, { id: "y" }, "text", { ...asset({ id: "z" }), injected: "x", approximateValue: 5 }] }, cookie);
    const { assets } = await stored(cookie);
    expect(assets.map((a) => a.id)).toEqual(["a1", "z"]);
    expect(assets[1]).toEqual(asset({ id: "z" }));
  });

  it("keeps consent and e-mail confirmation as conditions", async () => {
    enforce();
    const cookie = await registerVerified(BASE, newEmail(), "testpass1", { consent: false });
    const res = await put({ assets: [asset()] }, cookie);
    expect(res.status).toBe(403);
    expect((await res.json()).code).toBe("consent_required");
  });
});

describe("tariff changes never remove anything", () => {
  it("after losing Plus, stored sections stay readable, exportable and unchanged; assets stay writable", async () => {
    const email = newEmail();
    const cookie = await registerVerified(BASE, email, "testpass1");
    await put({ ...defaultAmanahData, assets: [asset()], familyMessage: { ...defaultAmanahData.familyMessage, familyLetter: "Aus der Plus-Zeit" } }, cookie);

    enforce();
    const res = await put({ ...defaultAmanahData, assets: [asset({ description: "Neu" })], familyMessage: { ...defaultAmanahData.familyMessage, familyLetter: "" } }, cookie);
    expect((await res.json()).notStored).toEqual(["familyMessage"]);
    const data = await stored(cookie);
    expect(data.familyMessage.familyLetter).toBe("Aus der Plus-Zeit");
    expect(data.assets[0].description).toBe("Neu");

    const exported = await (await exportGET(browserRequest(`${BASE}/api/account/export`, {}, cookie))).json();
    expect(exported.amanahData.familyMessage.familyLetter).toBe("Aus der Plus-Zeit");
  });

  it("a paid purchase allows everything, a refund falls back to the free sections", async () => {
    enforce();
    const email = newEmail();
    const cookie = await registerVerified(BASE, email, "testpass1");
    const repo = getServerRepository();
    const user = await userOf(email);
    await repo.createPurchase({ userId: user.id, productId: "vorsorge_plus", provider: "sandbox", providerRef: `ref-${user.id}`, status: "paid", amountCents: 3900, currency: "eur" });
    const letter = { ...defaultAmanahData.familyMessage, familyLetter: "Mit Plus" };
    expect((await (await put({ ...defaultAmanahData, familyMessage: letter }, cookie)).json()).notStored).toEqual([]);
    expect((await stored(cookie)).familyMessage.familyLetter).toBe("Mit Plus");

    await repo.transitionPurchase(`ref-${user.id}`, ["paid"], "refunded");
    expect((await (await put({ ...defaultAmanahData, familyMessage: { ...letter, familyLetter: "Danach" } }, cookie)).json()).notStored).toEqual(["familyMessage"]);
    expect((await stored(cookie)).familyMessage.familyLetter).toBe("Mit Plus");
  });

  it("accounts from before the launch keep writing everything", async () => {
    vi.stubEnv("AMANAH_BILLING_ENFORCE", "true");
    vi.stubEnv("AMANAH_PLUS_LAUNCH_AT", "2999-01-01T00:00:00Z");
    const cookie = await registerVerified(BASE, newEmail(), "testpass1");
    expect((await (await put({ ...defaultAmanahData, familyMessage: { ...defaultAmanahData.familyMessage, familyLetter: "x" } }, cookie)).json()).notStored).toEqual([]);
  });

  it("deleting needs no Plus", async () => {
    enforce();
    const cookie = await registerVerified(BASE, newEmail(), "testpass1");
    await put({ assets: [asset()] }, cookie);
    const res = await amanahDELETE(browserRequest(`${BASE}/api/amanah`, { method: "DELETE" }, cookie));
    expect(res.status).toBe(200);
    expect((await stored(cookie)).assets).toEqual([]);
  });

  it("the status API answers without Plus too", async () => {
    enforce();
    const cookie = await registerVerified(BASE, newEmail(), "testpass1");
    expect((await statusGET(browserRequest(`${BASE}/api/billing/status`, {}, cookie))).status).toBe(200);
  });
});

describe("limits and large existing folders", () => {
  const big = (mib: number) => "ä".repeat(Math.floor((mib * 1024 * 1024) / 2));
  const letter = (familyLetter: string) => ({ ...defaultAmanahData, familyMessage: { ...defaultAmanahData.familyMessage, familyLetter } });

  it("accepts new data up to the limit and rejects more with a clear error, keeping what is stored", async () => {
    const cookie = await registerVerified(BASE, newEmail(), "testpass1");
    await put(letter("klein"), cookie);
    expect((await put(letter(big(1.9)), cookie)).status).toBe(200);
    await put(letter("klein"), cookie);
    const res = await put(letter(big(2.1)), cookie);
    expect(res.status).toBe(413);
    const body = await res.json();
    expect(body.code).toBe("folder_too_large");
    expect(body.error).toContain("in diesem Browser erhalten");
    expect((await stored(cookie)).familyMessage.familyLetter).toBe("klein");
  });

  it("an account already above the limit keeps editing, shortening and adding a little, up to the hard limit", async () => {
    const email = newEmail();
    const cookie = await registerVerified(BASE, email, "testpass1");
    const user = await userOf(email);
    // Stored before the limit existed, as an old row would be.
    const huge = big(10);
    await getServerRepository().saveAmanahData(user.id, letter(huge));

    const edited = await put(letter(`${huge} ergänzt`), cookie);
    expect(edited.status).toBe(200);
    expect((await stored(cookie)).familyMessage.familyLetter.endsWith("ergänzt")).toBe(true);

    expect((await put({ ...letter(`${huge} ergänzt`), assets: [asset()] }, cookie)).status).toBe(200);
    expect((await stored(cookie)).assets).toHaveLength(1);

    expect((await put(letter(`${huge}${big(1)}`), cookie)).status).toBe(413);
    expect((await stored(cookie)).familyMessage.familyLetter.length).toBe(huge.length + " ergänzt".length);

    expect((await put(letter(big(3)), cookie)).status).toBe(200);
    expect((await put(letter(big(3.5)), cookie)).status).toBe(413);
    expect((await put(letter("kurz"), cookie)).status).toBe(200);
    expect((await put(letter(big(3)), cookie)).status).toBe(413);
  });

  it("PATCH follows the same rule", async () => {
    const email = newEmail();
    const cookie = await registerVerified(BASE, email, "testpass1");
    await getServerRepository().saveAmanahData((await userOf(email)).id, letter(big(4)));
    expect((await amanahPATCH(write("PATCH", { assets: [asset()] }, cookie))).status).toBe(200);
    expect((await amanahPATCH(write("PATCH", letter(big(4)), cookie))).status).toBe(200);
    expect((await amanahPATCH(write("PATCH", letter(big(5)), cookie))).status).toBe(413);
  });

  it("nothing above the hard limit is read", async () => {
    const cookie = await registerVerified(BASE, newEmail(), "testpass1");
    expect((await put(JSON.stringify({ filler: "x".repeat(HARD_FOLDER_BODY_BYTES + 1) }), cookie)).status).toBe(413);
  });

  it("a free account is limited by what is stored, not by what stays in its browser", async () => {
    enforce();
    const cookie = await registerVerified(BASE, newEmail(), "testpass1");
    const res = await put({ ...letter(big(6)), assets: [asset()] }, cookie);
    expect(res.status).toBe(200);
    expect((await res.json()).notStored).toEqual(["familyMessage"]);
    expect((await stored(cookie)).assets).toHaveLength(1);
  });

  it("a free account above the limit from its Plus time can still save assets", async () => {
    const email = newEmail();
    const cookie = await registerVerified(BASE, email, "testpass1");
    await getServerRepository().saveAmanahData((await userOf(email)).id, letter(big(4)));
    enforce();
    expect((await put({ assets: [asset()] }, cookie)).status).toBe(200);
    expect((await stored(cookie)).familyMessage.familyLetter.length).toBe(big(4).length);
  });

  it("limits the number of asset entries, without locking anyone who already has more", async () => {
    const email = newEmail();
    const cookie = await registerVerified(BASE, email, "testpass1");
    const many = (n: number) => Array.from({ length: n }, (_, i) => asset({ id: `a${i}` }));
    expect((await put({ assets: many(MAX_ASSETS + 1) }, cookie)).status).toBe(422);
    await getServerRepository().saveAmanahData((await userOf(email)).id, normalizeData({ assets: many(MAX_ASSETS + 5) }));
    expect((await put({ assets: many(MAX_ASSETS + 2) }, cookie)).status).toBe(200);
    expect((await put({ assets: many(MAX_ASSETS + 2) }, cookie)).status).toBe(200);
    expect((await put({ assets: many(MAX_ASSETS + 3) }, cookie)).status).toBe(422);
  });

  it("rejects invalid bodies", async () => {
    const cookie = await registerVerified(BASE, newEmail(), "testpass1");
    expect((await put("not json", cookie)).status).toBe(400);
    expect((await put("[1,2]", cookie)).status).toBe(400);
  });
});

/** The same checks for every tariff state and every free section. */
const FREE_CHANGES: Record<string, Partial<AmanahOrdnerData>> = {
  assets: { assets: [asset()] },
  emergencyCard: { emergencyCard: { ...defaultAmanahData.emergencyCard, name: "Amina Test", allergies: "Pollen" } },
  checkProgress: { checkProgress: { ...defaultAmanahData.checkProgress, index: 3, answers: { q1: true } } },
  knowledgeBookmarks: { knowledgeBookmarks: ["artikel-a", "artikel-b"] },
};
const PAID_CHANGE = { familyMessage: { ...defaultAmanahData.familyMessage, familyLetter: "Plus-Inhalt" } };

async function accountIn(state: "free" | "plus" | "refunded") {
  enforce();
  const email = newEmail();
  const cookie = await registerVerified(BASE, email, "testpass1");
  if (state !== "free") {
    const repo = getServerRepository();
    const user = await userOf(email);
    await repo.createPurchase({ userId: user.id, productId: "vorsorge_plus", provider: "sandbox", providerRef: `ref-${user.id}`, status: "paid", amountCents: 3900, currency: "eur" });
    if (state === "refunded") await repo.transitionPurchase(`ref-${user.id}`, ["paid"], "refunded");
  }
  return cookie;
}

describe.each(["free", "plus", "refunded"] as const)("tariff state: %s", (state) => {
  it.each(Object.keys(FREE_CHANGES))("%s is stored on the server, exported and survives a second device", async (section) => {
    const cookie = await accountIn(state);
    const res = await put({ ...defaultAmanahData, ...FREE_CHANGES[section] }, cookie);
    expect(res.status).toBe(200);
    expect((await res.json()).notStored).toEqual([]);

    const onOtherDevice = (await stored(cookie)) as unknown as Record<string, unknown>;
    const expected = normalizeData(FREE_CHANGES[section]) as unknown as Record<string, unknown>;
    expect(onOtherDevice[section]).toEqual(expected[section]);

    const exported = await (await exportGET(browserRequest(`${BASE}/api/account/export`, {}, cookie))).json();
    expect(exported.amanahData[section]).toEqual(expected[section]);
  });

  it("free sections can be emptied again", async () => {
    const cookie = await accountIn(state);
    await put({ ...defaultAmanahData, ...FREE_CHANGES.assets, ...FREE_CHANGES.emergencyCard, ...FREE_CHANGES.knowledgeBookmarks }, cookie);
    await put({ ...defaultAmanahData }, cookie);
    const data = await stored(cookie);
    expect(data.assets).toEqual([]);
    expect(data.emergencyCard.name).toBe("");
    expect(data.knowledgeBookmarks).toEqual([]);
  });

  it(`paid sections ${state === "plus" ? "are" : "are not"} stored`, async () => {
    const cookie = await accountIn(state);
    const res = await put({ ...defaultAmanahData, ...PAID_CHANGE }, cookie);
    const { notStored } = await res.json();
    const letter = (await stored(cookie)).familyMessage.familyLetter;
    if (state === "plus") {
      expect(notStored).toEqual([]);
      expect(letter).toBe("Plus-Inhalt");
    } else {
      expect(notStored).toEqual(["familyMessage"]);
      expect(letter).toBe("");
    }
  });

  it("withdrawing consent removes the server copy and blocks further saving", async () => {
    const cookie = await accountIn(state);
    await put({ ...defaultAmanahData, ...FREE_CHANGES.emergencyCard }, cookie);
    await consentDELETE(browserRequest(`${BASE}/api/consent`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ purpose: "sensitive_folder_storage" }) }, cookie));
    expect((await stored(cookie)).emergencyCard.name).toBe("");
    expect((await put({ ...defaultAmanahData, ...FREE_CHANGES.emergencyCard }, cookie)).status).toBe(403);
  });

  it("deleting the account removes everything", async () => {
    const cookie = await accountIn(state);
    await put({ ...defaultAmanahData, ...FREE_CHANGES.assets }, cookie);
    const res = await accountDELETE(browserRequest(`${BASE}/api/account`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: "testpass1" }) }, cookie));
    expect(res.status).toBe(200);
    expect(getMemoryStore().amanahData.size).toBe(0);
    expect((await amanahGET(browserRequest(`${BASE}/api/amanah`, {}, cookie))).status).toBe(401);
  });
});

describe("free data survives tariff changes", () => {
  it("through purchase and refund", async () => {
    enforce();
    const email = newEmail();
    const cookie = await registerVerified(BASE, email, "testpass1");
    const repo = getServerRepository();
    await put({ ...defaultAmanahData, ...FREE_CHANGES.emergencyCard, ...FREE_CHANGES.knowledgeBookmarks, ...FREE_CHANGES.assets }, cookie);
    const user = await userOf(email);
    await repo.createPurchase({ userId: user.id, productId: "vorsorge_plus", provider: "sandbox", providerRef: `ref-${user.id}`, status: "paid", amountCents: 3900, currency: "eur" });
    expect((await stored(cookie)).emergencyCard.name).toBe("Amina Test");
    await put({ ...defaultAmanahData, ...FREE_CHANGES.emergencyCard, ...FREE_CHANGES.knowledgeBookmarks, ...FREE_CHANGES.assets, ...PAID_CHANGE }, cookie);
    await repo.transitionPurchase(`ref-${user.id}`, ["paid"], "refunded");
    const data = await stored(cookie);
    expect(data.emergencyCard.name).toBe("Amina Test");
    expect(data.knowledgeBookmarks).toEqual(["artikel-a", "artikel-b"]);
    expect(data.assets).toHaveLength(1);
    expect(data.familyMessage.familyLetter).toBe("Plus-Inhalt");
  });
});

describe("access between accounts", () => {
  it("another account sees none of these sections", async () => {
    enforce();
    const owner = await registerVerified(BASE, newEmail(), "testpass1");
    const other = await registerVerified(BASE, newEmail(), "testpass1");
    await put({ ...defaultAmanahData, ...FREE_CHANGES.emergencyCard, ...FREE_CHANGES.assets }, owner);
    const data = await stored(other);
    expect(data.emergencyCard.name).toBe("");
    expect(data.assets).toEqual([]);
    expect((await amanahGET(browserRequest(`${BASE}/api/amanah`))).status).toBe(401);
  });

  it("drops unknown fields and wrong types from the emergency card", async () => {
    enforce();
    const cookie = await registerVerified(BASE, newEmail(), "testpass1");
    await put({ emergencyCard: { name: "Ok", allergies: 5, injected: "x", emergencyContact1: { name: "K", phone: {} } }, knowledgeBookmarks: ["a", 3], checkProgress: { index: "x" } }, cookie);
    const data = await stored(cookie);
    expect(data.emergencyCard.name).toBe("Ok");
    expect(data.emergencyCard.allergies).toBe("");
    expect(data.emergencyCard.emergencyContact1.phone).toBe("");
    expect(JSON.stringify(data)).not.toContain("injected");
    expect(data.knowledgeBookmarks).toEqual(["a"]);
  });
});

describe("logs stay free of personal data", () => {
  it("not on saving, rejecting, failing or exporting", async () => {
    const spies = (["log", "info", "warn", "error", "debug"] as const).map((level) => vi.spyOn(console, level));
    const secret = "SEHR-PERSOENLICHER-TEXT";
    enforce();
    const email = newEmail();
    const cookie = await registerVerified(BASE, email, "testpass1");
    await put({ ...defaultAmanahData, emergencyCard: { ...defaultAmanahData.emergencyCard, illnesses: secret } }, cookie);
    await put(JSON.stringify({ emergencyCard: { illnesses: secret }, filler: "x".repeat(HARD_FOLDER_BODY_BYTES) }), cookie);
    await put(`{"broken": "${secret}"`, cookie);
    await exportGET(browserRequest(`${BASE}/api/account/export`, {}, cookie));
    vi.spyOn(getServerRepository(), "patchAmanahData").mockRejectedValueOnce(new Error(`db failed ${secret}`));
    expect((await put({ emergencyCard: { illnesses: secret } }, cookie)).status).toBe(500);
    const logged = JSON.stringify(spies.flatMap((spy) => spy.mock.calls));
    expect(logged).not.toContain(secret);
    expect(logged).not.toContain(email);
    spies.forEach((spy) => spy.mockRestore());
  });
});

describe("helpers", () => {
  it("names only sections with a real change, not bookkeeping", () => {
    const existing = normalizeData({});
    expect(notStoredSections(existing, { ...existing, lastSaved: "2030-01-01" })).toEqual([]);
    expect(notStoredSections(null, { assets: [asset()] })).toEqual([]);
    expect(notStoredSections(existing, { selectedPath: "/x", checkProgress: { ...existing.checkProgress, index: 3 }, knowledgeBookmarks: ["slug"] })).toEqual([]);
  });

  it("sanitizeAssets ignores everything that is no list", () => {
    expect(sanitizeAssets("x")).toEqual([]);
    expect(sanitizeAssets(null)).toEqual([]);
  });

  it("on login an empty free section takes the entries from this browser", () => {
    const merged = keepLocalOnlySections(normalizeData({}), normalizeData({ assets: [asset()], knowledgeBookmarks: ["a"] }));
    expect(merged.assets).toHaveLength(1);
    expect(merged.knowledgeBookmarks).toEqual(["a"]);
  });

  it("on login the account wins for assets; what exists only in this browser survives", () => {
    const remote = normalizeData({ assets: [asset({ description: "Konto" })] });
    const local = normalizeData({
      assets: [asset({ description: "Veraltet" })],
      familyMessage: { ...defaultAmanahData.familyMessage, familyLetter: "Nur hier" },
    });
    const merged = keepLocalOnlySections(remote, local);
    expect(merged.assets[0].description).toBe("Konto");
    expect(merged.familyMessage.familyLetter).toBe("Nur hier");
  });
});

describe("login sync", () => {
  it("keeps what is entered while the account data is loading", async () => {
    let release: (value: Response) => void = () => {};
    vi.stubEnv("NEXT_PUBLIC_STORAGE_MODE", "api");
    vi.stubEnv("NEXT_PUBLIC_AUTH_MODE", "api");
    localStorage.setItem("amanah-auth-session", JSON.stringify({ user: { id: "u", email: "a@test.invalid", name: "A" }, expiresAt: "2999-01-01T00:00:00Z" }));
    const puts: string[] = [];
    vi.stubGlobal("fetch", vi.fn((_url: string, init: RequestInit = {}) => {
      if (init.method === "PUT") {
        puts.push(init.body as string);
        return Promise.resolve(new Response(JSON.stringify({ notStored: [] })));
      }
      return new Promise<Response>((resolve) => (release = resolve));
    }));
    const { useAmanahStore } = await import("@/lib/store/use-amanah-store");
    const { syncStoreWithRemoteAfterAuth } = await import("@/lib/storage/store-sync");
    useAmanahStore.setState({ ...structuredClone(defaultAmanahData) });

    const sync = syncStoreWithRemoteAfterAuth();
    await Promise.resolve();
    useAmanahStore.setState({ checkProgress: { ...defaultAmanahData.checkProgress, index: 1, answers: { convert: true } } });
    release(new Response(JSON.stringify({ data: normalizeData({ assets: [asset()] }), writeScope: "free_sections" })));
    await sync;

    expect(useAmanahStore.getState().checkProgress.answers).toEqual({ convert: true });
    expect(useAmanahStore.getState().assets).toHaveLength(1);
    expect(JSON.parse(puts[0]).checkProgress.answers).toEqual({ convert: true });
    localStorage.removeItem("amanah-auth-session");
    vi.unstubAllGlobals();
  });
});

describe("store hydration", () => {
  it("reports itself as hydrated, which the check relies on to write into the folder", async () => {
    const { useAmanahStore } = await import("@/lib/store/use-amanah-store");
    expect(useAmanahStore.persist.hasHydrated()).toBe(true);
  });
});
