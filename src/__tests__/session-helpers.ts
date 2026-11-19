/** Builds requests the way a same-origin browser would send them (Origin + session cookie). */
export function browserRequest(url: string, init: RequestInit = {}, cookie?: string): Request {
  const headers = new Headers(init.headers);
  const { host, origin } = new URL(url);
  headers.set("x-forwarded-host", host);
  if (init.method && init.method !== "GET") headers.set("origin", origin);
  if (cookie) headers.set("cookie", cookie);
  return new Request(url, { ...init, headers });
}

/** "name=value" of the session cookie set by a response, or null. */
export function sessionCookieFrom(response: Response): string | null {
  const setCookie = response.headers.get("set-cookie");
  if (!setCookie) return null;
  const pair = setCookie.split(";")[0];
  return pair.endsWith("=") ? null : pair;
}

/** Extracts the token from the latest mail of the given kind sent to `email` (in-memory outbox). */
export async function tokenFromOutbox(email: string, kind: "verify_email" | "reset_password"): Promise<string> {
  const { readOutbox } = await import("@/lib/server/mailer");
  const mail = readOutbox(email).filter((m) => m.kind === kind).at(-1);
  const match = mail?.text.match(/token=([^\s&]+)/);
  if (!match) throw new Error(`no ${kind} mail for ${email}`);
  return decodeURIComponent(match[1]);
}

/**
 * Full sign-up as a browser would do it: register → confirmation mail → verify
 * (which signs in) → optional consent for server storage. Returns the session cookie.
 */
export async function registerVerified(
  base: string,
  email: string,
  password = "testpass1",
  { consent = true }: { consent?: boolean } = {}
): Promise<string> {
  const { POST: registerPOST } = await import("@/app/api/auth/register/route");
  const { POST: verifyPOST } = await import("@/app/api/auth/verify-email/route");
  const json = (body: unknown): RequestInit => ({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

  const reg = await registerPOST(browserRequest(`${base}/api/auth/register`, json({ email, password, name: "Test" })));
  if (reg.status !== 202) throw new Error(`register failed: ${reg.status}`);
  const token = await tokenFromOutbox(email, "verify_email");
  const verified = await verifyPOST(browserRequest(`${base}/api/auth/verify-email`, json({ token })));
  const cookie = sessionCookieFrom(verified);
  if (!cookie) throw new Error(`verify failed: ${verified.status}`);
  if (consent) await grantStorageConsent(base, cookie);
  return cookie;
}

export async function grantStorageConsent(base: string, cookie: string): Promise<Response> {
  const { POST: consentPOST } = await import("@/app/api/consent/route");
  const { CONSENT_PURPOSES } = await import("@/lib/consent/purposes");
  return consentPOST(
    browserRequest(
      `${base}/api/consent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose: "sensitive_folder_storage", version: CONSENT_PURPOSES.sensitive_folder_storage.version, confirmed: true }),
      },
      cookie
    )
  );
}
