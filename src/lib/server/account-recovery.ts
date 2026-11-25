import { IMPRINT } from "@/lib/legal/imprint";
import { generateSessionToken, hashSessionToken, normalizeEmail } from "./crypto";
import { sendMail } from "./mailer";
import type { AuthTokenPurpose, ServerRepository } from "./repository/types";

export const VERIFY_EMAIL_TTL_MS = 24 * 60 * 60 * 1000;
export const RESET_PASSWORD_TTL_MS = 30 * 60 * 1000;

/** Uniform answer for register/resend/reset requests — never reveals whether an account exists. */
export const CHECK_EMAIL_RESPONSE = {
  status: "check_email",
  message: "Wenn die Angaben stimmen, haben wir dir eine E-Mail geschickt. Bitte prüfe dein Postfach.",
} as const;

/**
 * Base URL for links in e-mails. Taken from configuration only — never from the
 * request's Host header (prevents password-reset link poisoning).
 */
export function getPublicBaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  const configured = env.AMANAH_PUBLIC_BASE_URL || env.NEXT_PUBLIC_SITE_URL || env.NEXT_PUBLIC_APP_URL;
  if (configured?.trim()) return configured.trim().replace(/\/+$/, "");
  if (env.NODE_ENV === "production") throw new Error("AMANAH_PUBLIC_BASE_URL must be set in production.");
  return "http://localhost:3000";
}

/** Sender line under every account mail: who writes and where the imprint is (owner order 25.11.2026, AP2). */
export function mailFooter(): string {
  return `\n\n—\nWasiyya · ${IMPRINT.operatorLegalName}\nImpressum: ${getPublicBaseUrl()}/impressum`;
}

async function issueToken(repo: ServerRepository, userId: string, purpose: AuthTokenPurpose, ttlMs: number): Promise<string> {
  await repo.invalidateAuthTokens(userId, purpose);
  const token = generateSessionToken();
  await repo.createAuthToken(userId, purpose, hashSessionToken(token), new Date(Date.now() + ttlMs));
  return token;
}

export async function sendVerificationMail(repo: ServerRepository, user: { id: string; email: string }): Promise<void> {
  const token = await issueToken(repo, user.id, "verify_email", VERIFY_EMAIL_TTL_MS);
  await sendMail({
    to: user.email,
    kind: "verify_email",
    subject: "Bitte bestätige deine E-Mail-Adresse – Wasiyya",
    text:
      "Assalamu alaikum,\n\nbitte bestätige deine E-Mail-Adresse für Wasiyya:\n" +
      `${getPublicBaseUrl()}/konto/bestaetigen?token=${encodeURIComponent(token)}\n\n` +
      "Der Link ist 24 Stunden gültig und nur einmal nutzbar. Wenn du kein Konto angelegt hast, ignoriere diese E-Mail." + mailFooter(),
  });
}

export async function sendAccountExistsMail(email: string): Promise<void> {
  await sendMail({
    to: email,
    kind: "account_exists",
    subject: "Du hast bereits ein Konto – Wasiyya",
    text:
      "Assalamu alaikum,\n\nfür diese E-Mail-Adresse besteht bereits ein Konto bei Wasiyya. " +
      `Falls du dein Passwort vergessen hast: ${getPublicBaseUrl()}/passwort-vergessen\n\n` +
      "Wenn du keine Registrierung versucht hast, kannst du diese E-Mail ignorieren." + mailFooter(),
  });
}

export async function sendPasswordResetMail(repo: ServerRepository, user: { id: string; email: string }): Promise<void> {
  const token = await issueToken(repo, user.id, "reset_password", RESET_PASSWORD_TTL_MS);
  await sendMail({
    to: user.email,
    kind: "reset_password",
    subject: "Passwort zurücksetzen – Wasiyya",
    text:
      "Assalamu alaikum,\n\nüber diesen Link kannst du ein neues Passwort festlegen:\n" +
      `${getPublicBaseUrl()}/passwort-zuruecksetzen?token=${encodeURIComponent(token)}\n\n` +
      "Der Link ist 30 Minuten gültig und nur einmal nutzbar. Danach wirst du auf allen Geräten abgemeldet. " +
      "Wenn du das nicht angefordert hast, ignoriere diese E-Mail – dein Passwort bleibt unverändert." + mailFooter(),
  });
}

export async function consumeToken(repo: ServerRepository, rawToken: unknown, purpose: AuthTokenPurpose): Promise<string | null> {
  if (typeof rawToken !== "string" || rawToken.length < 20 || rawToken.length > 200) return null;
  return repo.consumeAuthToken(hashSessionToken(rawToken), purpose);
}

export function emailKey(email: string): string {
  return normalizeEmail(email);
}
