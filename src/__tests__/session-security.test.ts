import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as registerPOST } from "@/app/api/auth/register/route";
import { POST as loginPOST } from "@/app/api/auth/login/route";
import { POST as logoutPOST } from "@/app/api/auth/logout/route";
import { GET as meGET } from "@/app/api/auth/me/route";
import { GET as amanahGET, PUT as amanahPUT } from "@/app/api/amanah/route";
import { GET as exportGET } from "@/app/api/account/export/route";
import { DELETE as accountDELETE } from "@/app/api/account/route";
import { demoAmanahData } from "@/lib/domain/demo-data";
import { resetServerRepository } from "@/lib/server/repository";
import { resetRateLimits } from "@/lib/ai/rate-limit";
import { POST as verifyPOST } from "@/app/api/auth/verify-email/route";
import { browserRequest, grantStorageConsent, sessionCookieFrom, tokenFromOutbox } from "./session-helpers";

const BASE = "http://localhost";
const PASSWORD = "testpass1";

function json(body: unknown): RequestInit {
  return { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

/** Register → confirmation mail → verify (sets the session cookie) → storage consent. */
async function register(email = `s-${crypto.randomUUID()}@test.de`) {
  const reg = await registerPOST(browserRequest(`${BASE}/api/auth/register`, json({ email, password: PASSWORD, name: "S" })));
  expect(reg.status).toBe(202);
  const token = await tokenFromOutbox(email, "verify_email");
  const res = await verifyPOST(browserRequest(`${BASE}/api/auth/verify-email`, json({ token })));
  const cookie = sessionCookieFrom(res)!;
  await grantStorageConsent(BASE, cookie);
  return { res, email, cookie };
}

async function saveDemo(cookie: string) {
  return amanahPUT(
    browserRequest(`${BASE}/api/amanah`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(demoAmanahData) }, cookie)
  );
}

beforeEach(() => {
  resetRateLimits();
  resetServerRepository();
  globalThis.__amanahMemoryStore = undefined;
  delete process.env.AMANAH_SERVER_STORAGE;
  delete process.env.DATABASE_URL;
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("session cookie", () => {
  it("is HttpOnly, SameSite=Lax, Path=/ and the token never appears in the body", async () => {
    const { res } = await register();
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toMatch(/^amanah_session=[^;]+/);
    expect(setCookie).toMatch(/HttpOnly/i);
    expect(setCookie).toMatch(/SameSite=lax/i);
    expect(setCookie).toMatch(/Path=\//);
    const body = await res.json();
    expect(JSON.stringify(body)).not.toContain(setCookie.split(";")[0].split("=")[1]);
  });

  it("uses Secure and the __Host- prefix in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SESSION_SECRET", "x".repeat(40));
    vi.stubEnv("AMANAH_MAIL_TRANSPORT", "outbox");
    vi.stubEnv("AMANAH_PUBLIC_BASE_URL", "https://example.test");
    vi.stubEnv("AMANAH_DATA_ENCRYPTION", "optional");
    const { res } = await register();
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toMatch(/^__Host-amanah_session=/);
    expect(setCookie).toMatch(/Secure/i);
  });

  it("ignores bearer tokens", async () => {
    const { cookie } = await register();
    const token = cookie.split("=")[1];
    const res = await amanahGET(new Request(`${BASE}/api/amanah`, { headers: { Authorization: `Bearer ${token}` } }));
    expect(res.status).toBe(401);
  });
});

describe("CSRF", () => {
  it("rejects login and register from a foreign origin", async () => {
    const foreign = { ...json({ email: "a@b.de", password: PASSWORD }), headers: { "Content-Type": "application/json", origin: "https://evil.example", "x-forwarded-host": "localhost" } };
    expect((await loginPOST(new Request(`${BASE}/api/auth/login`, foreign))).status).toBe(403);
    expect((await registerPOST(new Request(`${BASE}/api/auth/register`, foreign))).status).toBe(403);
  });

  it("treats a cross-origin write with a valid cookie as anonymous", async () => {
    const { cookie } = await register();
    const res = await amanahPUT(
      new Request(`${BASE}/api/amanah`, {
        method: "PUT",
        headers: { cookie, origin: "https://evil.example", "x-forwarded-host": "localhost", "Content-Type": "application/json" },
        body: JSON.stringify(demoAmanahData),
      })
    );
    expect(res.status).toBe(401);
  });

  it("rejects writes without Origin unless the browser marks them same-origin", async () => {
    const { cookie } = await register();
    const base = { method: "PUT", body: JSON.stringify(demoAmanahData) };
    const noOrigin = new Request(`${BASE}/api/amanah`, { ...base, headers: { cookie, host: "localhost" } });
    expect((await amanahPUT(noOrigin)).status).toBe(401);
    const fetchMeta = new Request(`${BASE}/api/amanah`, { ...base, headers: { cookie, "sec-fetch-site": "same-origin" } });
    expect((await amanahPUT(fetchMeta)).status).toBe(200);
  });
});

describe("session lifecycle", () => {
  it("issues a fresh token on login and revokes the one presented before (fixation)", async () => {
    const { email, cookie: before } = await register();
    const res = await loginPOST(browserRequest(`${BASE}/api/auth/login`, json({ email, password: PASSWORD }), before));
    const after = sessionCookieFrom(res)!;
    expect(after).not.toBe(before);
    expect((await meGET(browserRequest(`${BASE}/api/auth/me`, {}, before))).status).toBe(401);
    expect((await meGET(browserRequest(`${BASE}/api/auth/me`, {}, after))).status).toBe(200);
  });

  it("logout deletes the server session and clears the cookie", async () => {
    const { cookie } = await register();
    const res = await logoutPOST(browserRequest(`${BASE}/api/auth/logout`, { method: "POST" }, cookie));
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toMatch(/amanah_session=;.*(Max-Age=0|Expires=Thu, 01 Jan 1970)/i);
    expect((await amanahGET(browserRequest(`${BASE}/api/amanah`, {}, cookie))).status).toBe(401);
  });

  it("does not accept a password that only shares length and prefix (memory mode)", async () => {
    const { email } = await register();
    const res = await loginPOST(browserRequest(`${BASE}/api/auth/login`, json({ email, password: "tesXXXXX1" })));
    expect(res.status).toBe(401);
    const near = await loginPOST(browserRequest(`${BASE}/api/auth/login`, json({ email, password: "testpassX" })));
    expect(near.status).toBe(401);
  });
});

describe("account export and deletion", () => {
  it("exports account and folder data without secrets", async () => {
    const { cookie, email } = await register();
    await saveDemo(cookie);
    const res = await exportGET(browserRequest(`${BASE}/api/account/export`, {}, cookie));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-disposition")).toMatch(/attachment/);
    const text = await res.text();
    const body = JSON.parse(text);
    expect(body.account.email).toBe(email);
    expect(body.amanahData.userProfile.name).toBe("Ahmed Demo");
    expect(text).not.toMatch(/passwordHash|scrypt:|tokenHash/);
    expect(text).not.toContain(cookie.split("=")[1]);
  });

  it("requires the password and then removes account, sessions and data", async () => {
    const { cookie, email } = await register();
    await saveDemo(cookie);
    const del = (password: string) =>
      accountDELETE(
        browserRequest(`${BASE}/api/account`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) }, cookie)
      );

    expect((await del("wrongpass1")).status).toBe(403);
    expect((await amanahGET(browserRequest(`${BASE}/api/amanah`, {}, cookie))).status).toBe(200);

    const ok = await del(PASSWORD);
    expect(ok.status).toBe(200);
    expect(ok.headers.get("set-cookie")).toMatch(/amanah_session=;/);
    expect((await amanahGET(browserRequest(`${BASE}/api/amanah`, {}, cookie))).status).toBe(401);
    expect((await loginPOST(browserRequest(`${BASE}/api/auth/login`, json({ email, password: PASSWORD })))).status).toBe(401);

    const again = await register(email);
    expect(again.res.status).toBe(200);
    const data = await (await amanahGET(browserRequest(`${BASE}/api/amanah`, {}, again.cookie))).json();
    expect(data.data.userProfile.name).toBe("");
  });

  it("rejects cross-origin account deletion", async () => {
    const { cookie } = await register();
    const res = await accountDELETE(
      new Request(`${BASE}/api/account`, {
        method: "DELETE",
        headers: { cookie, origin: "https://evil.example", "x-forwarded-host": "localhost" },
        body: JSON.stringify({ password: PASSWORD }),
      })
    );
    expect(res.status).toBe(403);
  });
});
