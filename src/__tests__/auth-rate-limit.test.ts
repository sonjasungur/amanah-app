import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as registerPOST } from "@/app/api/auth/register/route";
import { POST as loginPOST } from "@/app/api/auth/login/route";
import { POST as verifyPOST } from "@/app/api/auth/verify-email/route";
import { resetServerRepository } from "@/lib/server/repository";
import { resetRateLimits } from "@/lib/ai/rate-limit";
import { clientAddress, limitKey } from "@/lib/server/auth-rate-limit";
import { browserRequest, tokenFromOutbox } from "./session-helpers";

const BASE = "http://localhost";
const PASSWORD = "testpass1";

function post(path: string, body: unknown, forwardedFor = "203.0.113.7") {
  return browserRequest(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Forwarded-For": forwardedFor },
    body: JSON.stringify(body),
  });
}

async function verifiedAccount(email: string) {
  expect((await registerPOST(post("/api/auth/register", { email, password: PASSWORD, name: "R" }))).status).toBe(202);
  await verifyPOST(post("/api/auth/verify-email", { token: await tokenFromOutbox(email, "verify_email") }));
}

beforeEach(() => {
  vi.stubEnv("AMANAH_PUBLIC_REGISTRATION_ENABLED", "true");
  vi.stubEnv("AMANAH_MAIL_TRANSPORT", "outbox");
  resetServerRepository();
  resetRateLimits();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("client address behind the proxy", () => {
  const req = (header?: string) => new Request(BASE, { headers: header ? { "X-Forwarded-For": header } : {} });

  it("takes the entry the trusted proxy added, not what the client sent before it", () => {
    expect(clientAddress(req("198.51.100.9"), {})).toBe("198.51.100.9");
    expect(clientAddress(req("10.0.0.1, 198.51.100.9"), {})).toBe("198.51.100.9");
    expect(clientAddress(req("1.1.1.1, 2.2.2.2, 198.51.100.9"), { AMANAH_TRUSTED_PROXY_HOPS: "2" })).toBe("2.2.2.2");
  });

  it("does not let a forged value become a fresh key", () => {
    expect(clientAddress(req("not-an-ip"), {})).toBe("unparsable");
    expect(clientAddress(req("<script>"), {})).toBe("unparsable");
    expect(clientAddress(req(), {})).toBe("direct");
    expect(clientAddress(req("198.51.100.9"), { AMANAH_TRUSTED_PROXY_HOPS: "0" })).toBe("direct");
  });

  it("stores neither the address nor the e-mail in clear", () => {
    const key = limitKey("login:email", "person@example.org");
    expect(key).not.toContain("person");
    expect(key).not.toContain("example.org");
    expect(limitKey("login:ip", "198.51.100.9")).not.toContain("198.51.100");
  });
});

describe("login brake", () => {
  it("pauses an address after repeated wrong passwords, even for the right one, and lifts it after the window", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const email = `brake-${crypto.randomUUID()}@test.de`;
    await verifiedAccount(email);
    for (let i = 0; i < 10; i++) {
      vi.setSystemTime(Date.now() + 7_000); // stays under the per-minute attempt limit
      expect((await loginPOST(post("/api/auth/login", { email, password: "falsch-falsch" }))).status).toBe(401);
    }
    vi.setSystemTime(Date.now() + 61_000);
    const paused = await loginPOST(post("/api/auth/login", { email, password: PASSWORD }));
    expect(paused.status).toBe(429);
    expect(Number(paused.headers.get("Retry-After"))).toBeGreaterThan(0);

    vi.setSystemTime(Date.now() + 15 * 60_000 + 1_000);
    expect((await loginPOST(post("/api/auth/login", { email, password: PASSWORD }))).status).toBe(200);
  });

  it("answers an unknown address exactly like a known one, so the brake reveals no account", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const known = `known-${crypto.randomUUID()}@test.de`;
    const unknown = `unknown-${crypto.randomUUID()}@test.de`;
    await verifiedAccount(known);
    const answers: string[] = [];
    for (const email of [known, unknown]) {
      for (let i = 0; i < 11; i++) {
        vi.setSystemTime(Date.now() + 7_000);
        const res = await loginPOST(post("/api/auth/login", { email, password: "falsch-falsch" }));
        answers.push(`${res.status} ${JSON.stringify(await res.json())}`);
      }
    }
    expect(answers.slice(0, 11)).toEqual(answers.slice(11));
    expect(answers[10]).toMatch(/^429 /);
  });

  it("a successful login clears the count of wrong passwords", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const email = `clear-${crypto.randomUUID()}@test.de`;
    await verifiedAccount(email);
    for (let i = 0; i < 9; i++) {
      vi.setSystemTime(Date.now() + 7_000);
      await loginPOST(post("/api/auth/login", { email, password: "falsch-falsch" }));
    }
    vi.setSystemTime(Date.now() + 7_000);
    expect((await loginPOST(post("/api/auth/login", { email, password: PASSWORD }))).status).toBe(200);
    for (let i = 0; i < 9; i++) {
      vi.setSystemTime(Date.now() + 7_000);
      expect((await loginPOST(post("/api/auth/login", { email, password: "falsch-falsch" }))).status).toBe(401);
    }
  });

  it("counts attempts per client address across different e-mails", async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 11; i++) {
      statuses.push((await loginPOST(post("/api/auth/login", { email: `spray-${i}@test.de`, password: "x" }, "198.51.100.20"))).status);
    }
    expect(statuses.slice(0, 10).every((s) => s === 401)).toBe(true);
    expect(statuses[10]).toBe(429);
    // A forged left-hand entry does not give the same client a new counter.
    expect((await loginPOST(post("/api/auth/login", { email: "spray-x@test.de", password: "x" }, "9.9.9.9, 198.51.100.20"))).status).toBe(429);
    // Another client is not affected.
    expect((await loginPOST(post("/api/auth/login", { email: "spray-y@test.de", password: "x" }, "198.51.100.21"))).status).toBe(401);
  });

  it("never writes an e-mail address or a password to the log", async () => {
    const spies = (["log", "info", "warn", "error"] as const).map((level) => vi.spyOn(console, level).mockImplementation(() => {}));
    const email = `quiet-${crypto.randomUUID()}@test.de`;
    for (let i = 0; i < 12; i++) await loginPOST(post("/api/auth/login", { email, password: "geheim-passwort" }));
    const logged = JSON.stringify(spies.flatMap((spy) => spy.mock.calls));
    expect(logged).not.toContain(email);
    expect(logged).not.toContain("geheim-passwort");
    spies.forEach((spy) => spy.mockRestore());
  });
});

describe("registration brake", () => {
  it("limits mails to one address the same way whether or not it is registered", async () => {
    const known = `reg-known-${crypto.randomUUID()}@test.de`;
    await verifiedAccount(known);
    const unknown = `reg-new-${crypto.randomUUID()}@test.de`;
    const statusesFor = async (email: string, ip: string) => {
      const out: number[] = [];
      for (let i = 0; i < 4; i++) out.push((await registerPOST(post("/api/auth/register", { email, password: PASSWORD, name: "R" }, ip))).status);
      return out;
    };
    // The known address already used one of its three mails at registration.
    expect(await statusesFor(known, "198.51.100.30")).toEqual([202, 202, 429, 429]);
    expect(await statusesFor(unknown, "198.51.100.31")).toEqual([202, 202, 202, 429]);
  });

  it("limits registrations per client address", async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) {
      statuses.push((await registerPOST(post("/api/auth/register", { email: `ip-${crypto.randomUUID()}@test.de`, password: PASSWORD, name: "R" }, "198.51.100.40"))).status);
    }
    expect(statuses).toEqual([202, 202, 202, 202, 202, 429]);
  });
});
