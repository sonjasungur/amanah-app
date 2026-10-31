/**
 * Stripe Checkout adapter — TEST MODE ONLY (docs/strategy/25-stripe-einrichtung.md).
 * Plain fetch against the REST API (no SDK), like the mail adapters. The API host is fixed so a
 * misconfiguration can never send the secret key elsewhere. Tests inject a mocked fetch.
 *
 * Data minimisation: Stripe receives the product name, the amount and our opaque purchase
 * reference — no e-mail, no name, nothing from the folder. Checkout collects payment details itself.
 */
import type { PaymentEventPayload } from "./service";

export const STRIPE_API_BASE = "https://api.stripe.com/v1";
/** Pinned so request and response shapes stay stable; set the webhook endpoint to the same version. */
export const STRIPE_API_VERSION = "2026-10-28.endive";
const CHECKOUT_HOST = "checkout.stripe.com";
/** Stripe's minimum is 30 minutes; short sessions limit parallel open checkouts. */
const SESSION_LIFETIME_SECONDS = 31 * 60;
const TIMEOUT_MS = 10_000;

export class StripeRequestError extends Error {
  constructor(readonly status: number) {
    super(`Stripe request failed (HTTP ${status})`);
  }
}

type Fetch = typeof fetch;

async function stripeRequest<T>(
  secretKey: string,
  method: "GET" | "POST",
  path: string,
  params: Record<string, string>,
  { fetchImpl = fetch, idempotencyKey }: { fetchImpl?: Fetch; idempotencyKey?: string } = {}
): Promise<T> {
  const query = new URLSearchParams(params).toString();
  const url = method === "GET" ? `${STRIPE_API_BASE}${path}?${query}` : `${STRIPE_API_BASE}${path}`;
  const res = await fetchImpl(url, {
    method,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Stripe-Version": STRIPE_API_VERSION,
      ...(method === "POST" ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    body: method === "POST" ? query : undefined,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  // The error body may echo request details; only the status is surfaced (and logged by callers).
  if (!res.ok) throw new StripeRequestError(res.status);
  return (await res.json()) as T;
}

export interface CheckoutRequest {
  purchaseRef: string;
  productName: string;
  amountCents: number;
  currency: string;
  baseUrl: string;
  now?: number;
}

/** Builds the form parameters for POST /v1/checkout/sessions. Exported for tests. */
export function checkoutSessionParams(req: CheckoutRequest): Record<string, string> {
  const ref = encodeURIComponent(req.purchaseRef);
  const now = req.now ?? Math.floor(Date.now() / 1000);
  return {
    mode: "payment",
    locale: "de",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": req.currency.toLowerCase(),
    "line_items[0][price_data][unit_amount]": String(req.amountCents),
    "line_items[0][price_data][product_data][name]": req.productName,
    client_reference_id: req.purchaseRef,
    "metadata[amanah_purchase_ref]": req.purchaseRef,
    "payment_intent_data[metadata][amanah_purchase_ref]": req.purchaseRef,
    expires_at: String(now + SESSION_LIFETIME_SECONDS),
    success_url: `${req.baseUrl}/kasse/ergebnis?ref=${ref}`,
    cancel_url: `${req.baseUrl}/kasse/ergebnis?ref=${ref}&abgebrochen=1`,
  };
}

export async function createCheckoutSession(secretKey: string, req: CheckoutRequest, fetchImpl: Fetch = fetch) {
  const session = await stripeRequest<{ id?: string; url?: string; livemode?: boolean }>(
    secretKey,
    "POST",
    "/checkout/sessions",
    checkoutSessionParams(req),
    { fetchImpl, idempotencyKey: `checkout-${req.purchaseRef}` }
  );
  let host = "";
  try {
    host = new URL(session.url ?? "").host;
  } catch {
    // handled below
  }
  if (session.livemode !== false || host !== CHECKOUT_HOST || !session.id) {
    throw new StripeRequestError(502);
  }
  return { sessionId: session.id, url: session.url! };
}

/** Our purchase reference for a payment intent (refund events only carry the payment intent). */
async function purchaseRefForPaymentIntent(secretKey: string, paymentIntent: string, fetchImpl: Fetch) {
  const list = await stripeRequest<{ data?: { client_reference_id?: string | null }[] }>(
    secretKey,
    "GET",
    "/checkout/sessions",
    { payment_intent: paymentIntent, limit: "1" },
    { fetchImpl }
  );
  return list.data?.[0]?.client_reference_id ?? null;
}

interface StripeEvent {
  id?: string;
  type?: string;
  livemode?: boolean;
  data?: { object?: Record<string, unknown> };
}

export type StripeEventMapping =
  | { kind: "payment"; event: PaymentEventPayload }
  | { kind: "ignored"; reason: string }
  | { kind: "invalid" };

const SESSION_EVENTS: Record<string, PaymentEventPayload["type"]> = {
  "checkout.session.async_payment_succeeded": "payment_succeeded",
  "checkout.session.async_payment_failed": "payment_failed",
  "checkout.session.expired": "payment_failed",
};

/**
 * Maps a verified Stripe event to our provider-neutral payment event. Live events are refused
 * (this code handles test mode only). Unknown types are acknowledged and ignored.
 */
export async function mapStripeEvent(raw: unknown, secretKey: string, fetchImpl: Fetch = fetch): Promise<StripeEventMapping> {
  const event = raw as StripeEvent;
  const object = event?.data?.object;
  if (typeof event?.id !== "string" || typeof event.type !== "string" || !object) return { kind: "invalid" };
  if (event.livemode !== false) return { kind: "invalid" };

  if (event.type.startsWith("checkout.session.")) {
    const ref = object.client_reference_id;
    const amount = object.amount_total;
    const currency = object.currency;
    if (typeof ref !== "string" || !Number.isInteger(amount) || typeof currency !== "string") return { kind: "invalid" };
    let type = SESSION_EVENTS[event.type];
    if (event.type === "checkout.session.completed") {
      // "unpaid" = delayed payment method; the async_payment_* event follows.
      if (object.payment_status !== "paid" && object.payment_status !== "no_payment_required") {
        return { kind: "ignored", reason: "awaiting_async_payment" };
      }
      type = "payment_succeeded";
    }
    if (!type) return { kind: "ignored", reason: "unhandled_event_type" };
    return { kind: "payment", event: { id: event.id, type, providerRef: ref, amountCents: amount as number, currency: currency.toUpperCase() } };
  }

  if (event.type === "charge.refunded") {
    // Only full refunds revoke access; partial refunds are a manual support case.
    if (object.refunded !== true) return { kind: "ignored", reason: "partial_refund" };
    const paymentIntent = object.payment_intent;
    const amount = object.amount;
    const currency = object.currency;
    if (typeof paymentIntent !== "string" || !Number.isInteger(amount) || typeof currency !== "string") return { kind: "invalid" };
    const ref = await purchaseRefForPaymentIntent(secretKey, paymentIntent, fetchImpl);
    if (!ref) return { kind: "ignored", reason: "unknown_payment_intent" };
    return {
      kind: "payment",
      event: { id: event.id, type: "refund_succeeded", providerRef: ref, amountCents: amount as number, currency: currency.toUpperCase() },
    };
  }

  return { kind: "ignored", reason: "unhandled_event_type" };
}
