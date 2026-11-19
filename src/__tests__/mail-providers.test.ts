import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildProviderRequest, readProviderConfig, sendViaProvider, MailDeliveryError } from "@/lib/server/mail-providers";
import { MailNotConfiguredError, clearOutbox, readOutbox, sendMail } from "@/lib/server/mailer";
import { validateProductionEnv } from "@/lib/server/production-config";

/** Only mocked HTTP: no provider account exists and no request leaves the machine. */
const KEY = "test-key-not-real";
const mail = { to: "a@test.invalid", subject: "Bestätigen", text: "https://app.test/konto/bestaetigen?token=abc", kind: "verify_email" as const };
const env = (vars: Record<string, string>) => vars as unknown as NodeJS.ProcessEnv;

function okFetch() {
  return vi.fn(async () => new Response("{}", { status: 201 })) as unknown as typeof fetch & ReturnType<typeof vi.fn>;
}

beforeEach(() => clearOutbox());
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("provider requests", () => {
  const base = { apiKey: KEY, fromEmail: "noreply@app.test", fromName: "Mein Wille" };

  it("Brevo: transactional endpoint, key in header, plain text only", () => {
    const { url, init } = buildProviderRequest({ provider: "brevo", ...base }, mail);
    expect(url).toBe("https://api.brevo.com/v3/smtp/email");
    expect((init.headers as Record<string, string>)["api-key"]).toBe(KEY);
    const body = JSON.parse(init.body as string);
    expect(body).toMatchObject({ sender: { email: "noreply@app.test" }, to: [{ email: mail.to }], textContent: mail.text });
    expect(body.htmlContent).toBeUndefined();
  });

  it("Postmark: transactional stream, tracking off so token links are not rewritten", () => {
    const { url, init } = buildProviderRequest({ provider: "postmark", ...base }, mail);
    expect(url).toBe("https://api.postmarkapp.com/email");
    expect((init.headers as Record<string, string>)["X-Postmark-Server-Token"]).toBe(KEY);
    expect(JSON.parse(init.body as string)).toMatchObject({ MessageStream: "outbound", TrackOpens: false, TrackLinks: "None", TextBody: mail.text });
  });

  it("needs key and sender; reports provider errors by status only", async () => {
    expect(readProviderConfig("brevo", env({ AMANAH_MAIL_API_KEY: KEY }))).toBeNull();
    const failing = vi.fn(async () => new Response("secret detail", { status: 401 })) as unknown as typeof fetch;
    await expect(sendViaProvider({ provider: "brevo", ...base }, mail, failing)).rejects.toEqual(new MailDeliveryError("brevo", 401));
  });
});

describe("mailer with a provider", () => {
  it("sends through the provider and keeps nothing in the outbox", async () => {
    vi.stubEnv("AMANAH_MAIL_TRANSPORT", "postmark");
    vi.stubEnv("AMANAH_MAIL_API_KEY", KEY);
    vi.stubEnv("AMANAH_MAIL_FROM", "noreply@app.test");
    const fetchMock = okFetch();
    await sendMail(mail, fetchMock);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(readOutbox()).toHaveLength(0);
  });

  it("swallows delivery failures and logs neither address nor content", async () => {
    vi.stubEnv("AMANAH_MAIL_TRANSPORT", "brevo");
    vi.stubEnv("AMANAH_MAIL_API_KEY", KEY);
    vi.stubEnv("AMANAH_MAIL_FROM", "noreply@app.test");
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(sendMail(mail, vi.fn(async () => new Response("", { status: 500 })) as unknown as typeof fetch)).resolves.toBeUndefined();
    const logged = log.mock.calls.flat().join(" ");
    expect(logged).toContain("status 500");
    expect(logged).not.toContain(mail.to);
    expect(logged).not.toContain("token");
    expect(logged).not.toContain(KEY);
  });

  it("without key it counts as not configured", async () => {
    vi.stubEnv("AMANAH_MAIL_TRANSPORT", "brevo");
    vi.stubEnv("AMANAH_MAIL_API_KEY", "");
    await expect(sendMail(mail, okFetch())).rejects.toBeInstanceOf(MailNotConfiguredError);
  });

  it("production preflight refuses a provider without key or sender", () => {
    const errors = validateProductionEnv(env({ AMANAH_MAIL_TRANSPORT: "brevo" })).errors.join(" ");
    expect(errors).toContain("AMANAH_MAIL_API_KEY");
    expect(errors).toContain("AMANAH_MAIL_FROM");
  });
});
