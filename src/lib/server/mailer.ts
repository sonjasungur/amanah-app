import { MailDeliveryError, readProviderConfig, sendViaProvider, type MailProvider } from "./mail-providers";
import { SmtpDeliveryError, readSmtpConfig, sendViaSmtp } from "./mail-smtp";

/**
 * Outgoing mail.
 *
 * AMANAH_MAIL_TRANSPORT:
 *   "outbox"   — messages are kept in memory for local development and tests (default outside production)
 *   "disabled" — sending fails (default in production until a provider is configured)
 *   "smtp"     — the operator's own mailbox via SMTP (owner decision 23.11.2026: Zoho, contact@mscisystems.com)
 *   "brevo" | "postmark" — HTTP API, needs AMANAH_MAIL_API_KEY and AMANAH_MAIL_FROM
 *
 * AMANAH_MAIL_ALLOWLIST (staging only, comma-separated addresses): real delivery only to these
 * addresses; every other message stays in the in-memory outbox, so synthetic test accounts never
 * cause real mail. Production refuses the allowlist.
 *
 * Message bodies and addresses are never logged.
 */
export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  kind: "verify_email" | "reset_password" | "account_exists" | "contact";
  /** Contact form: replies go to the sender of the message. */
  replyTo?: string;
  sentAt: string;
}

export class MailNotConfiguredError extends Error {
  constructor() {
    super("No mail transport configured.");
    this.name = "MailNotConfiguredError";
  }
}

declare global {
  var __amanahOutbox: MailMessage[] | undefined;
}

const OUTBOX_LIMIT = 200;

export type MailTransport = "outbox" | "disabled" | "smtp" | MailProvider;

export function getMailTransport(): MailTransport {
  const value = process.env.AMANAH_MAIL_TRANSPORT?.trim();
  if (value === "outbox" || value === "disabled" || value === "smtp" || value === "brevo" || value === "postmark") return value;
  return process.env.NODE_ENV === "production" ? "disabled" : "outbox";
}

/** Addresses that may receive real mail on staging; null when no allowlist is set. */
export function mailAllowlist(env: NodeJS.ProcessEnv = process.env): string[] | null {
  const raw = env.AMANAH_MAIL_ALLOWLIST?.trim();
  if (!raw) return null;
  return raw
    .split(",")
    .map((a) => a.trim().toLowerCase())
    .filter(Boolean);
}

/** The in-memory outbox is in use: plain outbox transport, or the staging allowlist mode. */
export function usesOutbox(): boolean {
  return getMailTransport() === "outbox" || mailAllowlist() !== null;
}

function keepInOutbox(message: Omit<MailMessage, "sentAt">): void {
  const outbox = (globalThis.__amanahOutbox ??= []);
  outbox.push({ ...message, to: message.to.trim().toLowerCase(), sentAt: new Date().toISOString() });
  if (outbox.length > OUTBOX_LIMIT) outbox.shift();
}

/**
 * Returns whether the message was handed over (outbox counts as handed over). Delivery failures are
 * logged without address or content and not thrown: account mails answer generically, so a failure
 * must not reveal whether an account exists. The contact form uses the result to tell the visitor.
 */
export async function sendMail(message: Omit<MailMessage, "sentAt">, fetchImpl: typeof fetch = fetch): Promise<boolean> {
  const transport = getMailTransport();
  if (transport === "disabled") throw new MailNotConfiguredError();
  if (transport === "outbox") {
    keepInOutbox(message);
    return true;
  }
  const allow = mailAllowlist();
  if (allow && !allow.includes(message.to.trim().toLowerCase())) {
    keepInOutbox(message);
    return true;
  }
  if (transport === "smtp") {
    const config = readSmtpConfig();
    if (!config) throw new MailNotConfiguredError();
    try {
      await sendViaSmtp(config, message);
      console.info(`[mail] smtp delivered (${message.kind})`);
      return true;
    } catch (e) {
      const detail = e instanceof SmtpDeliveryError ? e.code : e instanceof Error ? e.name : "unknown";
      console.error(`[mail] smtp delivery failed (${message.kind}): ${detail}`);
      return false;
    }
  }
  const config = readProviderConfig(transport);
  if (!config) throw new MailNotConfiguredError();
  try {
    await sendViaProvider(config, message, fetchImpl);
    return true;
  } catch (e) {
    const detail = e instanceof MailDeliveryError ? `status ${e.status}` : e instanceof Error ? e.name : "unknown";
    console.error(`[mail] ${transport} delivery failed (${message.kind}): ${detail}`);
    return false;
  }
}

export function readOutbox(to?: string): MailMessage[] {
  const outbox = globalThis.__amanahOutbox ?? [];
  return to ? outbox.filter((m) => m.to === to.trim().toLowerCase()) : [...outbox];
}

export function clearOutbox(): void {
  globalThis.__amanahOutbox = [];
}
