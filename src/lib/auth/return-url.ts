export function sanitizeReturnUrl(raw: string | null | undefined, fallback = "/dashboard"): string {
  if (!raw) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//")) return fallback;
  if (raw.includes("://")) return fallback;
  return raw;
}

export function buildAuthHref(path: "/login" | "/register", returnUrl: string): string {
  return `${path}?returnUrl=${encodeURIComponent(returnUrl)}`;
}
