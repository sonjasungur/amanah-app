import nodemailer from "nodemailer";

/**
 * SMTP delivery through the operator's own mailbox (owner decision 23.11.2026: Zoho Mail, sender
 * contact@mscisystems.com; SPF and DKIM of the domain already cover Zoho). The password is an
 * app-specific password that only the owner enters in the server env; it is never logged.
 *
 *   AMANAH_MAIL_TRANSPORT=smtp
 *   AMANAH_SMTP_HOST (default smtp.zoho.eu), AMANAH_SMTP_PORT (default 465, implicit TLS; 587 = STARTTLS)
 *   AMANAH_SMTP_USER, AMANAH_SMTP_PASSWORD, AMANAH_MAIL_FROM, AMANAH_MAIL_FROM_NAME
 */
export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  fromEmail: string;
  fromName: string;
}

export interface SmtpMail {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}

export class SmtpDeliveryError extends Error {
  constructor(readonly code: string) {
    super(`SMTP delivery failed (${code}).`);
    this.name = "SmtpDeliveryError";
  }
}

export function readSmtpConfig(env: NodeJS.ProcessEnv = process.env): SmtpConfig | null {
  const user = env.AMANAH_SMTP_USER?.trim();
  const password = env.AMANAH_SMTP_PASSWORD ?? "";
  const fromEmail = env.AMANAH_MAIL_FROM?.trim();
  if (!user || !password.trim() || !fromEmail) return null;
  const port = Number.parseInt(env.AMANAH_SMTP_PORT ?? "465", 10);
  const safePort = Number.isFinite(port) && port > 0 ? port : 465;
  return {
    host: env.AMANAH_SMTP_HOST?.trim() || "smtp.zoho.eu",
    port: safePort,
    secure: safePort === 465,
    user,
    password,
    fromEmail,
    fromName: env.AMANAH_MAIL_FROM_NAME?.trim() || "Wasiyya",
  };
}

type CreateTransport = (options: Record<string, unknown>) => { sendMail(mail: Record<string, unknown>): Promise<unknown> };

/** Header values must not carry line breaks (header injection). */
const oneLine = (value: string) => value.replace(/[\r\n]+/g, " ").trim();

export async function sendViaSmtp(
  config: SmtpConfig,
  mail: SmtpMail,
  createTransport: CreateTransport = nodemailer.createTransport as unknown as CreateTransport,
): Promise<void> {
  const transport = createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    requireTLS: !config.secure,
    auth: { user: config.user, pass: config.password },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
    logger: false,
    debug: false,
  });
  try {
    await transport.sendMail({
      from: { name: oneLine(config.fromName), address: config.fromEmail },
      to: mail.to,
      subject: oneLine(mail.subject),
      text: mail.text,
      ...(mail.replyTo ? { replyTo: oneLine(mail.replyTo) } : {}),
    });
  } catch (e) {
    const code = typeof e === "object" && e && "code" in e ? String((e as { code: unknown }).code) : e instanceof Error ? e.name : "unknown";
    throw new SmtpDeliveryError(code);
  }
}
