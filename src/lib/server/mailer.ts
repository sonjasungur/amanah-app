import { MailDeliveryError, readProviderConfig, sendViaProvider, type MailProvider } from "./mail-providers";

/**
 * Outgoing mail. Provider adapters are prepared but need owner approval and an AVV first.
 *
 * AMANAH_MAIL_TRANSPORT:
 *   "outbox"   — messages are kept in memory for local development and tests (default outside production)
 *   "disabled" — sending fails (default in production until a provider is configured)
 *   "brevo" | "postmark" — HTTP API, needs AMANAH_MAIL_API_KEY and AMANAH_MAIL_FROM
 *
 * Message bodies and addresses are never logged.
 */
export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  kind: "verify_email" | "reset_password" | "account_exists";
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

export type MailTransport = "outbox" | "disabled" | MailProvider;

export function getMailTransport(): MailTransport {
  const value = process.env.AMANAH_MAIL_TRANSPORT?.trim();
  if (value === "outbox" || value === "disabled" || value === "brevo" || value === "postmark") return value;
  return process.env.NODE_ENV === "production" ? "disabled" : "outbox";
}

/**
 * Delivery failures are logged without address or content and not passed on: callers answer
 * generically, so a failure must not reveal whether an account exists. Users can request a new link.
 */
export async function sendMail(message: Omit<MailMessage, "sentAt">, fetchImpl: typeof fetch = fetch): Promise<void> {
  const transport = getMailTransport();
  if (transport === "brevo" || transport === "postmark") {
    const config = readProviderConfig(transport);
    if (!config) throw new MailNotConfiguredError();
    try {
      await sendViaProvider(config, message, fetchImpl);
    } catch (e) {
      const detail = e instanceof MailDeliveryError ? `status ${e.status}` : e instanceof Error ? e.name : "unknown";
      console.error(`[mail] ${transport} delivery failed (${message.kind}): ${detail}`);
    }
    return;
  }
  if (transport !== "outbox") throw new MailNotConfiguredError();
  const outbox = (globalThis.__amanahOutbox ??= []);
  outbox.push({ ...message, sentAt: new Date().toISOString() });
  if (outbox.length > OUTBOX_LIMIT) outbox.shift();
}

export function readOutbox(to?: string): MailMessage[] {
  const outbox = globalThis.__amanahOutbox ?? [];
  return to ? outbox.filter((m) => m.to === to.trim().toLowerCase()) : [...outbox];
}

export function clearOutbox(): void {
  globalThis.__amanahOutbox = [];
}
