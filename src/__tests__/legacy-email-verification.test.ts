import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as loginPOST } from "@/app/api/auth/login/route";
import { POST as verifyPOST } from "@/app/api/auth/verify-email/route";
import { POST as resendPOST } from "@/app/api/auth/verify-email/resend/route";
import { POST as resetRequestPOST } from "@/app/api/auth/password-reset/request/route";
import { POST as resetConfirmPOST } from "@/app/api/auth/password-reset/confirm/route";
import { GET as meGET } from "@/app/api/auth/me/route";
import { DELETE as amanahDELETE, GET as amanahGET, PATCH as amanahPATCH, PUT as amanahPUT } from "@/app/api/amanah/route";
import { GET as exportGET } from "@/app/api/account/export/route";
import { POST as checkoutPOST } from "@/app/api/billing/checkout/route";
import { demoAmanahData } from "@/lib/domain/demo-data";
import { resetRateLimits } from "@/lib/ai/rate-limit";
import { clearOutbox, readOutbox } from "@/lib/server/mailer";
import { getServerRepository, resetServerRepository } from "@/lib/server/repository";
import { getMemoryStore } from "@/lib/server/memory-store";
import {
  DEFAULT_LEGACY_GRACE_DAYS,
  emailVerificationInfo,
  legacyGraceDays,
  mayLogIn,
  mayPurchase,
  mayWriteFolder,
} from "@/lib/server/email-verification";
import { browserRequest, grantStorageConsent, sessionCookieFrom, tokenFromOutbox } from "./session-helpers";

const BASE = "http://localhost";
const PASSWORD = "testpass1";
const DAY = 24 * 60 * 60 * 1000;

function post(path: string, body: unknown, cookie?: string, method = "POST") {
  return browserRequest(`${BASE}${path}`, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }, cookie);
}

/** An account as it exists before e-mail confirmation: unverified, marked as legacy by the migration. */
async function legacyAccount(markedDaysAgo: number): Promise<{ email: string; id: string }> {
  const email = `legacy-${crypto.randomUUID()}@test.invalid`;
  const user = await getServerRepository().registerUser(email, PASSWORD, "Alt");
  if ("error" in user) throw new Error(user.error);
  const stored = getMemoryStore().users.get(user.id)!;
  stored.emailVerificationLegacyAt = new Date(Date.now() - markedDaysAgo * DAY).toISOString();
  return { email, id: user.id };
}

async function login(email: string): Promise<Response> {
  return loginPOST(post("/api/auth/login", { email, password: PASSWORD }));
}

beforeEach(() => {
  resetRateLimits();
  resetServerRepository();
  clearOutbox();
  globalThis.__amanahMemoryStore = undefined;
  delete process.env.AMANAH_SERVER_STORAGE;
  delete process.env.DATABASE_URL;
  vi.stubEnv("AMANAH_MAIL_TRANSPORT", "outbox");
  vi.stubEnv("AMANAH_PUBLIC_BASE_URL", BASE);
});

afterEach(() => vi.unstubAllEnvs());

describe("verification states", () => {
  const now = new Date("2026-11-01T12:00:00Z");
  const env = (days?: string) => ({ AMANAH_LEGACY_VERIFICATION_GRACE_DAYS: days }) as unknown as NodeJS.ProcessEnv;

  it("distinguishes verified, new unverified and legacy accounts", () => {
    expect(emailVerificationInfo({ emailVerifiedAt: "2026-10-01T00:00:00Z", emailVerificationLegacyAt: "2026-10-01T00:00:00Z" }, now).status).toBe("verified");
    expect(emailVerificationInfo({ emailVerifiedAt: null, emailVerificationLegacyAt: null }, now).status).toBe("unverified");
    const grace = emailVerificationInfo({ emailVerifiedAt: null, emailVerificationLegacyAt: "2026-10-31T12:00:00Z" }, now, env("30"));
    expect(grace).toEqual({ status: "legacy_grace", deadline: "2026-11-30T12:00:00.000Z" });
    expect(emailVerificationInfo({ emailVerifiedAt: null, emailVerificationLegacyAt: "2026-10-01T12:00:00Z" }, now, env("30")).status).toBe("legacy_overdue");
  });

  it("grants rights per state", () => {
    const cases = [
      ["verified", true, true, true],
      ["legacy_grace", true, true, false],
      ["legacy_overdue", true, false, false],
      ["unverified", false, false, false],
    ] as const;
    for (const [status, logIn, write, purchase] of cases) {
      const info = { status, deadline: null };
      expect([mayLogIn(info), mayWriteFolder(info), mayPurchase(info)]).toEqual([logIn, write, purchase]);
    }
  });

  it("accepts only whole grace periods between 0 and 365 days", () => {
    expect(legacyGraceDays(env())).toBe(DEFAULT_LEGACY_GRACE_DAYS);
    expect(legacyGraceDays(env("14"))).toBe(14);
    expect(legacyGraceDays(env("0"))).toBe(0);
    for (const bad of ["-1", "366", "1.5", "abc"]) expect(legacyGraceDays(env(bad))).toBe(DEFAULT_LEGACY_GRACE_DAYS);
  });
});

describe("legacy accounts keep their data and are led to confirmation", () => {
  it("new accounts still have to confirm before the first login", async () => {
    const email = `new-${crypto.randomUUID()}@test.invalid`;
    await getServerRepository().registerUser(email, PASSWORD, "Neu");
    const res = await login(email);
    expect(res.status).toBe(403);
    expect((await res.json()).code).toBe("email_unverified");
  });

  it("during the grace period: login, saving and the notice data work; purchases wait", async () => {
    const { email } = await legacyAccount(1);
    const res = await login(email);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.session.user.emailVerification.status).toBe("legacy_grace");
    expect(new Date(body.session.user.emailVerification.deadline).getTime()).toBeGreaterThan(Date.now());
    const cookie = sessionCookieFrom(res)!;

    await grantStorageConsent(BASE, cookie);
    expect((await amanahPUT(post("/api/amanah", demoAmanahData, cookie, "PUT"))).status).toBe(200);
    const checkout = await checkoutPOST(post("/api/billing/checkout", { productId: "vorsorge_plus" }, cookie));
    expect(checkout.status).toBe(403);
    expect((await checkout.json()).code).toBe("email_verification_required");
  });

  it("after the deadline: reading, export and deletion stay possible; writing is paused", async () => {
    const { email } = await legacyAccount(DEFAULT_LEGACY_GRACE_DAYS + 1);
    const res = await login(email);
    expect(res.status).toBe(200);
    expect((await res.json()).session.user.emailVerification.status).toBe("legacy_overdue");
    const cookie = sessionCookieFrom(res)!;
    await grantStorageConsent(BASE, cookie);

    for (const write of [amanahPUT(post("/api/amanah", demoAmanahData, cookie, "PUT")), amanahPATCH(post("/api/amanah", { notes: "x" }, cookie, "PATCH"))]) {
      const r = await write;
      expect(r.status).toBe(403);
      expect((await r.json()).code).toBe("email_verification_required");
    }
    expect((await amanahGET(browserRequest(`${BASE}/api/amanah`, {}, cookie))).status).toBe(200);
    const exported = await exportGET(browserRequest(`${BASE}/api/account/export`, {}, cookie));
    expect(exported.status).toBe(200);
    expect((await exported.json()).account.emailVerificationLegacyAt).toBeTruthy();
    expect((await amanahDELETE(browserRequest(`${BASE}/api/amanah`, { method: "DELETE" }, cookie))).status).toBe(200);
  });

  it("a signed-in legacy account requests its own link, confirms and regains full rights", async () => {
    const { email } = await legacyAccount(DEFAULT_LEGACY_GRACE_DAYS + 1);
    const cookie = sessionCookieFrom(await login(email))!;
    expect((await resendPOST(post("/api/auth/verify-email/resend", {}, cookie))).status).toBe(202);
    expect(readOutbox(email).filter((m) => m.kind === "verify_email")).toHaveLength(1);

    const verified = await verifyPOST(post("/api/auth/verify-email", { token: await tokenFromOutbox(email, "verify_email") }));
    expect(verified.status).toBe(200);
    expect((await verified.json()).session.user.emailVerification.status).toBe("verified");
    const fresh = sessionCookieFrom(verified)!;
    expect((await (await meGET(browserRequest(`${BASE}/api/auth/me`, {}, fresh))).json()).session.user.emailVerification.status).toBe("verified");
    await grantStorageConsent(BASE, fresh);
    expect((await amanahPUT(post("/api/amanah", demoAmanahData, fresh, "PUT"))).status).toBe(200);
  });

  it("asking for a link without e-mail needs a session", async () => {
    expect((await resendPOST(post("/api/auth/verify-email/resend", {}))).status).toBe(401);
    expect(readOutbox()).toHaveLength(0);
  });

  it("a password reset through the mailbox also confirms a legacy account", async () => {
    const { email, id } = await legacyAccount(DEFAULT_LEGACY_GRACE_DAYS + 1);
    expect((await resetRequestPOST(post("/api/auth/password-reset/request", { email }))).status).toBe(202);
    const token = await tokenFromOutbox(email, "reset_password");
    expect((await resetConfirmPOST(post("/api/auth/password-reset/confirm", { token, password: "newpass12" }))).status).toBe(200);
    const user = await getServerRepository().getUserById(id);
    expect(emailVerificationInfo(user!).status).toBe("verified");
  });
});
