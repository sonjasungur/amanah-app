/**
 * Outgoing mail. No real provider is wired up yet (needs owner approval and an AVV).
 *
 * AMANAH_MAIL_TRANSPORT:
 *   "outbox"   — messages are kept in memory for local development and tests (default outside production)
 *   "disabled" — sending fails (default in production until a provider is configured)
 *
 * Message bodies are never logged.
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

export function getMailTransport(): "outbox" | "disabled" {
  const value = process.env.AMANAH_MAIL_TRANSPORT?.trim();
  if (value === "outbox" || value === "disabled") return value;
  return process.env.NODE_ENV === "production" ? "disabled" : "outbox";
}

export async function sendMail(message: Omit<MailMessage, "sentAt">): Promise<void> {
  if (getMailTransport() !== "outbox") throw new MailNotConfiguredError();
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
