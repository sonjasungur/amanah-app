/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiAuthProvider, hasAuthSession, rememberSession } from "@/lib/auth/api-auth-provider";

const session = { user: { id: "u1", email: "a@test.invalid", name: "A" }, expiresAt: "2099-01-01T00:00:00.000Z" };
const respond = (status: number, body: unknown) => vi.fn(async () => new Response(JSON.stringify(body), { status }));

describe("session hint in the browser", () => {
  beforeEach(() => {
    localStorage.clear();
    rememberSession(session as never);
  });
  afterEach(() => vi.unstubAllGlobals());

  it.each([
    ["a request cut off by leaving the page", vi.fn(async () => Promise.reject(new DOMException("Aborted", "AbortError")))],
    ["a network problem", vi.fn(async () => Promise.reject(new TypeError("Failed to fetch")))],
    ["a brief server error", respond(500, { error: "x" })],
    ["a rate limit", respond(429, { error: "x" })],
    ["a response that is no JSON", vi.fn(async () => new Response("<html>", { status: 502 }))],
  ])("%s does not sign anyone out", async (_name, fetchMock) => {
    vi.stubGlobal("fetch", fetchMock);
    expect((await apiAuthProvider.getSession())?.user.id).toBe("u1");
    expect(hasAuthSession()).toBe(true);
  });

  it("the server saying no does", async () => {
    vi.stubGlobal("fetch", respond(401, { error: "Nicht angemeldet." }));
    expect(await apiAuthProvider.getSession()).toBeNull();
    expect(hasAuthSession()).toBe(false);
  });
});
