import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE as amanahDELETE, GET as amanahGET, PATCH as amanahPATCH, PUT as amanahPUT } from "@/app/api/amanah/route";
import { GET as exportGET } from "@/app/api/account/export/route";
import { POST as restorePOST } from "@/app/api/amanah/history/[id]/restore/route";
import { DELETE as consentDELETE } from "@/app/api/consent/route";
import { defaultAmanahData } from "@/lib/domain/defaults";
import { resetRateLimits } from "@/lib/ai/rate-limit";
import { isEncryptedEnvelope, reencryptStoredValue, parseKeyring } from "@/lib/server/data-encryption";
import { clearOutbox } from "@/lib/server/mailer";
import { getMemoryStore } from "@/lib/server/memory-store";
import { getServerRepository, resetServerRepository } from "@/lib/server/repository";
import { browserRequest, registerVerified } from "./session-helpers";

const BASE = "http://localhost";
const RIGHT = Buffer.alloc(32, 7).toString("base64");
const WRONG = Buffer.alloc(32, 8).toString("base64");
const OTHER = Buffer.alloc(32, 9).toString("base64");
const SECRET_NAME = "Synthetisch Bestand";

const setKeys = (keys: string, active = "a") => {
  vi.stubEnv("AMANAH_DATA_KEYS", keys);
  vi.stubEnv("AMANAH_DATA_KEY_ACTIVE", active);
};
const rightKey = () => setKeys(`a:${RIGHT}`);

const folderWith = (name: string) => ({ ...defaultAmanahData, emergencyCard: { ...defaultAmanahData.emergencyCard, name } });
const write = (method: "PUT" | "PATCH", body: unknown, cookie: string) =>
  browserRequest(`${BASE}/api/amanah`, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }, cookie);
const get = (cookie: string) => amanahGET(browserRequest(`${BASE}/api/amanah`, {}, cookie));

async function account() {
  rightKey();
  const email = `unreadable-${crypto.randomUUID()}@test.invalid`;
  const cookie = await registerVerified(BASE, email);
  const user = (await getServerRepository().findUserByEmail(email))!;
  expect((await amanahPUT(write("PUT", folderWith(SECRET_NAME), cookie))).status).toBe(200);
  return { cookie, userId: user.id };
}

const storedRow = (userId: string) => JSON.stringify(getMemoryStore().amanahData.get(userId));

async function expectRejected(response: Response) {
  expect(response.status).toBe(503);
  const body = await response.json();
  expect(body.code).toBe("folder_unreadable");
  expect(body.error).toContain("nicht verändert");
  expect(JSON.stringify(body)).not.toContain(SECRET_NAME);
}

const FAULTS: [string, () => void][] = [
  ["wrong key under the same id", () => setKeys(`a:${WRONG}`)],
  ["no key at all", () => setKeys("")],
  ["the row's key was removed", () => setKeys(`b:${OTHER}`, "b")],
];

beforeEach(() => {
  resetRateLimits();
  resetServerRepository();
  clearOutbox();
  globalThis.__amanahMemoryStore = undefined;
  delete process.env.AMANAH_SERVER_STORAGE;
  delete process.env.DATABASE_URL;
  vi.stubEnv("AMANAH_DATA_ENCRYPTION", "required");
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("folder that cannot be decrypted", () => {
  it("regular creating, saving and reading keep working with the right key", async () => {
    const { cookie, userId } = await account();
    expect(isEncryptedEnvelope(getMemoryStore().amanahData.get(userId))).toBe(true);
    expect((await (await get(cookie)).json()).data.emergencyCard.name).toBe(SECRET_NAME);
    expect((await amanahPUT(write("PUT", folderWith("Zweiter Stand"), cookie))).status).toBe(200);
    expect((await amanahPATCH(write("PATCH", { userProfile: { ...defaultAmanahData.userProfile, name: "Teil" } }, cookie))).status).toBe(200);
    const after = (await (await get(cookie)).json()).data;
    expect(after.emergencyCard.name).toBe("Zweiter Stand");
    expect(after.userProfile.name).toBe("Teil");
  });

  describe.each(FAULTS)("%s", (_name, fault) => {
    it("rejects reading and every write path, and the data is intact with the right key", async () => {
      const { cookie, userId } = await account();
      const before = storedRow(userId);
      fault();

      await expectRejected(await get(cookie));
      await expectRejected(await amanahPUT(write("PUT", folderWith("Ueberschrieben"), cookie)));
      await expectRejected(await amanahPUT(write("PUT", defaultAmanahData, cookie)));
      await expectRejected(await amanahPATCH(write("PATCH", { emergencyCard: { ...defaultAmanahData.emergencyCard, name: "Teilweise" } }, cookie)));
      await expectRejected(await amanahDELETE(browserRequest(`${BASE}/api/amanah`, { method: "DELETE" }, cookie)));
      await expectRejected(await exportGET(browserRequest(`${BASE}/api/account/export`, {}, cookie)));
      expect(storedRow(userId)).toBe(before);

      rightKey();
      expect((await (await get(cookie)).json()).data.emergencyCard.name).toBe(SECRET_NAME);
      expect(storedRow(userId)).toBe(before);
      expect((await amanahPUT(write("PUT", folderWith("Danach regulaer"), cookie))).status).toBe(200);
    });
  });

  it("rejects the write path for accounts limited to the free sections", async () => {
    const { cookie, userId } = await account();
    vi.stubEnv("AMANAH_BILLING_ENFORCE", "true");
    vi.stubEnv("AMANAH_PLUS_LAUNCH_AT", "2000-01-01T00:00:00Z");
    const before = storedRow(userId);
    setKeys(`a:${WRONG}`);
    await expectRejected(await amanahPUT(write("PUT", { ...defaultAmanahData, assets: [] }, cookie)));
    await expectRejected(await amanahPATCH(write("PATCH", { assets: [] }, cookie)));
    expect(storedRow(userId)).toBe(before);
  });

  it("rejects restoring a version, without touching the folder or the history", async () => {
    vi.stubEnv("AMANAH_DATA_HISTORY", "true");
    const { cookie, userId } = await account();
    expect((await amanahPUT(write("PUT", folderWith("Zweiter Stand"), cookie))).status).toBe(200);
    const [version] = await getServerRepository().listDataVersions(userId);
    const before = storedRow(userId);
    const versions = JSON.stringify(getMemoryStore().dataVersions);

    setKeys(`a:${WRONG}`);
    const response = await restorePOST(
      browserRequest(`${BASE}/api/amanah/history/${version.id}/restore`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirmed: true }) }, cookie),
      { params: Promise.resolve({ id: version.id }) }
    );
    await expectRejected(response);
    await expectRejected(await amanahPUT(write("PUT", folderWith("Ueberschrieben"), cookie)));
    expect(storedRow(userId)).toBe(before);
    expect(JSON.stringify(getMemoryStore().dataVersions)).toBe(versions);
  });

  it("treats a sealed value of an unknown format as unreadable, not as an empty plaintext folder", async () => {
    const { cookie, userId } = await account();
    getMemoryStore().amanahData.set(userId, { $enc: "amanah-kuenftig-v9", blob: "x" } as never);
    const before = storedRow(userId);
    await expectRejected(await get(cookie));
    await expectRejected(await amanahPUT(write("PUT", folderWith("Ueberschrieben"), cookie)));
    expect(storedRow(userId)).toBe(before);
    expect(() => reencryptStoredValue({ $enc: "amanah-kuenftig-v9" }, userId, parseKeyring({ AMANAH_DATA_KEYS: `a:${RIGHT}` } as never)!)).toThrow();
  });

  it("logs and answers without key material or folder content", async () => {
    const { cookie } = await account();
    setKeys(`a:${WRONG}`);
    await expectRejected(await amanahPUT(write("PUT", folderWith("Ueberschrieben"), cookie)));
    const logged = JSON.stringify(vi.mocked(console.error).mock.calls);
    expect(logged).toContain("[folder] rejected");
    for (const secret of [RIGHT, WRONG, SECRET_NAME, "Ueberschrieben", cookie]) expect(logged).not.toContain(secret);
  });

  it("the first save of a new account still works, and a missing key fails it without a row", async () => {
    rightKey();
    const email = `first-${crypto.randomUUID()}@test.invalid`;
    const cookie = await registerVerified(BASE, email);
    const user = (await getServerRepository().findUserByEmail(email))!;
    setKeys("");
    await expectRejected(await amanahPUT(write("PUT", folderWith("Neu"), cookie)));
    expect(getMemoryStore().amanahData.has(user.id)).toBe(false);
    rightKey();
    expect((await amanahPUT(write("PUT", folderWith("Neu"), cookie))).status).toBe(200);
  });

  it("key change: old rows stay readable while their key is configured, new writes use the active key", async () => {
    const { cookie, userId } = await account();
    setKeys(`a:${RIGHT},b:${OTHER}`, "b");
    expect((await (await get(cookie)).json()).data.emergencyCard.name).toBe(SECRET_NAME);
    expect((await amanahPUT(write("PUT", folderWith("Neuer Schluessel"), cookie))).status).toBe(200);
    expect((getMemoryStore().amanahData.get(userId) as unknown as { kid: string }).kid).toBe("b");
    setKeys(`a:${RIGHT}`);
    await expectRejected(await get(cookie));
  });

  it("a dry run of the operator tool notices a wrong key under the active id", async () => {
    const { userId } = await account();
    const stored = getMemoryStore().amanahData.get(userId);
    expect(reencryptStoredValue(stored, userId, parseKeyring({ AMANAH_DATA_KEYS: `a:${RIGHT}` } as never)!).action).toBe("unchanged");
    expect(() => reencryptStoredValue(stored, userId, parseKeyring({ AMANAH_DATA_KEYS: `a:${WRONG}` } as never)!)).toThrow();
  });

  it("explicit erasure stays possible: withdrawing consent removes the unreadable folder", async () => {
    const { cookie, userId } = await account();
    setKeys(`a:${WRONG}`);
    const response = await consentDELETE(
      browserRequest(`${BASE}/api/consent`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ purpose: "sensitive_folder_storage" }) }, cookie)
    );
    expect(response.status).toBe(200);
    expect(getMemoryStore().amanahData.has(userId)).toBe(false);
  });
});
