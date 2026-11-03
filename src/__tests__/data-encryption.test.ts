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
  checkKeyReferences,
  isKeyReferenceEnforced,
  sealKeyReference,
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

describe("key reference check", () => {
  const keyA = Buffer.alloc(32, 21).toString("base64");
  const required = (keys: string, active?: string) => ({ AMANAH_DATA_ENCRYPTION: "required", AMANAH_DATA_KEYS: keys, AMANAH_DATA_KEY_ACTIVE: active }) as unknown as NodeJS.ProcessEnv;
  const row = (kid = "a", key = keyA) => ({ kid, retiredAt: null, data: sealKeyReference(kid, parseKeyring(required(`${kid}:${key}`, kid))!) });

  it("reports each state", () => {
    expect(checkKeyReferences([row()], required(`a:${keyA}`, "a")).status).toBe("ok");
    expect(checkKeyReferences([], required(`a:${keyA}`, "a")).status).toBe("not_initialized");
    expect(checkKeyReferences([row()], required("")).status).toBe("missing_key");
    expect(checkKeyReferences([row()], required(`a:${Buffer.alloc(32, 22).toString("base64")}`, "a")).status).toBe("wrong_key");
    expect(checkKeyReferences([{ ...row(), retiredAt: new Date() }, row("b")], required(`b:${keyA}`, "b")).status).toBe("ok");
  });

  it("a copied or altered reference does not count", () => {
    const copied = { ...row("a"), kid: "b" };
    expect(checkKeyReferences([copied], required(`a:${keyA},b:${keyA}`, "b")).status).toBe("wrong_key");
    expect(checkKeyReferences([{ ...row(), data: { tampered: true } }], required(`a:${keyA}`, "a")).status).toBe("wrong_key");
  });

  it("optional mode without keys stays usable for local development", () => {
    expect(checkKeyReferences([], { AMANAH_DATA_ENCRYPTION: "optional" } as unknown as NodeJS.ProcessEnv).status).toBe("ok");
  });

  it("is enforced everywhere except unit tests, and that exception cannot be set from outside a test", () => {
    expect(isKeyReferenceEnforced({ NODE_ENV: "production", AMANAH_KEY_REFERENCE_IN_TESTS: "false" } as unknown as NodeJS.ProcessEnv)).toBe(true);
    expect(isKeyReferenceEnforced({ NODE_ENV: "test" } as unknown as NodeJS.ProcessEnv)).toBe(false);
  });
});
