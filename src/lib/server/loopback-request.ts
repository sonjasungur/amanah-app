/**
 * True only for a request that reached the app directly on the loopback interface (local development,
 * E2E, or the staging container port through an SSH tunnel). Behind the reverse proxy the Host header is
 * the public domain (the proxy routes by it, so a client cannot set it to localhost), and the proxy's
 * X-Forwarded-Host names it too.
 */
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

function hostName(value: string | null): string | null {
  if (value === null) return null;
  const first = value.split(",")[0].trim().toLowerCase();
  if (first.startsWith("[")) return first.slice(0, first.indexOf("]") + 1);
  return first.replace(/:\d+$/, "");
}

export function isLoopbackRequest(request: Request): boolean {
  const host = hostName(request.headers.get("host"));
  if (host === null || !LOOPBACK_HOSTS.has(host)) return false;
  const forwarded = hostName(request.headers.get("x-forwarded-host"));
  return forwarded === null || LOOPBACK_HOSTS.has(forwarded);
}

