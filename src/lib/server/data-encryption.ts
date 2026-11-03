import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

/**
 * Envelope encryption for personal folder data at rest (AES-256-GCM).
 *
 * - Each record gets a random 256-bit data key (DEK) that encrypts the JSON.
 * - The DEK is wrapped with a key-encryption key (KEK) from the environment,
 *   never from the database or the repository.
 * - Additional authenticated data binds the ciphertext to its owner, so a row
 *   copied to another user fails to decrypt.
 * - Rotation: add a new KEK id, make it active, re-wrap DEKs (scripts/reencrypt-amanah-data.ts).
 *
 * Env:
 *   AMANAH_DATA_KEYS        "kid:base64key[,kid:base64key…]" (32-byte keys)
 *   AMANAH_DATA_KEY_ACTIVE  kid used for new writes
 *   AMANAH_DATA_ENCRYPTION  "required" (default in production) | "optional"
 *
 * Errors never include key material or plaintext.
 */

export const ENVELOPE_FORMAT = "amanah-aes256gcm-v1";
const ALGORITHM = "aes-256-gcm";

interface Sealed {
  iv: string;
  tag: string;
  ct: string;
}

export interface EncryptedEnvelope {
  $enc: typeof ENVELOPE_FORMAT;
  kid: string;
  dek: Sealed;
  data: Sealed;
}

export class DataEncryptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DataEncryptionError";
  }
}

interface Keyring {
  active: string;
  keys: Map<string, Buffer>;
}

export function parseKeyring(env: NodeJS.ProcessEnv = process.env): Keyring | null {
  const raw = env.AMANAH_DATA_KEYS?.trim();
  if (!raw) return null;
  const keys = new Map<string, Buffer>();
  for (const entry of raw.split(",")) {
    const [kid, b64] = entry.trim().split(":");
    if (!kid || !b64) throw new DataEncryptionError("AMANAH_DATA_KEYS: invalid entry format (expected kid:base64).");
    const key = Buffer.from(b64, "base64");
    if (key.length !== 32) throw new DataEncryptionError(`AMANAH_DATA_KEYS: key '${kid}' must be 32 bytes.`);
    keys.set(kid, key);
  }
  const active = env.AMANAH_DATA_KEY_ACTIVE?.trim() || [...keys.keys()].at(-1)!;
  if (!keys.has(active)) throw new DataEncryptionError(`AMANAH_DATA_KEY_ACTIVE '${active}' is not in AMANAH_DATA_KEYS.`);
  return { active, keys };
}

export function isEncryptionRequired(env: NodeJS.ProcessEnv = process.env): boolean {
  const mode = env.AMANAH_DATA_ENCRYPTION?.trim();
  if (mode === "required") return true;
  if (mode === "optional") return false;
  return env.NODE_ENV === "production";
}

function seal(key: Buffer, plaintext: Buffer, aad: string): Sealed {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  cipher.setAAD(Buffer.from(aad, "utf8"));
  const ct = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return { iv: iv.toString("base64"), tag: cipher.getAuthTag().toString("base64"), ct: ct.toString("base64") };
}

function open(key: Buffer, sealed: Sealed, aad: string): Buffer {
  try {
    const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(sealed.iv, "base64"));
    decipher.setAAD(Buffer.from(aad, "utf8"));
    decipher.setAuthTag(Buffer.from(sealed.tag, "base64"));
    return Buffer.concat([decipher.update(Buffer.from(sealed.ct, "base64")), decipher.final()]);
  } catch {
    throw new DataEncryptionError("Decryption failed (wrong key, wrong owner or tampered data).");
  }
}

function dekAad(ownerId: string, kid: string): string {
  return `${ENVELOPE_FORMAT}|dek|${kid}|${ownerId}`;
}

function dataAad(ownerId: string): string {
  return `${ENVELOPE_FORMAT}|data|${ownerId}`;
}

export function isEncryptedEnvelope(value: unknown): value is EncryptedEnvelope {
  return Boolean(value && typeof value === "object" && (value as { $enc?: unknown }).$enc === ENVELOPE_FORMAT);
}

/** A sealed value in a format this version does not know is still sealed: never read it as plaintext. */
function assertKnownFormat(value: unknown): void {
  if (value && typeof value === "object" && "$enc" in value && !isEncryptedEnvelope(value)) {
    throw new DataEncryptionError("Stored data has an unknown encryption format.");
  }
}

export function encryptJson(value: unknown, ownerId: string, keyring: Keyring): EncryptedEnvelope {
  const kek = keyring.keys.get(keyring.active)!;
  const dek = randomBytes(32);
  try {
    return {
      $enc: ENVELOPE_FORMAT,
      kid: keyring.active,
      dek: seal(kek, dek, dekAad(ownerId, keyring.active)),
      data: seal(dek, Buffer.from(JSON.stringify(value), "utf8"), dataAad(ownerId)),
    };
  } finally {
    dek.fill(0);
  }
}

export function decryptJson<T = unknown>(envelope: EncryptedEnvelope, ownerId: string, keyring: Keyring): T {
  const kek = keyring.keys.get(envelope.kid);
  if (!kek) throw new DataEncryptionError(`Unknown key id '${envelope.kid}'.`);
  const dek = open(kek, envelope.dek, dekAad(ownerId, envelope.kid));
  try {
    return JSON.parse(open(dek, envelope.data, dataAad(ownerId)).toString("utf8")) as T;
  } finally {
    dek.fill(0);
  }
}

/** Re-wraps the data key with the active KEK; the data ciphertext is untouched. */
export function rewrapEnvelope(envelope: EncryptedEnvelope, ownerId: string, keyring: Keyring): EncryptedEnvelope {
  if (envelope.kid === keyring.active) return envelope;
  const oldKek = keyring.keys.get(envelope.kid);
  if (!oldKek) throw new DataEncryptionError(`Unknown key id '${envelope.kid}'.`);
  const dek = open(oldKek, envelope.dek, dekAad(ownerId, envelope.kid));
  try {
    const kek = keyring.keys.get(keyring.active)!;
    return { ...envelope, kid: keyring.active, dek: seal(kek, dek, dekAad(ownerId, keyring.active)) };
  } finally {
    dek.fill(0);
  }
}

export type ReencryptAction = "encrypt_plaintext" | "rewrap" | "unchanged";

/**
 * Migration step for one stored value: plaintext → envelope, old KEK → active KEK.
 * Used by scripts/reencrypt-amanah-data.mjs; never logs or returns plaintext to callers
 * other than the new stored value.
 */
export function reencryptStoredValue(
  stored: unknown,
  ownerId: string,
  keyring: Keyring
): { action: ReencryptAction; value: unknown } {
  assertKnownFormat(stored);
  if (!isEncryptedEnvelope(stored)) return { action: "encrypt_plaintext", value: encryptJson(stored, ownerId, keyring) };
  if (stored.kid !== keyring.active) return { action: "rewrap", value: rewrapEnvelope(stored, ownerId, keyring) };
  // Opened on purpose: a dry run then also proves that the configured key is the right one.
  decryptJson(stored, ownerId, keyring);
  return { action: "unchanged", value: stored };
}

/**
 * Storage boundary used by the repositories.
 * Writes are encrypted whenever keys are configured; without keys, writes fail if
 * encryption is required. Legacy plaintext rows are still readable and become
 * encrypted on the next write. Every failure here is a DataEncryptionError: a row that
 * cannot be opened is unreadable, never empty, and must not be written over.
 */
export function sealForStorage(value: unknown, ownerId: string, env: NodeJS.ProcessEnv = process.env): unknown {
  const keyring = parseKeyring(env);
  if (keyring) return encryptJson(value, ownerId, keyring);
  if (isEncryptionRequired(env)) throw new DataEncryptionError("Data encryption is required but AMANAH_DATA_KEYS is not set.");
  return value;
}

export function openFromStorage<T = unknown>(stored: unknown, ownerId: string, env: NodeJS.ProcessEnv = process.env): T {
  assertKnownFormat(stored);
  if (!isEncryptedEnvelope(stored)) return stored as T;
  const keyring = parseKeyring(env);
  if (!keyring) throw new DataEncryptionError("Encrypted data found but AMANAH_DATA_KEYS is not set.");
  return decryptJson<T>(stored, ownerId, keyring);
}

/** Generates a new base64 key for AMANAH_DATA_KEYS (for operators; never logged by the app). */
export function generateDataKey(): string {
  return randomBytes(32).toString("base64");
}
