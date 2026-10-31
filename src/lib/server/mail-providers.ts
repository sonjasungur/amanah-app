/**
 * HTTP adapters for transactional mail providers (docs/strategy/21-anbieter-zahlung-und-mail.md).
 * Prepared only: nothing is sent unless AMANAH_MAIL_TRANSPORT names a provider and its API key is
 * configured (owner decision, AVV first). Link and open tracking stay off, so single-use tokens
 * never pass through the provider's redirect domain. Bodies and keys are never logged.
 */
export type MailProvider = "brevo" | "postmark";

export interface ProviderMail {
  to: string;
  subject: string;
  text: string;
  kind: string;
}

export interface ProviderConfig {
  provider: MailProvider;
  apiKey: string;
  fromEmail: string;
  fromName: string;
}

export class MailDeliveryError extends Error {
  constructor(readonly provider: MailProvider, readonly status: number) {
    super(`Mail provider ${provider} answered ${status}.`);
    this.name = "MailDeliveryError";
  }
}

const TIMEOUT_MS = 10_000;

export function readProviderConfig(provider: MailProvider, env: NodeJS.ProcessEnv = process.env): ProviderConfig | null {
  const apiKey = env.AMANAH_MAIL_API_KEY?.trim();
  const fromEmail = env.AMANAH_MAIL_FROM?.trim();
  if (!apiKey || !fromEmail) return null;
  return { provider, apiKey, fromEmail, fromName: env.AMANAH_MAIL_FROM_NAME?.trim() || "Mein Wille" };
}

export function buildProviderRequest(config: ProviderConfig, mail: ProviderMail): { url: string; init: RequestInit } {
  if (config.provider === "brevo") {
    return {
      url: "https://api.brevo.com/v3/smtp/email",
      init: {
        method: "POST",
        headers: { "api-key": config.apiKey, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          sender: { email: config.fromEmail, name: config.fromName },
          to: [{ email: mail.to }],
          subject: mail.subject,
          textContent: mail.text,
          tags: [mail.kind],
        }),
      },
    };
  }
  return {
    url: "https://api.postmarkapp.com/email",
    init: {
      method: "POST",
      headers: { "X-Postmark-Server-Token": config.apiKey, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        From: `${config.fromName} <${config.fromEmail}>`,
        To: mail.to,
        Subject: mail.subject,
        TextBody: mail.text,
        Tag: mail.kind,
        MessageStream: "outbound",
        TrackOpens: false,
        TrackLinks: "None",
      }),
    },
  };
}

export async function sendViaProvider(config: ProviderConfig, mail: ProviderMail, fetchImpl: typeof fetch = fetch): Promise<void> {
  const { url, init } = buildProviderRequest(config, mail);
  const res = await fetchImpl(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new MailDeliveryError(config.provider, res.status);
}
