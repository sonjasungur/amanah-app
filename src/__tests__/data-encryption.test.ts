import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DataEncryptionError,
  decryptJson,
  encryptJson,
  isEncryptedEnvelope,
  openFromStorage,
  parseKeyring,
  rewrapEnvelope,
  sealForStorage,
} from "@/lib/server/data-encryption";
import { MemoryRepository } from "@/lib/server/repository/memory-repository";
import { demoAmanahData } from "@/lib/domain/demo-data";

/** Test-only keys, generated per run; never real keys. */
const keyA = Buffer.alloc(32, 7).toString("base64");
const keyB = Buffer.alloc(32, 9).toString("base64");
const envA = { AMANAH_DATA_KEYS: `a:${keyA}`, AMANAH_DATA_KEY_ACTIVE: "a" } as unknown as NodeJS.ProcessEnv;
const envAB = { AMANAH_DATA_KEYS: `a:${keyA},b:${keyB}`, AMANAH_DATA_KEY_ACTIVE: "b" } as unknown as NodeJS.ProcessEnv;
/** Builds a partial env for the pure functions. */
function env(values: Record<string, string>): NodeJS.ProcessEnv {
  return values as unknown as NodeJS.ProcessEnv;
}

const SECRET = { medical: "Diabetes Typ 2", religion: "Muslim", note: "Ümlaut ✓ عربي" };

describe("envelope encryption", () => {
  it("round-trips JSON and leaves no plaintext in the envelope", () => {
    const ring = parseKeyring(envA)!;
    const env = encryptJson(SECRET, "user-1", ring);
    expect(isEncryptedEnvelope(env)).toBe(true);
    expect(JSON.stringify(env)).not.toContain("Diabetes");
    expect(decryptJson(env, "user-1", ring)).toEqual(SECRET);
  });

  it("uses a fresh IV and data key per write", () => {
    const ring = parseKeyring(envA)!;
    const a = encryptJson(SECRET, "user-1", ring);
    const b = encryptJson(SECRET, "user-1", ring);
    expect(a.data.ct).not.toBe(b.data.ct);
    expect(a.dek.ct).not.toBe(b.dek.ct);
  });

  it("fails for another owner, a wrong key or tampered data — without leaking plaintext", () => {
    const ring = parseKeyring(envA)!;
    const env = encryptJson(SECRET, "user-1", ring);
    expect(() => decryptJson(env, "user-2", ring)).toThrow(DataEncryptionError);
    const wrong = parseKeyring({ AMANAH_DATA_KEYS: `a:${keyB}` } as unknown as NodeJS.ProcessEnv)!;
    expect(() => decryptJson(env, "user-1", wrong)).toThrow(DataEncryptionError);
    const tampered = { ...env, data: { ...env.data, ct: Buffer.from("x" + env.data.ct).toString("base64") } };
    try {
      decryptJson(tampered, "user-1", ring);
      throw new Error("should fail");
    } catch (e) {
      expect(e).toBeInstanceOf(DataEncryptionError);
      expect(String(e)).not.toMatch(/Diabetes|Muslim/);
      expect(String(e)).not.toContain(keyA);
    }
  });

  it("rotates by re-wrapping the data key; old key still needed only for unrotated rows", () => {
    const old = encryptJson(SECRET, "user-1", parseKeyring(envA)!);
    const ring = parseKeyring(envAB)!;
    expect(decryptJson(old, "user-1", ring)).toEqual(SECRET);
    const rotated = rewrapEnvelope(old, "user-1", ring);
    expect(rotated.kid).toBe("b");
    expect(rotated.data).toEqual(old.data);
    const onlyB = parseKeyring({ AMANAH_DATA_KEYS: `b:${keyB}` } as unknown as NodeJS.ProcessEnv)!;
    expect(decryptJson(rotated, "user-1", onlyB)).toEqual(SECRET);
    expect(() => decryptJson(old, "user-1", onlyB)).toThrow(/Unknown key id/);
  });

  it("rejects malformed key configuration", () => {
    expect(() => parseKeyring(env({ AMANAH_DATA_KEYS: "a:c2hvcnQ=" }))).toThrow(/32 bytes/);
    expect(() => parseKeyring({ AMANAH_DATA_KEYS: `a:${keyA}`, AMANAH_DATA_KEY_ACTIVE: "x" } as unknown as NodeJS.ProcessEnv)).toThrow(/not in/);
    expect(parseKeyring(env({}))).toBeNull();
  });
});

describe("storage boundary", () => {
  it("refuses plaintext writes when encryption is required", () => {
    expect(() => sealForStorage(SECRET, "u", env({ NODE_ENV: "production" }))).toThrow(/required/);
    expect(sealForStorage(SECRET, "u", env({ AMANAH_DATA_ENCRYPTION: "optional" }))).toEqual(SECRET);
  });

  it("reads legacy plaintext rows and refuses encrypted rows without keys", () => {
    expect(openFromStorage(SECRET, "u", envA)).toEqual(SECRET);
    const sealed = sealForStorage(SECRET, "u", envA);
    expect(() => openFromStorage(sealed, "u", env({}))).toThrow(/not set/);
  });
});

describe("memory repository stores ciphertext", () => {
  beforeEach(() => {
    globalThis.__amanahMemoryStore = undefined;
    vi.stubEnv("AMANAH_DATA_KEYS", `a:${keyA}`);
    vi.stubEnv("AMANAH_DATA_KEY_ACTIVE", "a");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("persists an envelope and returns plaintext to the owner", async () => {
    const repo = new MemoryRepository();
    const user = await repo.registerUser(`enc-${crypto.randomUUID()}@test.de`, "testpass1", "E");
    if ("error" in user) throw new Error(user.error);
    await repo.saveAmanahData(user.id, demoAmanahData);
    const raw = globalThis.__amanahMemoryStore!.amanahData.get(user.id);
    expect(isEncryptedEnvelope(raw)).toBe(true);
    expect(JSON.stringify(raw)).not.toContain("Ahmed Demo");
    expect((await repo.getAmanahData(user.id))?.userProfile.name).toBe("Ahmed Demo");
  });
});
