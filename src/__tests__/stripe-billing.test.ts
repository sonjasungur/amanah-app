import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as checkoutPOST } from "@/app/api/billing/checkout/route";
import { POST as webhookPOST } from "@/app/api/billing/webhook/route";
import { POST as sandboxPOST } from "@/app/api/billing/sandbox/complete/route";
import { getStripeTestConfig } from "@/lib/billing/config";
import { signPayload } from "@/lib/billing/signature";
import { checkoutSessionParams, STRIPE_API_BASE } from "@/lib/billing/stripe";
import { processPaymentEvent } from "@/lib/billing/service";
import { getServerRepository, resetServerRepository } from "@/lib/server/repository";
import { resetRateLimits } from "@/lib/ai/rate-limit";
import { clearOutbox } from "@/lib/server/mailer";
import { validateProductionEnv } from "@/lib/server/production-config";
import { validateStagingEnv } from "../../scripts/validate-staging-env.mjs";
import { browserRequest, registerVerified } from "./session-helpers";

/**
 * Stripe TEST mode adapter. Stripe is never contacted: every request goes to a mocked fetch.
 * Key-shaped values are assembled at runtime so secret scanners do not flag fixtures.
 */
const BASE = "http://localhost";
const TEST_KEY = ["rk", "test", "UnitTestOnlyNotARealKey0000"].join("_");
const LIVE_KEY = ["sk", "live", "UnitTestOnlyNotARealKey0000"].join("_");
const WEBHOOK_SECRET = ["whsec", "UnitTestOnlyNotARealSecret00"].join("_");
const env = (values: Record<string, string>) => values as unknown as NodeJS.ProcessEnv;
const json = (body: unknown): RequestInit => ({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

type Call = { url: string; init: RequestInit };
let calls: Call[];
let stripeReply: (call: Call) => Response;

function sessionReply(overrides: Record<string, unknown> = {}) {
  return new Response(
    JSON.stringify({ id: "cs_test_123", url: "https://checkout.stripe.com/c/pay/cs_test_123", livemode: false, ...overrides }),
    { status: 200 }
  );
}

beforeEach(() => {
  resetRateLimits();
  resetServerRepository();
  clearOutbox();
  globalThis.__amanahMemoryStore = undefined;
  vi.stubEnv("AMANAH_BILLING_MODE", "stripe_test");
  vi.stubEnv("AMANAH_STRIPE_SECRET_KEY", TEST_KEY);
  vi.stubEnv("AMANAH_STRIPE_WEBHOOK_SECRET", WEBHOOK_SECRET);
  vi.stubEnv("AMANAH_PUBLIC_BASE_URL", "https://staging.example.test");
  calls = [];
  stripeReply = () => sessionReply();
  vi.stubGlobal("fetch", async (url: string | URL, init: RequestInit = {}) => {
    const call = { url: String(url), init };
    calls.push(call);
    return stripeReply(call);
  });
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

async function startStripeCheckout() {
  const email = `stripe-${crypto.randomUUID()}@test.invalid`;
  const cookie = await registerVerified(BASE, email);
  calls = [];
  const res = await checkoutPOST(browserRequest(`${BASE}/api/billing/checkout`, json({ productId: "vorsorge_plus" }), cookie));
  const body = await res.json();
  return { email, cookie, res, body, ref: body.providerRef as string };
}

function stripeEvent(type: string, object: Record<string, unknown>, { id = `evt_${crypto.randomUUID()}`, livemode = false } = {}) {
  return JSON.stringify({ id, object: "event", type, livemode, data: { object } });
}

function sendWebhook(rawBody: string, signature = signPayload(rawBody, WEBHOOK_SECRET)) {
  return webhookPOST(new Request(`${BASE}/api/billing/webhook`, { method: "POST", headers: { "stripe-signature": signature }, body: rawBody }));
}

const paidSession = (ref: string, extra: Record<string, unknown> = {}) => ({
  id: "cs_test_123",
  object: "checkout.session",
  client_reference_id: ref,
  amount_total: 3900,
  currency: "eur",
  payment_status: "paid",
  ...extra,
});

describe("Stripe test-mode configuration", () => {
  it("accepts only test keys and a webhook signing secret; refuses live keys", () => {
    expect(getStripeTestConfig(env({ AMANAH_STRIPE_SECRET_KEY: TEST_KEY, AMANAH_STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET }))).toEqual({
      secretKey: TEST_KEY,
      webhookSecret: WEBHOOK_SECRET,
    });
    expect(() => getStripeTestConfig(env({ AMANAH_STRIPE_SECRET_KEY: LIVE_KEY, AMANAH_STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET }))).toThrow(/live keys/);
    expect(() => getStripeTestConfig(env({ AMANAH_STRIPE_SECRET_KEY: ["pk", "test", "PublishableNotSecret000"].join("_"), AMANAH_STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET }))).toThrow();
    expect(() => getStripeTestConfig(env({ AMANAH_STRIPE_SECRET_KEY: TEST_KEY }))).toThrow(/whsec_/);
  });

  it("production refuses stripe_test and live keys; staging accepts the Amanah test keys only", () => {
    const prod = validateProductionEnv(env({ NODE_ENV: "production", AMANAH_BILLING_MODE: "stripe_test", AMANAH_STRIPE_SECRET_KEY: LIVE_KEY }));
    expect(prod.errors.join("\n")).toMatch(/stripe_test is not allowed in production/);
    expect(prod.errors.join("\n")).toMatch(/AMANAH_STRIPE_SECRET_KEY is a Stripe live key/);

    const staging = (extra: Record<string, string>) =>
      validateStagingEnv(env({ AMANAH_DEPLOYMENT_ENV: "staging", AMANAH_BILLING_MODE: "stripe_test", ...extra })).errors.join("\n");
    expect(staging({ AMANAH_STRIPE_SECRET_KEY: TEST_KEY, AMANAH_STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET })).not.toMatch(/STRIPE|stripe_test/);
    expect(staging({ AMANAH_STRIPE_SECRET_KEY: LIVE_KEY, AMANAH_STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET })).toMatch(/live key/);
    expect(staging({ AMANAH_STRIPE_SECRET_KEY: TEST_KEY })).toMatch(/AMANAH_STRIPE_WEBHOOK_SECRET/);
  });
});

describe("Stripe Checkout session", () => {
  it("sends only product, amount and our opaque reference — no personal data", () => {
    const params = checkoutSessionParams({
      purchaseRef: "amn_abc",
      productName: "Mein Wille Vorsorge Plus",
      amountCents: 3900,
      currency: "EUR",
      baseUrl: "https://staging.example.test",
      now: 1_000_000,
    });
    expect(params).toMatchObject({
      mode: "payment",
      "line_items[0][price_data][currency]": "eur",
      "line_items[0][price_data][unit_amount]": "3900",
      client_reference_id: "amn_abc",
      success_url: "https://staging.example.test/kasse/ergebnis?ref=amn_abc",
      expires_at: String(1_000_000 + 31 * 60),
    });
    expect(Object.keys(params).some((k) => /email|customer|name\]?$/i.test(k) && !k.includes("product_data"))).toBe(false);
  });

  it("creates a pending stripe_test purchase and returns the Stripe test checkout URL", async () => {
    const { res, body, ref, email } = await startStripeCheckout();
    expect(res.status).toBe(201);
    expect(body.checkoutUrl).toBe("https://checkout.stripe.com/c/pay/cs_test_123");
    expect(calls).toHaveLength(1);
    const [{ url, init }] = calls;
    expect(url).toBe(`${STRIPE_API_BASE}/checkout/sessions`);
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe(`Bearer ${TEST_KEY}`);
    expect(headers["Idempotency-Key"]).toBe(`checkout-${ref}`);
    expect(String(init.body)).not.toContain(encodeURIComponent(email));
    const purchase = await getServerRepository().getPurchaseByRef(ref);
    expect(purchase).toMatchObject({ provider: "stripe_test", status: "pending", amountCents: 3900, currency: "EUR" });
  });

  it("marks the purchase failed and answers 502 when Stripe errors or answers in live mode", async () => {
    stripeReply = () => new Response('{"error":{"message":"contains request details"}}', { status: 401 });
    const failed = await startStripeCheckout();
    expect(failed.res.status).toBe(502);
    expect(JSON.stringify(failed.body)).not.toContain("request details");

    stripeReply = () => sessionReply({ livemode: true });
    const live = await startStripeCheckout();
    expect(live.res.status).toBe(502);
    const purchases = await getServerRepository().listPurchases((await getServerRepository().findUserByEmail(live.email))!.id);
    expect(purchases.map((p) => p.status)).toEqual(["failed"]);
  });

  it("refuses to start with a live key and stores nothing", async () => {
    vi.stubEnv("AMANAH_STRIPE_SECRET_KEY", LIVE_KEY);
    const { res, email } = await startStripeCheckout();
    expect(res.status).toBe(503);
    expect(calls).toHaveLength(0);
    expect(await getServerRepository().listPurchases((await getServerRepository().findUserByEmail(email))!.id)).toEqual([]);
  });
});

describe("Stripe webhook", () => {
  it("unlocks Plus on a signed, paid checkout.session.completed and is idempotent", async () => {
    const { ref } = await startStripeCheckout();
    const raw = stripeEvent("checkout.session.completed", paidSession(ref), { id: "evt_paid_1" });
    expect(await (await sendWebhook(raw)).json()).toMatchObject({ received: true, result: "applied" });
    expect((await getServerRepository().getPurchaseByRef(ref))?.status).toBe("paid");
    expect((await (await sendWebhook(raw)).json()).result).toBe("duplicate");
  });

  it("rejects bad signatures and live-mode events; ignores unknown types", async () => {
    const { ref } = await startStripeCheckout();
    const raw = stripeEvent("checkout.session.completed", paidSession(ref));
    expect((await sendWebhook(raw, signPayload(raw, ["whsec", "SomeOtherEndpointSecret00"].join("_")))).status).toBe(400);
    expect((await sendWebhook(raw, "")).status).toBe(400);
    expect((await sendWebhook(stripeEvent("checkout.session.completed", paidSession(ref), { livemode: true }))).status).toBe(400);
    expect((await (await sendWebhook(stripeEvent("customer.created", { id: "cus_1" }))).json()).result).toBe("ignored");
    expect((await getServerRepository().getPurchaseByRef(ref))?.status).toBe("pending");
  });

  it("accepts any matching v1 signature while the signing secret is rotated", async () => {
    const { ref } = await startStripeCheckout();
    const raw = stripeEvent("checkout.session.completed", paidSession(ref));
    const valid = signPayload(raw, WEBHOOK_SECRET);
    const t = valid.split(",")[0];
    // Valid signature first: a parser that keeps only the last v1 would reject this.
    const rotated = `${t},${valid.split(",")[1]},v1=${"0".repeat(64)}`;
    expect((await (await sendWebhook(raw, rotated)).json()).result).toBe("applied");
  });

  it("waits for delayed payments, handles async success, failure, expiry and amount manipulation", async () => {
    const a = await startStripeCheckout();
    const unpaid = stripeEvent("checkout.session.completed", paidSession(a.ref, { payment_status: "unpaid" }));
    expect(await (await sendWebhook(unpaid)).json()).toMatchObject({ result: "ignored", reason: "awaiting_async_payment" });
    expect((await (await sendWebhook(stripeEvent("checkout.session.async_payment_succeeded", paidSession(a.ref)))).json()).result).toBe("applied");

    const b = await startStripeCheckout();
    expect((await (await sendWebhook(stripeEvent("checkout.session.async_payment_failed", paidSession(b.ref, { payment_status: "unpaid" })))).json()).result).toBe("applied");
    expect((await getServerRepository().getPurchaseByRef(b.ref))?.status).toBe("failed");

    const c = await startStripeCheckout();
    expect((await (await sendWebhook(stripeEvent("checkout.session.expired", paidSession(c.ref, { payment_status: "unpaid" })))).json()).result).toBe("applied");
    expect((await getServerRepository().getPurchaseByRef(c.ref))?.status).toBe("failed");

    const d = await startStripeCheckout();
    expect((await (await sendWebhook(stripeEvent("checkout.session.completed", paidSession(d.ref, { amount_total: 100 })))).json()).result).toBe("amount_mismatch");
  });

  it("revokes access only on a full refund, looked up via the payment intent", async () => {
    const { ref } = await startStripeCheckout();
    await sendWebhook(stripeEvent("checkout.session.completed", paidSession(ref)));
    stripeReply = ({ url }) => {
      expect(url).toBe(`${STRIPE_API_BASE}/checkout/sessions?payment_intent=pi_123&limit=1`);
      return new Response(JSON.stringify({ data: [{ client_reference_id: ref }] }), { status: 200 });
    };
    const charge = { id: "ch_1", object: "charge", payment_intent: "pi_123", amount: 3900, currency: "eur" };
    expect((await (await sendWebhook(stripeEvent("charge.refunded", { ...charge, refunded: false }))).json()).reason).toBe("partial_refund");
    expect((await (await sendWebhook(stripeEvent("charge.refunded", { ...charge, refunded: true }))).json()).result).toBe("applied");
    expect((await getServerRepository().getPurchaseByRef(ref))?.status).toBe("refunded");

    stripeReply = () => new Response("{}", { status: 500 });
    expect((await sendWebhook(stripeEvent("charge.refunded", { ...charge, refunded: true }))).status).toBe(503);
  });

  it("a sandbox event cannot change a Stripe purchase, and the sandbox route is off", async () => {
    const { cookie, ref } = await startStripeCheckout();
    const done = await sandboxPOST(browserRequest(`${BASE}/api/billing/sandbox/complete`, json({ ref, outcome: "succeeded" }), cookie));
    expect(done.status).toBe(404);
    const forged = { id: "evt_sbx_x", type: "payment_succeeded" as const, providerRef: ref, amountCents: 3900, currency: "EUR" };
    expect((await processPaymentEvent(getServerRepository(), forged, "sandbox")).result).toBe("unknown_purchase");
    expect((await getServerRepository().getPurchaseByRef(ref))?.status).toBe("pending");
  });
});
