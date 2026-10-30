import { getProducts, type ProductId } from "./products";
import { getBillingMode, getSandboxWebhookSecret } from "./config";
import { signPayload, verifySignature } from "./signature";
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

export async function startCheckout(repo: ServerRepository, userId: string, productId: string) {
  if (getBillingMode() !== "sandbox") throw new BillingError("Bezahlung ist derzeit nicht verfügbar.", 503);
  const product = getProducts().find((p) => p.id === productId);
  if (!product || !product.available || product.testPriceCents === null) throw new BillingError("Produkt nicht buchbar.", 400);
  if (await hasEntitlement(repo, userId, product.id)) throw new BillingError("Dieses Paket ist bereits freigeschaltet.", 409);

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

export async function processPaymentEvent(repo: ServerRepository, event: PaymentEventPayload) {
  const purchase = await repo.getPurchaseByRef(event.providerRef);
  if (!purchase) return { result: "unknown_purchase" as const };
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
