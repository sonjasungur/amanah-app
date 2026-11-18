/**
 * P2.5 owner decision (Variante 1): recording a family conversation is free; the preparation notes
 * and choosing people from "Familie & Kontakte" stay Plus. Checked through the real API routes with
 * Plus enforced, for a free and a Plus account, in the in-memory repository.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET as amanahGET, PUT as amanahPUT } from "@/app/api/amanah/route";
import { FREE_ACCOUNT_SECTIONS, PARTLY_FREE_SECTIONS, featureForRoute, planFeature } from "@/lib/billing/plan-matrix";
import { defaultAmanahData } from "@/lib/domain/defaults";
import { normalizeData } from "@/lib/domain/migration";
import type { AmanahOrdnerData, FamilyTalk } from "@/lib/domain/types";
import { resetRateLimits } from "@/lib/ai/rate-limit";
import { freeFamilyConversation, notStoredSections } from "@/lib/server/folder-access";
import { clearOutbox } from "@/lib/server/mailer";
import { resetServerRepository } from "@/lib/server/repository";
import { keepLocalOnlySections } from "@/lib/storage/store-sync";
import { browserRequest, registerVerified } from "./session-helpers";

const BASE = "http://localhost";
const talk = (over: Partial<FamilyTalk> = {}): FamilyTalk => ({ id: "t1", date: "2026-11-18", personIds: [], otherPeople: "Yusuf", topicIds: ["vertrauensperson"], tasks: [{ id: "k1", who: "Yusuf", what: "Vertrag holen", done: false }], documentsToKnow: ["testament"], storageExplained: "ja", openPoints: "Grab klären", ...over });
const topics = { erbe: { checkedQuestionIds: ["q1"], starredQuestionIds: [], notes: "Plus-Notiz" } };

const put = (body: unknown, cookie: string) => amanahPUT(browserRequest(`${BASE}/api/amanah`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }, cookie));
const stored = async (cookie: string): Promise<AmanahOrdnerData> => (await (await amanahGET(browserRequest(`${BASE}/api/amanah`, {}, cookie))).json()).data;
const newEmail = () => `p25-${crypto.randomUUID()}@test.invalid`;

beforeEach(() => {
  resetRateLimits();
  resetServerRepository();
  clearOutbox();
  globalThis.__amanahMemoryStore = undefined;
  delete process.env.AMANAH_SERVER_STORAGE;
  delete process.env.DATABASE_URL;
});
afterEach(() => vi.unstubAllEnvs());

function enforce(launch = "2000-01-01T00:00:00Z") {
  vi.stubEnv("AMANAH_BILLING_ENFORCE", "true");
  vi.stubEnv("AMANAH_PLUS_LAUNCH_AT", launch);
}

describe("plan matrix (Variante 1)", () => {
  it("makes only recording the conversation free; people and the rest of Plus stay Plus", () => {
    expect(featureForRoute("/dashboard/familiengespraech")?.id).toBe("family_conversation_record");
    expect(featureForRoute("/dashboard/familiengespraech")?.tier).toBe("free");
    expect(featureForRoute("/dashboard/personen")?.id).toBe("family_people");
    expect(featureForRoute("/dashboard/familie")?.tier).toBe("plus");
    expect(planFeature("family_people")?.tier).toBe("plus");
    expect(PARTLY_FREE_SECTIONS).toEqual({ familyConversation: ["talks"] });
    // The fully free sections are unchanged.
    expect([...FREE_ACCOUNT_SECTIONS]).toEqual(["assets", "emergencyCard", "checkProgress", "knowledgeBookmarks"]);
  });
});

describe("free account with Plus enforced", () => {
  it("stores the talks, keeps the preparation notes and the people as stored, and says what was not stored", async () => {
    enforce();
    const cookie = await registerVerified(BASE, newEmail());
    const res = await put({ ...defaultAmanahData, familyConversation: { topics, talks: [talk({ personIds: ["unknown-person"] })] }, familyMembers: [{ id: "p1", name: "Neu", relation: "" }] }, cookie);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.notStored).toEqual(expect.arrayContaining(["familyConversation", "familyMembers"]));
    const data = await stored(cookie);
    expect(data.familyConversation.talks).toHaveLength(1);
    expect(data.familyConversation.talks[0]).toMatchObject({ otherPeople: "Yusuf", openPoints: "Grab klären", storageExplained: "ja", personIds: [] });
    expect(data.familyConversation.topics).toEqual({});
    expect(data.familyMembers).toEqual([]);
  });

  it("a talk alone is stored completely and not reported as missing", async () => {
    enforce();
    const cookie = await registerVerified(BASE, newEmail());
    const body = await (await put({ ...defaultAmanahData, familyConversation: { topics: {}, talks: [talk()] } }, cookie)).json();
    expect(body.notStored ?? []).not.toContain("familyConversation");
    expect((await stored(cookie)).familyConversation.talks[0].tasks[0].what).toBe("Vertrag holen");
  });

  it("other Plus sections stay blocked as before", async () => {
    enforce();
    const cookie = await registerVerified(BASE, newEmail());
    await put({ ...defaultAmanahData, janazahWishes: { ...defaultAmanahData.janazahWishes, fullName: "Nicht gespeichert" }, familyMessage: { ...defaultAmanahData.familyMessage, familyLetter: "Nicht gespeichert" } }, cookie);
    const data = await stored(cookie);
    expect(data.janazahWishes.fullName).toBe("");
    expect(data.familyMessage.familyLetter).toBe("");
  });
});

describe("Plus or enforcement off: unchanged", () => {
  it("stores everything, including notes and people, when enforcement is off", async () => {
    const cookie = await registerVerified(BASE, newEmail());
    await put({ ...defaultAmanahData, familyConversation: { topics, talks: [talk({ personIds: ["p1"] })] }, familyMembers: [{ id: "p1", name: "Yusuf", relation: "Sohn" }] }, cookie);
    const data = await stored(cookie);
    expect(data.familyConversation.topics).toEqual(topics);
    expect(data.familyConversation.talks[0].personIds).toEqual(["p1"]);
  });

  it("an account from before the launch keeps the full scope", async () => {
    enforce("2999-01-01T00:00:00Z");
    const cookie = await registerVerified(BASE, newEmail());
    await put({ ...defaultAmanahData, familyConversation: { topics, talks: [talk()] } }, cookie);
    expect((await stored(cookie)).familyConversation.topics).toEqual(topics);
  });
});

describe("rule helpers", () => {
  it("a free talk may point only to people already in the folder", () => {
    const existing = normalizeData({ familyMembers: [{ id: "p1", name: "Yusuf", relation: "" }], familyConversation: { topics, talks: [] } });
    const result = freeFamilyConversation({ topics: {}, talks: [talk({ personIds: ["p1", "p9"] })] }, existing);
    expect(result.talks[0].personIds).toEqual(["p1"]);
    expect(result.topics).toEqual(topics);
    expect(notStoredSections(existing, { familyConversation: { topics, talks: [talk({ personIds: ["p1"] })] } })).toEqual([]);
  });

  it("on login without Plus: account talks win, browser-only notes stay", () => {
    const remote = normalizeData({ familyConversation: { topics: {}, talks: [talk({ id: "konto" })] } });
    const local = normalizeData({ familyConversation: { topics, talks: [talk({ id: "browser" })] } });
    const merged = keepLocalOnlySections(remote, local);
    expect(merged.familyConversation.talks.map((t) => t.id)).toEqual(["konto"]);
    expect(merged.familyConversation.topics).toEqual(topics);
    expect(keepLocalOnlySections(normalizeData({}), local).familyConversation.talks.map((t) => t.id)).toEqual(["browser"]);
  });
});
