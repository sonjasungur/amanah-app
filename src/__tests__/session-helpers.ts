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
