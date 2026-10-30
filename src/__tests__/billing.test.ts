import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as checkoutPOST } from "@/app/api/billing/checkout/route";
import { POST as webhookPOST } from "@/app/api/billing/webhook/route";
import { POST as sandboxPOST } from "@/app/api/billing/sandbox/complete/route";
import { GET as statusGET } from "@/app/api/billing/status/route";
import { GET as receiptGET } from "@/app/api/billing/receipt/[ref]/route";
import { DELETE as accountDELETE } from "@/app/api/account/route";
import { signPayload, verifySignature } from "@/lib/billing/signature";
import { getProducts, getTestPriceCents } from "@/lib/billing/products";
import { buildSandboxEvent, hasEntitlement, processPaymentEvent } from "@/lib/billing/service";
import { getServerRepository, resetServerRepository } from "@/lib/server/repository";
import { resetRateLimits } from "@/lib/ai/rate-limit";
import { clearOutbox } from "@/lib/server/mailer";
import { browserRequest, registerVerified } from "./session-helpers";

const BASE = "http://localhost";
const json = (body: unknown, method = "POST"): RequestInit => ({ method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

async function userWithCheckout() {
  const email = `bill-${crypto.randomUUID()}@test.invalid`;
  const cookie = await registerVerified(BASE, email);
  const res = await checkoutPOST(browserRequest(`${BASE}/api/billing/checkout`, json({ productId: "vorsorge_plus" }), cookie));
  const body = await res.json();
  return { email, cookie, res, ref: body.providerRef as string, checkoutUrl: body.checkoutUrl as string };
}

function sandbox(cookie: string, ref: string, outcome: string) {
  return sandboxPOST(browserRequest(`${BASE}/api/billing/sandbox/complete`, json({ ref, outcome }), cookie));
}

beforeEach(() => {
  resetRateLimits();
  resetServerRepository();
  clearOutbox();
  globalThis.__amanahMemoryStore = undefined;
  vi.stubEnv("AMANAH_BILLING_MODE", "sandbox");
});

afterEach(() => vi.unstubAllEnvs());

describe("webhook signature", () => {
  const secret = "s".repeat(40);
  it("accepts a valid signature and rejects tampering, wrong secret and stale timestamps", () => {
    const payload = '{"a":1}';
    const header = signPayload(payload, secret, 1_000_000);
    expect(verifySignature(payload, header, secret, { now: 1_000_010 })).toBe(true);
    expect(verifySignature('{"a":2}', header, secret, { now: 1_000_010 })).toBe(false);
    expect(verifySignature(payload, header, "x".repeat(40), { now: 1_000_010 })).toBe(false);
    expect(verifySignature(payload, header, secret, { now: 1_000_000 + 301 })).toBe(false);
    expect(verifySignature(payload, null, secret)).toBe(false);
    expect(verifySignature(payload, "t=abc,v1=zz", secret)).toBe(false);
  });
});

describe("products", () => {
  it("uses configurable test prices only (29 € or 39 €)", () => {
    expect(getTestPriceCents({} as unknown as NodeJS.ProcessEnv)).toBe(2900);
    expect(getTestPriceCents({ AMANAH_TEST_PRICE_VORSORGE_PLUS_CENTS: "3900" } as unknown as NodeJS.ProcessEnv)).toBe(3900);
    expect(getTestPriceCents({ AMANAH_TEST_PRICE_VORSORGE_PLUS_CENTS: "100" } as unknown as NodeJS.ProcessEnv)).toBe(2900);
    expect(getProducts().filter((p) => p.id.startsWith("testament")).every((p) => !p.available)).toBe(true);
  });
});

describe("sandbox purchase flow", () => {
  it("creates a pending purchase and unlocks Vorsorge Plus after a signed success event", async () => {
    const { cookie, res, ref, checkoutUrl, email } = await userWithCheckout();
    expect(res.status).toBe(201);
    expect(checkoutUrl).toContain("/kasse/sandbox?ref=");
    const done = await (await sandbox(cookie, ref, "succeeded")).json();
    expect(done).toMatchObject({ result: "applied", status: "paid" });
    const user = await getServerRepository().findUserByEmail(email);
    expect(await hasEntitlement(getServerRepository(), user!.id, "vorsorge_plus")).toBe(true);
    const status = await (await statusGET(browserRequest(`${BASE}/api/billing/status`, {}, cookie))).json();
    expect(status.entitlements).toEqual(["vorsorge_plus"]);
    expect(JSON.stringify(status.purchases)).not.toContain(user!.id);
  });

  it("handles failure, retry, refund and refuses a second purchase while paid", async () => {
    const { cookie, ref } = await userWithCheckout();
    expect((await (await sandbox(cookie, ref, "failed")).json()).status).toBe("failed");
    expect((await (await sandbox(cookie, ref, "succeeded")).json()).status).toBe("paid");
    const again = await checkoutPOST(browserRequest(`${BASE}/api/billing/checkout`, json({ productId: "vorsorge_plus" }), cookie));
    expect(again.status).toBe(409);
    expect((await (await sandbox(cookie, ref, "refund")).json()).status).toBe("refunded");
    expect((await (await sandbox(cookie, ref, "failed")).json()).result).toBe("ignored_transition");
  });

  it("is idempotent for replayed events and rejects amount manipulation", async () => {
    const { ref } = await userWithCheckout();
    const repo = getServerRepository();
    const purchase = (await repo.getPurchaseByRef(ref))!;
    const { rawBody, signature } = buildSandboxEvent(purchase, "payment_succeeded");
    const send = (body: string, sig: string) =>
      webhookPOST(new Request(`${BASE}/api/billing/webhook`, { method: "POST", headers: { "amanah-signature": sig }, body }));
    expect((await (await send(rawBody, signature)).json()).result).toBe("applied");
    expect((await (await send(rawBody, signature)).json()).result).toBe("duplicate");

    const forged = JSON.stringify({ ...JSON.parse(rawBody), id: "evt_other", amountCents: 1 });
    expect((await send(forged, signature)).status).toBe(400);
    const event = { ...JSON.parse(rawBody), id: "evt_cheap", amountCents: 1 };
    expect((await processPaymentEvent(repo, event)).result).toBe("amount_mismatch");
  });

  it("rejects unsigned webhooks and locked products; webhook is off when billing is disabled", async () => {
    const res = await webhookPOST(new Request(`${BASE}/api/billing/webhook`, { method: "POST", body: "{}" }));
    expect(res.status).toBe(400);
    const { cookie } = await userWithCheckout();
    const locked = await checkoutPOST(browserRequest(`${BASE}/api/billing/checkout`, json({ productId: "testament_pruefung" }), cookie));
    expect(locked.status).toBe(400);
    vi.stubEnv("AMANAH_BILLING_MODE", "disabled");
    expect((await webhookPOST(new Request(`${BASE}/api/billing/webhook`, { method: "POST", body: "{}" }))).status).toBe(404);
    expect((await checkoutPOST(browserRequest(`${BASE}/api/billing/checkout`, json({ productId: "vorsorge_plus" }), cookie))).status).toBe(503);
  });

  it("other users cannot complete or view someone else's purchase", async () => {
    const owner = await userWithCheckout();
    const intruderCookie = await registerVerified(BASE, `intruder-${crypto.randomUUID()}@test.invalid`);
    expect((await sandbox(intruderCookie, owner.ref, "succeeded")).status).toBe(404);
    const receipt = await receiptGET(browserRequest(`${BASE}/api/billing/receipt/${owner.ref}`, {}, intruderCookie), { params: Promise.resolve({ ref: owner.ref }) });
    expect(receipt.status).toBe(404);
    const own = await receiptGET(browserRequest(`${BASE}/api/billing/receipt/${owner.ref}`, {}, owner.cookie), { params: Promise.resolve({ ref: owner.ref }) });
    expect(await own.text()).toContain("TESTBELEG – keine Rechnung");
  });

  it("keeps purchases anonymised when the account is deleted", async () => {
    const { cookie, ref } = await userWithCheckout();
    await accountDELETE(browserRequest(`${BASE}/api/account`, json({ password: "testpass1" }, "DELETE"), cookie));
    const purchase = await getServerRepository().getPurchaseByRef(ref);
    expect(purchase).not.toBeNull();
    expect(purchase!.userId).toBeNull();
  });
});
