import { createHmac, timingSafeEqual } from "crypto";

/**
 * Webhook signature in the common "t=<unix>,v1=<hex hmac-sha256 of `${t}.${payload}`>" scheme
 * (as used by Stripe), so a real provider adapter can reuse the verification.
 */
export const DEFAULT_TOLERANCE_SECONDS = 300;

export function signPayload(payload: string, secret: string, timestamp = Math.floor(Date.now() / 1000)): string {
  const mac = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
  return `t=${timestamp},v1=${mac}`;
}

export function verifySignature(
  payload: string,
  header: string | null,
  secret: string,
  { toleranceSeconds = DEFAULT_TOLERANCE_SECONDS, now = Math.floor(Date.now() / 1000) } = {}
): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(",").map((p) => p.trim().split("=") as [string, string]));
  const timestamp = Number(parts.t);
  if (!Number.isInteger(timestamp) || !parts.v1) return false;
  if (Math.abs(now - timestamp) > toleranceSeconds) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest();
  const given = Buffer.from(parts.v1, "hex");
  return given.length === expected.length && timingSafeEqual(given, expected);
}
