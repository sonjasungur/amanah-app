import { getProducts, type ProductId } from "./products";
import { getBillingMode, getSandboxWebhookSecret, getStripeTestConfig, StripeConfigError } from "./config";
import { signPayload, verifySignature } from "./signature";
import { createCheckoutSession, mapStripeEvent, StripeRequestError } from "./stripe";
import { getPublicBaseUrl } from "@/lib/server/account-recovery";
import type { PurchaseStatus, RepositoryPurchase, ServerRepository } from "@/lib/server/repository/types";

export type PaymentEventType = "payment_succeeded" | "payment_failed" | "refund_succeeded";

export interface PaymentEventPayload {
  id: string;
  type: PaymentEventType;
  providerRef: string;
  amountCents: number;
  currency: string;
}

export const SIGNATURE_HEADER = "amanah-signature";
export const STRIPE_SIGNATURE_HEADER = "stripe-signature";

/** Allowed status changes. Anything else is ignored (never downgrades a refund, never re-pays). */
const TRANSITIONS: Record<PaymentEventType, { from: PurchaseStatus[]; to: PurchaseStatus }> = {
  payment_succeeded: { from: ["pending", "failed"], to: "paid" },
  payment_failed: { from: ["pending"], to: "failed" },
  refund_succeeded: { from: ["paid"], to: "refunded" },
};

export class BillingError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

/** Misconfigured Stripe test mode = checkout unavailable (logged without values), never a crash. */
function stripeConfig() {
  try {
    return getStripeTestConfig();
  } catch (e) {
    if (!(e instanceof StripeConfigError)) throw e;
    console.error(`[billing] ${e.message}`);
    throw new BillingError("Bezahlung ist derzeit nicht verfügbar.", 503);
  }
}

export async function startCheckout(repo: ServerRepository, userId: string, productId: string) {
  const mode = getBillingMode();
  if (mode === "disabled") throw new BillingError("Bezahlung ist derzeit nicht verfügbar.", 503);
  const product = getProducts().find((p) => p.id === productId);
  if (!product || !product.available || product.testPriceCents === null) throw new BillingError("Produkt nicht buchbar.", 400);
  if (await hasEntitlement(repo, userId, product.id)) throw new BillingError("Dieses Paket ist bereits freigeschaltet.", 409);

  if (mode === "stripe_test") {
    // Validate before anything is stored, so a misconfiguration leaves no pending purchase behind.
    const { secretKey } = stripeConfig();
    const purchase = await repo.createPurchase({
      userId,
      productId: product.id,
      provider: "stripe_test",
      providerRef: `amn_${crypto.randomUUID()}`,
      status: "pending",
      amountCents: product.testPriceCents,
      currency: "EUR",
    });
    try {
      const session = await createCheckoutSession(secretKey, {
        purchaseRef: purchase.providerRef,
        productName: product.name,
        amountCents: purchase.amountCents,
        currency: purchase.currency,
        baseUrl: getPublicBaseUrl(),
      });
      return { providerRef: purchase.providerRef, checkoutUrl: session.url };
    } catch (e) {
      await repo.transitionPurchase(purchase.providerRef, ["pending"], "failed");
      const status = e instanceof StripeRequestError ? `HTTP ${e.status}` : "network error";
      console.error(`[billing] stripe_test checkout failed: ${status}`);
      throw new BillingError("Die Test-Kasse ist gerade nicht erreichbar. Bitte später erneut versuchen.", 502);
    }
  }

  const purchase = await repo.createPurchase({
    userId,
    productId: product.id,
    provider: "sandbox",
    providerRef: `sbx_${crypto.randomUUID()}`,
    status: "pending",
    amountCents: product.testPriceCents,
    currency: "EUR",
  });
  return { providerRef: purchase.providerRef, checkoutUrl: `/kasse/sandbox?ref=${encodeURIComponent(purchase.providerRef)}` };
}

export async function processPaymentEvent(repo: ServerRepository, event: PaymentEventPayload, provider = "sandbox") {
  const purchase = await repo.getPurchaseByRef(event.providerRef);
  // A provider may only change its own purchases (e.g. no sandbox event for a Stripe purchase).
  if (!purchase || purchase.provider !== provider) return { result: "unknown_purchase" as const };
  if (purchase.amountCents !== event.amountCents || purchase.currency !== event.currency) {
    return { result: "amount_mismatch" as const };
  }
  if (!(await repo.recordPaymentEvent(event.id, purchase.provider, event.type, event.providerRef))) {
    return { result: "duplicate" as const };
  }
  const { from, to } = TRANSITIONS[event.type];
  const applied = await repo.transitionPurchase(event.providerRef, from, to);
  return { result: applied ? ("applied" as const) : ("ignored_transition" as const) };
}

function isPaymentEvent(value: unknown): value is PaymentEventPayload {
  const v = value as PaymentEventPayload;
  return (
    Boolean(v) &&
    typeof v.id === "string" &&
    v.type in TRANSITIONS &&
    typeof v.providerRef === "string" &&
    Number.isInteger(v.amountCents) &&
    typeof v.currency === "string"
  );
}

/** Entry point for provider callbacks: verify signature on the raw body, then process. */
export async function handleSignedWebhook(repo: ServerRepository, rawBody: string, signature: string | null) {
  if (!verifySignature(rawBody, signature, getSandboxWebhookSecret())) throw new BillingError("Ungültige Signatur.", 400);
  let event: unknown;
  try {
    event = JSON.parse(rawBody);
  } catch {
    throw new BillingError("Ungültiges Ereignis.", 400);
  }
  if (!isPaymentEvent(event)) throw new BillingError("Ungültiges Ereignis.", 400);
  return processPaymentEvent(repo, event);
}

/** Stripe test mode: verify the Stripe-Signature header on the raw body, map, then process. */
export async function handleStripeWebhook(repo: ServerRepository, rawBody: string, signature: string | null) {
  const { secretKey, webhookSecret } = stripeConfig();
  if (!verifySignature(rawBody, signature, webhookSecret)) throw new BillingError("Ungültige Signatur.", 400);
  let raw: unknown;
  try {
    raw = JSON.parse(rawBody);
  } catch {
    throw new BillingError("Ungültiges Ereignis.", 400);
  }
  let mapped;
  try {
    mapped = await mapStripeEvent(raw, secretKey);
  } catch (e) {
    // 5xx makes Stripe retry later (refund lookup failed).
    const status = e instanceof StripeRequestError ? `HTTP ${e.status}` : "network error";
    console.error(`[billing] stripe_test refund lookup failed: ${status}`);
    throw new BillingError("Ereignis vorübergehend nicht verarbeitbar.", 503);
  }
  if (mapped.kind === "invalid") throw new BillingError("Ungültiges Ereignis.", 400);
  if (mapped.kind === "ignored") return { result: "ignored" as const, reason: mapped.reason };
  return processPaymentEvent(repo, mapped.event, "stripe_test");
}

/** Sandbox stand-in for the provider: builds and signs the event it would send. */
export function buildSandboxEvent(purchase: RepositoryPurchase, type: PaymentEventType) {
  const event: PaymentEventPayload = {
    id: `evt_sbx_${crypto.randomUUID()}`,
    type,
    providerRef: purchase.providerRef,
    amountCents: purchase.amountCents,
    currency: purchase.currency,
  };
  const rawBody = JSON.stringify(event);
  return { rawBody, signature: signPayload(rawBody, getSandboxWebhookSecret()) };
}

export async function hasEntitlement(repo: ServerRepository, userId: string, productId: ProductId): Promise<boolean> {
  return (await repo.listPurchases(userId)).some((p) => p.productId === productId && p.status === "paid");
}
