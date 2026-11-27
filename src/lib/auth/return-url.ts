/**
 * Where a person returns after signing in or registering (AP22, EA-04.4). Only relative paths on this site are
 * accepted (open-redirect protection): no scheme, no protocol-relative "//", no backslash (browsers read "/\" as
 * "//"), no control characters, and never the sign-in pages themselves (no loop).
 */
const AUTH_PAGES = ["/login", "/register", "/konto/bestaetigen"];

export function sanitizeReturnUrl(raw: string | null | undefined, fallback = "/dashboard"): string {
  if (!raw) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//")) return fallback;
  if (raw.includes("://") || raw.includes("\\")) return fallback;
  if (/[\u0000-\u001F\u007F]/.test(raw)) return fallback;
  if (raw.length > 512) return fallback;
  const path = raw.split(/[?#]/)[0];
  if (AUTH_PAGES.some((p) => path === p || path.startsWith(`${p}/`))) return fallback;
  return raw;
}

export function buildAuthHref(path: "/login" | "/register", returnUrl: string): string {
  return `${path}?returnUrl=${encodeURIComponent(returnUrl)}`;
}

/** Query suffix for the confirmation link in the e-mail; empty for the default target. */
export function returnUrlQuery(returnUrl: string | null | undefined): string {
  const safe = sanitizeReturnUrl(returnUrl, "");
  return safe && safe !== "/dashboard" ? `&returnUrl=${encodeURIComponent(safe)}` : "";
}
