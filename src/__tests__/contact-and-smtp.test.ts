/**
 * Contact form and SMTP mail through the operator's mailbox (owner order 23.11.2026: Zoho,
 * contact@mscisystems.com). Staging sends real mail only to an allowlist; everything else stays in
 * the outbox. No network: nodemailer is replaced by a fake transport.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";

const sent: Record<string, unknown>[] = [];
let transportOptions: Record<string, unknown> | null = null;
let failWith: Error | null = null;
vi.mock("nodemailer", () => ({
  default: {
    createTransport: (options: Record<string, unknown>) => {
      transportOptions = options;
      return {
        sendMail: async (mail: Record<string, unknown>) => {
          if (failWith) throw failWith;
          sent.push(mail);
          return { messageId: "fake" };
        },
      };
    },
  },
}));

import { POST as contactPOST } from "@/app/api/contact/route";
import { GET as outboxGET } from "@/app/api/dev/outbox/route";
import { clearOutbox, mailAllowlist, readOutbox, sendMail } from "@/lib/server/mailer";
import { readSmtpConfig, sendViaSmtp } from "@/lib/server/mail-smtp";
import { resetMemoryAuthLimits } from "@/lib/server/auth-rate-limit-memory";
import { validateProductionEnv } from "@/lib/server/production-config";
import { isRegistrationDomainAllowed } from "@/lib/deployment-env";
import { IMPRINT } from "@/lib/legal/imprint";
import { browserRequest } from "./session-helpers";

const BASE = "http://localhost";
const SECRET = "app-specific-secret-123";
const smtpEnv = () => {
  vi.stubEnv("AMANAH_MAIL_TRANSPORT", "smtp");
  vi.stubEnv("AMANAH_SMTP_USER", "contact@mscisystems.com");
  vi.stubEnv("AMANAH_SMTP_PASSWORD", SECRET);
  vi.stubEnv("AMANAH_MAIL_FROM", "contact@mscisystems.com");
};
const contact = (body: unknown, headers: Record<string, string> = {}) =>
  contactPOST(browserRequest(`${BASE}/api/contact`, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) }));
const valid = { name: "Test Person", email: "besucher@example.org", topic: "allgemein", message: "Eine Frage zu meinem Konto." };

beforeEach(() => {
  sent.length = 0;
  transportOptions = null;
  failWith = null;
  clearOutbox();
  resetMemoryAuthLimits();
  delete process.env.AMANAH_SERVER_STORAGE;
  delete process.env.DATABASE_URL;
});
afterEach(() => vi.unstubAllEnvs());

describe("SMTP through the operator's mailbox", () => {
  it("defaults to Zoho EU with implicit TLS and needs user, password and sender", () => {
    expect(readSmtpConfig({ AMANAH_SMTP_USER: "a@b.de", AMANAH_MAIL_FROM: "a@b.de" } as unknown as NodeJS.ProcessEnv)).toBeNull();
    const c = readSmtpConfig({ AMANAH_SMTP_USER: "a@b.de", AMANAH_SMTP_PASSWORD: "x", AMANAH_MAIL_FROM: "a@b.de" } as unknown as NodeJS.ProcessEnv)!;
    expect(c).toMatchObject({ host: "smtp.zoho.eu", port: 465, secure: true, fromName: "Wasiyya" });
    expect(readSmtpConfig({ AMANAH_SMTP_USER: "a", AMANAH_SMTP_PASSWORD: "x", AMANAH_MAIL_FROM: "a@b.de", AMANAH_SMTP_PORT: "587" } as unknown as NodeJS.ProcessEnv)).toMatchObject({ port: 587, secure: false });
  });

  it("sends from the configured sender, keeps Reply-To, strips line breaks and never puts the password into errors", async () => {
    const config = readSmtpConfig({ AMANAH_SMTP_USER: "contact@mscisystems.com", AMANAH_SMTP_PASSWORD: SECRET, AMANAH_MAIL_FROM: "contact@mscisystems.com" } as unknown as NodeJS.ProcessEnv)!;
    await sendViaSmtp(config, { to: "x@example.org", subject: "Hallo\r\nBcc: evil@example.org", text: "t", replyTo: "r@example.org" });
    expect(sent[0]).toMatchObject({ from: { name: "Wasiyya", address: "contact@mscisystems.com" }, to: "x@example.org", subject: "Hallo Bcc: evil@example.org", replyTo: "r@example.org" });
    expect(transportOptions).toMatchObject({ host: "smtp.zoho.eu", port: 465, secure: true, logger: false, debug: false });
    failWith = Object.assign(new Error(`Invalid login for ${SECRET}`), { code: "EAUTH" });
    const err = await sendViaSmtp(config, { to: "x@example.org", subject: "s", text: "t" }).catch((e: Error) => e);
    expect(String(err)).toContain("EAUTH");
    expect(String(err)).not.toContain(SECRET);
  });

  it("with an allowlist only listed addresses get real mail; the rest stays in the outbox", async () => {
    smtpEnv();
    vi.stubEnv("AMANAH_MAIL_ALLOWLIST", "Contact@mscisystems.com");
    expect(mailAllowlist()).toEqual(["contact@mscisystems.com"]);
    expect(await sendMail({ to: "contact@mscisystems.com", subject: "s", text: "t", kind: "verify_email" })).toBe(true);
    expect(await sendMail({ to: "test@staging.invalid", subject: "s", text: "t", kind: "verify_email" })).toBe(true);
    expect(sent.map((m) => m.to)).toEqual(["contact@mscisystems.com"]);
    expect(readOutbox("test@staging.invalid")).toHaveLength(1);
    expect(readOutbox("contact@mscisystems.com")).toHaveLength(0);
  });

  it("reports a failed delivery without logging address, body or password", async () => {
    smtpEnv();
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    failWith = Object.assign(new Error("boom"), { code: "ECONNECTION" });
    expect(await sendMail({ to: "x@example.org", subject: "Geheim", text: "Inhalt", kind: "contact" })).toBe(false);
    const logged = log.mock.calls.flat().join(" ");
    expect(logged).toContain("smtp delivery failed (contact): ECONNECTION");
    for (const s of ["x@example.org", "Geheim", "Inhalt", SECRET]) expect(logged).not.toContain(s);
    log.mockRestore();
  });

  it("keeps the test mailbox for test accounts in allowlist mode, still only on loopback", async () => {
    smtpEnv();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AMANAH_DEV_OUTBOX", "true");
    vi.stubEnv("AMANAH_MAIL_ALLOWLIST", "contact@mscisystems.com");
    const direct = (host: string) => new Request(`http://${host}/api/dev/outbox`, { headers: { host } });
    expect((await outboxGET(direct("127.0.0.1:3201"))).status).toBe(200);
    expect((await outboxGET(direct("amanah-test.mscisystems.com"))).status).toBe(404);
    vi.stubEnv("AMANAH_MAIL_ALLOWLIST", "");
    expect((await outboxGET(direct("127.0.0.1:3201"))).status).toBe(404);
  });

  it("production checks SMTP settings and refuses the staging allowlist", () => {
    const base = { AMANAH_MAIL_TRANSPORT: "smtp" } as unknown as NodeJS.ProcessEnv;
    const errors = validateProductionEnv(base).errors.join(" ");
    for (const k of ["AMANAH_SMTP_USER", "AMANAH_SMTP_PASSWORD", "AMANAH_MAIL_FROM"]) expect(errors).toContain(k);
    expect(validateProductionEnv({ ...base, AMANAH_MAIL_ALLOWLIST: "a@b.de" }).errors.join(" ")).toContain("AMANAH_MAIL_ALLOWLIST must not be set in production");
  });

  it("staging accepts SMTP only with an allowlist and the outbox, and lets only listed real addresses register", async () => {
    const { validateStagingEnv } = (await import("../../scripts/validate-staging-env.mjs")) as unknown as { validateStagingEnv: (e: Record<string, string>) => { errors: string[] } };
    const env = { AMANAH_MAIL_TRANSPORT: "smtp", AMANAH_SMTP_USER: "c@m.com", AMANAH_SMTP_PASSWORD: "x", AMANAH_MAIL_FROM: "c@m.com", AMANAH_DEV_OUTBOX: "true" };
    expect(validateStagingEnv(env).errors.join(" ")).toContain("only to AMANAH_MAIL_ALLOWLIST");
    expect(validateStagingEnv({ ...env, AMANAH_MAIL_ALLOWLIST: "c@m.com" }).errors.join(" ")).not.toMatch(/ALLOWLIST|real mail|mail provider/);
    expect(validateStagingEnv({ ...env, AMANAH_MAIL_TRANSPORT: "brevo", AMANAH_MAIL_ALLOWLIST: "c@m.com" }).errors.join(" ")).toContain("other than the owner's SMTP");
    const reg = { AMANAH_REGISTRATION_ALLOWED_DOMAINS: "staging.invalid", AMANAH_MAIL_ALLOWLIST: "contact@mscisystems.com" } as unknown as NodeJS.ProcessEnv;
    expect(isRegistrationDomainAllowed("Contact@mscisystems.com", reg)).toBe(true);
    expect(isRegistrationDomainAllowed("other@mscisystems.com", reg)).toBe(false);
    expect(isRegistrationDomainAllowed("x@staging.invalid", reg)).toBe(true);
  });
});

describe("contact form", () => {
  it("sends the message to the imprint address with Reply-To the visitor and stores nothing else", async () => {
    vi.stubEnv("AMANAH_MAIL_TRANSPORT", "outbox");
    const res = await contact(valid);
    expect(res.status).toBe(200);
    const [mail] = readOutbox(IMPRINT.email);
    expect(mail).toMatchObject({ kind: "contact", replyTo: "besucher@example.org", subject: "Kontaktformular Wasiyya: Allgemeine Frage" });
    expect(mail.text).toContain("Eine Frage zu meinem Konto.");
    expect(readOutbox("besucher@example.org")).toHaveLength(0);
  });

  it("goes over SMTP to contact@mscisystems.com when configured", async () => {
    smtpEnv();
    vi.stubEnv("AMANAH_CONTACT_TO", "contact@mscisystems.com");
    expect((await contact(valid)).status).toBe(200);
    expect(sent[0]).toMatchObject({ to: "contact@mscisystems.com", replyTo: "besucher@example.org" });
  });

  it("checks the input, ignores bots and rejects other origins", async () => {
    vi.stubEnv("AMANAH_MAIL_TRANSPORT", "outbox");
    expect((await contact({ ...valid, email: "kein-at" })).status).toBe(400);
    expect((await contact({ ...valid, message: "kurz" })).status).toBe(400);
    expect((await contact({ ...valid, message: "x".repeat(4001) })).status).toBe(400);
    expect((await contact({ ...valid, email: "a@b.de\r\nBcc: c@d.de" })).status).toBe(400);
    expect((await contact({ ...valid, website: "http://spam.example" })).status).toBe(200);
    expect(readOutbox()).toHaveLength(0);
    const foreign = new Request(`${BASE}/api/contact`, { method: "POST", headers: { "Content-Type": "application/json", origin: "https://evil.example", host: "localhost" }, body: JSON.stringify(valid) });
    expect((await contactPOST(foreign)).status).toBe(403);
  });

  it("slows down floods and tells the visitor when mail is not available", async () => {
    vi.stubEnv("AMANAH_MAIL_TRANSPORT", "outbox");
    for (let i = 0; i < 3; i++) expect((await contact(valid)).status).toBe(200);
    expect((await contact(valid)).status).toBe(429);
    resetMemoryAuthLimits();
    vi.stubEnv("AMANAH_MAIL_TRANSPORT", "disabled");
    const res = await contact({ ...valid, email: "zweite@example.org" });
    expect(res.status).toBe(503);
    expect((await res.json()).error).toContain(IMPRINT.email);
  });

  it("is linked from footer, imprint and partner page and listed in the sitemap", () => {
    expect(readFileSync("src/components/layout/footer.tsx", "utf8")).toContain('href="/kontakt"');
    expect(readFileSync("src/app/impressum/page.tsx", "utf8")).toContain('href="/kontakt"');
    expect(readFileSync("src/app/partner/page.tsx", "utf8")).toContain('href="/kontakt"');
    expect(readFileSync("src/app/sitemap.ts", "utf8")).toContain('"/kontakt"');
  });
});
