import { createHash, randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function hashPasswordServer(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${derived.toString("hex")}`;
}

export async function verifyPasswordServer(password: string, storedHash: string): Promise<boolean> {
  if (!storedHash.startsWith("scrypt:")) return false;
  const [, salt, hashHex] = storedHash.split(":");
  if (!salt || !hashHex) return false;
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  const stored = Buffer.from(hashHex, "hex");
  if (derived.length !== stored.length) return false;
  return timingSafeEqual(derived, stored);
}

export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET || process.env.AUTH_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET (or AUTH_SECRET) must be set in production.");
  }
  return "dev-only-change-me";
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(`${getSessionSecret()}:${token}`).digest("hex");
}
