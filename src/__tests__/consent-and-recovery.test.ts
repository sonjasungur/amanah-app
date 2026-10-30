import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as registerPOST } from "@/app/api/auth/register/route";
import { POST as loginPOST } from "@/app/api/auth/login/route";
import { POST as verifyPOST } from "@/app/api/auth/verify-email/route";
import { POST as resendPOST } from "@/app/api/auth/verify-email/resend/route";
import { POST as resetRequestPOST } from "@/app/api/auth/password-reset/request/route";
import { POST as resetConfirmPOST } from "@/app/api/auth/password-reset/confirm/route";
import { GET as amanahGET, PUT as amanahPUT } from "@/app/api/amanah/route";
import { DELETE as consentDELETE, GET as consentGET, POST as consentPOST } from "@/app/api/consent/route";
import { GET as exportGET } from "@/app/api/account/export/route";
import { GET as outboxGET } from "@/app/api/dev/outbox/route";
import { CONSENT_PURPOSES } from "@/lib/consent/purposes";
import { demoAmanahData } from "@/lib/domain/demo-data";
import { resetRateLimits } from "@/lib/ai/rate-limit";
import { clearOutbox, readOutbox } from "@/lib/server/mailer";
import { getServerRepository, resetServerRepository } from "@/lib/server/repository";
import { hashSessionToken } from "@/lib/server/crypto";
import { browserRequest, registerVerified, sessionCookieFrom, tokenFromOutbox } from "./session-helpers";

const BASE = "http://localhost";
const PASSWORD = "testpass1";
const VERSION = CONSENT_PURPOSES.sensitive_folder_storage.version;

function post(path: string, body: unknown, cookie?: string, method = "POST") {
  return browserRequest(`${BASE}${path}`, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }, cookie);
}

const newEmail = () => `cr-${crypto.randomUUID()}@test.invalid`;

beforeEach(() => {
  resetRateLimits();
  resetServerRepository();
  clearOutbox();
  globalThis.__amanahMemoryStore = undefined;
  delete process.env.AMANAH_SERVER_STORAGE;
  delete process.env.DATABASE_URL;
});

afterEach(() => vi.unstubAllEnvs());

describe("consent for server storage", () => {
  it("blocks writes until explicit consent; reading stays possible", async () => {
    const cookie = await registerVerified(BASE, newEmail(), PASSWORD, { consent: false });
    const put = await amanahPUT(post("/api/amanah", demoAmanahData, cookie, "PUT"));
    expect(put.status).toBe(403);
    expect((await put.json()).code).toBe("consent_required");
    expect((await amanahGET(browserRequest(`${BASE}/api/amanah`, {}, cookie))).status).toBe(200);
  });

  it("requires confirmed === true and the current text version", async () => {
    const cookie = await registerVerified(BASE, newEmail(), PASSWORD, { consent: false });
    const purpose = "sensitive_folder_storage";
    expect((await consentPOST(post("/api/consent", { purpose, version: VERSION }, cookie))).status).toBe(400);
    expect((await consentPOST(post("/api/consent", { purpose, version: VERSION, confirmed: "true" }, cookie))).status).toBe(400);
    expect((await consentPOST(post("/api/consent", { purpose, version: "old", confirmed: true }, cookie))).status).toBe(400);
    expect((await consentPOST(post("/api/consent", { purpose, version: VERSION, confirmed: true }, cookie))).status).toBe(201);
    expect((await amanahPUT(post("/api/amanah", demoAmanahData, cookie, "PUT"))).status).toBe(200);
  });

  it("records time and version; withdrawal deletes the server copy and keeps the proof", async () => {
    const cookie = await registerVerified(BASE, newEmail());
    await amanahPUT(post("/api/amanah", demoAmanahData, cookie, "PUT"));

    const status = await (await consentGET(browserRequest(`${BASE}/api/consent`, {}, cookie))).json();
    expect(status.status.sensitive_folder_storage.granted).toBe(true);
    expect(status.history[0].textVersion).toBe(VERSION);
    expect(Date.parse(status.history[0].grantedAt)).not.toBeNaN();

    const revoke = await consentDELETE(post("/api/consent", { purpose: "sensitive_folder_storage" }, cookie, "DELETE"));
    expect(revoke.status).toBe(200);
    const after = await (await amanahGET(browserRequest(`${BASE}/api/amanah`, {}, cookie))).json();
    expect(after.data.userProfile.name).toBe("");
    expect((await amanahPUT(post("/api/amanah", demoAmanahData, cookie, "PUT"))).status).toBe(403);

    const history = (await (await consentGET(browserRequest(`${BASE}/api/consent`, {}, cookie))).json()).history;
    expect(history[0].revokedAt).toBeTruthy();
  });

  it("a consent for an older text version is not active", async () => {
    const email = newEmail();
    const cookie = await registerVerified(BASE, email, PASSWORD, { consent: false });
    const user = await getServerRepository().findUserByEmail(email);
    await getServerRepository().grantConsent(user!.id, "sensitive_folder_storage", "2020-01-01-alt");
    expect((await amanahPUT(post("/api/amanah", demoAmanahData, cookie, "PUT"))).status).toBe(403);
  });

  it("is part of the account export", async () => {
    const cookie = await registerVerified(BASE, newEmail());
    const body = JSON.parse(await (await exportGET(browserRequest(`${BASE}/api/account/export`, {}, cookie))).text());
    expect(body.consents[0].purpose).toBe("sensitive_folder_storage");
    expect(body.account.emailVerifiedAt).toBeTruthy();
  });
});

describe("e-mail verification", () => {
  it("issues no session at registration and answers identically for existing addresses", async () => {
    const email = newEmail();
    const first = await registerPOST(post("/api/auth/register", { email, password: PASSWORD }));
    const firstBody = await first.json();
    expect(first.status).toBe(202);
    expect(sessionCookieFrom(first)).toBeNull();

    await verifyPOST(post("/api/auth/verify-email", { token: await tokenFromOutbox(email, "verify_email") }));
    const again = await registerPOST(post("/api/auth/register", { email, password: "anderes-passwort" }));
    expect(again.status).toBe(202);
    expect(await again.json()).toEqual(firstBody);
    expect(readOutbox(email).at(-1)?.kind).toBe("account_exists");
  });

  it("blocks login until verified; wrong password stays a generic 401", async () => {
    const email = newEmail();
    await registerPOST(post("/api/auth/register", { email, password: PASSWORD }));
    const unverified = await loginPOST(post("/api/auth/login", { email, password: PASSWORD }));
    expect(unverified.status).toBe(403);
    expect((await unverified.json()).code).toBe("email_unverified");
    expect((await loginPOST(post("/api/auth/login", { email, password: "falsch-123" }))).status).toBe(401);
  });

  it("tokens are single-use, purpose-bound and expire", async () => {
    const email = newEmail();
    await registerPOST(post("/api/auth/register", { email, password: PASSWORD }));
    const token = await tokenFromOutbox(email, "verify_email");
    expect((await verifyPOST(post("/api/auth/verify-email", { token }))).status).toBe(200);
    expect((await verifyPOST(post("/api/auth/verify-email", { token }))).status).toBe(400);

    const user = await getServerRepository().findUserByEmail(email);
    const expired = "e".repeat(43);
    await getServerRepository().createAuthToken(user!.id, "verify_email", hashSessionToken(expired), new Date(Date.now() - 1000));
    expect((await verifyPOST(post("/api/auth/verify-email", { token: expired }))).status).toBe(400);

    await resetRequestPOST(post("/api/auth/password-reset/request", { email }));
    const resetToken = await tokenFromOutbox(email, "reset_password");
    expect((await verifyPOST(post("/api/auth/verify-email", { token: resetToken }))).status).toBe(400);
  });

  it("resend answers generically and sends nothing for unknown addresses", async () => {
    const res = await resendPOST(post("/api/auth/verify-email/resend", { email: "niemand@test.invalid" }));
    expect(res.status).toBe(202);
    expect(readOutbox("niemand@test.invalid")).toHaveLength(0);
  });
});

describe("password reset", () => {
  it("answers identically for known and unknown addresses", async () => {
    const email = newEmail();
    await registerVerified(BASE, email);
    const known = await resetRequestPOST(post("/api/auth/password-reset/request", { email }));
    const unknown = await resetRequestPOST(post("/api/auth/password-reset/request", { email: "unbekannt@test.invalid" }));
    expect(known.status).toBe(unknown.status);
    expect(await known.json()).toEqual(await unknown.json());
    expect(readOutbox("unbekannt@test.invalid")).toHaveLength(0);
    expect(readOutbox(email).at(-1)?.kind).toBe("reset_password");
  });

  it("sets a new password, revokes all sessions and cannot be replayed", async () => {
    const email = newEmail();
    const oldCookie = await registerVerified(BASE, email);
    await resetRequestPOST(post("/api/auth/password-reset/request", { email }));
    const token = await tokenFromOutbox(email, "reset_password");

    expect((await resetConfirmPOST(post("/api/auth/password-reset/confirm", { token, password: "kurz" }))).status).toBe(400);
    const ok = await resetConfirmPOST(post("/api/auth/password-reset/confirm", { token, password: "neues-passwort-1" }));
    expect(ok.status).toBe(200);
    expect((await amanahGET(browserRequest(`${BASE}/api/amanah`, {}, oldCookie))).status).toBe(401);
    expect((await loginPOST(post("/api/auth/login", { email, password: PASSWORD }))).status).toBe(401);
    expect((await loginPOST(post("/api/auth/login", { email, password: "neues-passwort-1" }))).status).toBe(200);
    expect((await resetConfirmPOST(post("/api/auth/password-reset/confirm", { token, password: "noch-eins-123" }))).status).toBe(400);
  });

  it("a newer request invalidates the older link", async () => {
    const email = newEmail();
    await registerVerified(BASE, email);
    await resetRequestPOST(post("/api/auth/password-reset/request", { email }));
    const first = await tokenFromOutbox(email, "reset_password");
    await resetRequestPOST(post("/api/auth/password-reset/request", { email }));
    const second = await tokenFromOutbox(email, "reset_password");
    expect(first).not.toBe(second);
    expect((await resetConfirmPOST(post("/api/auth/password-reset/confirm", { token: first, password: "neues-passwort-1" }))).status).toBe(400);
    expect((await resetConfirmPOST(post("/api/auth/password-reset/confirm", { token: second, password: "neues-passwort-1" }))).status).toBe(200);
  });

  it("is rate-limited per address", async () => {
    const email = newEmail();
    const statuses = [];
    for (let i = 0; i < 4; i++) statuses.push((await resetRequestPOST(post("/api/auth/password-reset/request", { email }))).status);
    expect(statuses).toEqual([202, 202, 202, 429]);
  });

  it("builds links from configuration, never from the Host header", async () => {
    vi.stubEnv("AMANAH_PUBLIC_BASE_URL", "https://meinwille.example");
    const email = newEmail();
    await registerVerified(BASE, email);
    await resetRequestPOST(
      new Request(`https://evil.example/api/auth/password-reset/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json", origin: "https://evil.example", "x-forwarded-host": "evil.example" },
        body: JSON.stringify({ email }),
      })
    );
    const mail = readOutbox(email).at(-1)!;
    expect(mail.text).toContain("https://meinwille.example/passwort-zuruecksetzen?token=");
    expect(mail.text).not.toContain("evil.example");
  });
});

describe("dev outbox", () => {
  it("is not reachable unless internal tools are enabled", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AMANAH_INTERNAL_TOOLS", "");
    expect((await outboxGET(new Request(`${BASE}/api/dev/outbox`))).status).toBe(404);
  });
});
