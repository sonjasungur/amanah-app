import type { NextResponse } from "next/server";

/**
 * Session transport: an HttpOnly cookie, never readable by page scripts.
 * In production the cookie is Secure and uses the __Host- prefix (no Domain, Path=/),
 * so subdomains cannot set or overwrite it.
 */
export function isSessionCookieSecure(): boolean {
  if (process.env.AMANAH_COOKIE_SECURE === "false") return false;
  return process.env.NODE_ENV === "production";
}

export function getSessionCookieName(): string {
  return isSessionCookieSecure() ? "__Host-amanah_session" : "amanah_session";
}

export function readSessionToken(request: Request): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  const name = getSessionCookieName();
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("=")) || null;
  }
  return null;
}

export function setSessionCookie(response: NextResponse, token: string, expiresAt: string): void {
  response.cookies.set({
    name: getSessionCookieName(),
    value: token,
    httpOnly: true,
    secure: isSessionCookieSecure(),
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: getSessionCookieName(),
    value: "",
    httpOnly: true,
    secure: isSessionCookieSecure(),
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * CSRF guard for cookie-authenticated, state-changing requests: the browser-sent
 * Origin must match the host the request was addressed to. Requests without Origin
 * are only accepted when the browser marks them as same-origin.
 */
export function isSameOriginRequest(request: Request): boolean {
  if (SAFE_METHODS.has(request.method.toUpperCase())) return true;
  const origin = request.headers.get("origin");
  if (!origin) return request.headers.get("sec-fetch-site") === "same-origin";
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
