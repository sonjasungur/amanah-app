import { NextResponse } from "next/server";
import { crossOriginRejected, getAuthenticatedUserId, getServerRepository } from "@/lib/server/auth-utils";
import { isSameOriginRequest } from "@/lib/server/session-cookie";
import { getBillingMode } from "@/lib/billing/config";
import { BillingError, buildSandboxEvent, handleSignedWebhook, type PaymentEventType } from "@/lib/billing/service";

const OUTCOMES: Record<string, PaymentEventType> = {
  succeeded: "payment_succeeded",
  failed: "payment_failed",
  refund: "refund_succeeded",
};

/** Sandbox only: simulates the provider's signed callback for the user's own test purchase. */
export async function POST(request: Request) {
  if (getBillingMode() !== "sandbox") return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isSameOriginRequest(request)) return crossOriginRejected();
  const userId = await getAuthenticatedUserId(request);
  if (!userId) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });

  const { ref, outcome } = (await request.json().catch(() => ({}))) as { ref?: string; outcome?: string };
  const type = outcome ? OUTCOMES[outcome] : undefined;
  const repo = getServerRepository();
  const purchase = ref ? await repo.getPurchaseByRef(ref) : null;
  if (!type || !purchase || purchase.userId !== userId) {
    return NextResponse.json({ error: "Testkauf nicht gefunden." }, { status: 404 });
  }
  const { rawBody, signature } = buildSandboxEvent(purchase, type);
  try {
    const result = await handleSignedWebhook(repo, rawBody, signature);
    return NextResponse.json({ ...result, status: (await repo.getPurchaseByRef(purchase.providerRef))?.status });
  } catch (e) {
    if (e instanceof BillingError) return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }
}
