import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE as amanahDELETE, GET as amanahGET, PATCH as amanahPATCH, PUT as amanahPUT } from "@/app/api/amanah/route";
import { GET as exportGET } from "@/app/api/account/export/route";
import { GET as statusGET } from "@/app/api/billing/status/route";
import { featureForRoute, FREE_ACCOUNT_SECTIONS, planFeature } from "@/lib/billing/plan-matrix";
import { defaultAmanahData } from "@/lib/domain/defaults";
import { normalizeData } from "@/lib/domain/migration";
import type { AmanahOrdnerData, AssetEntry } from "@/lib/domain/types";
import { resetRateLimits } from "@/lib/ai/rate-limit";
import { MAX_ASSETS, MAX_FOLDER_BODY_BYTES, notStoredSections } from "@/lib/server/folder-access";
import { clearOutbox } from "@/lib/server/mailer";
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
    expect(FREE_ACCOUNT_SECTIONS).toEqual(["assets"]);
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

describe("limits", () => {
  it("rejects bodies over the limit with a clear error and keeps what is stored", async () => {
    const cookie = await registerVerified(BASE, newEmail(), "testpass1");
    await put({ assets: [asset()] }, cookie);
    const res = await put(JSON.stringify({ assets: [], filler: "x".repeat(MAX_FOLDER_BODY_BYTES) }), cookie);
    expect(res.status).toBe(413);
    expect((await res.json()).code).toBe("folder_too_large");
    expect((await stored(cookie)).assets).toHaveLength(1);
  });

  it("rejects too many entries and invalid bodies", async () => {
    const cookie = await registerVerified(BASE, newEmail(), "testpass1");
    const many = Array.from({ length: MAX_ASSETS + 1 }, (_, i) => asset({ id: `a${i}` }));
    expect((await put({ assets: many }, cookie)).status).toBe(422);
    expect((await put("not json", cookie)).status).toBe(400);
    expect((await put("[1,2]", cookie)).status).toBe(400);
  });
});

describe("helpers", () => {
  it("names only sections with a real change, not bookkeeping", () => {
    const existing = normalizeData({});
    expect(notStoredSections(existing, { ...existing, lastSaved: "2030-01-01" })).toEqual([]);
    expect(notStoredSections(null, { assets: [asset()] })).toEqual([]);
    expect(notStoredSections(existing, { checkProgress: { ...existing.checkProgress, index: 3 }, selectedPath: "/x", knowledgeBookmarks: ["slug"] })).toEqual([]);
  });

  it("sanitizeAssets ignores everything that is no list", () => {
    expect(sanitizeAssets("x")).toEqual([]);
    expect(sanitizeAssets(null)).toEqual([]);
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
