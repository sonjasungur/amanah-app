import { NextResponse } from "next/server";
import { getServerRepository } from "@/lib/server/auth-utils";
import { getBillingMode } from "@/lib/billing/config";
import { BillingError, SIGNATURE_HEADER, STRIPE_SIGNATURE_HEADER, handleSignedWebhook, handleStripeWebhook } from "@/lib/billing/service";

/** Provider callback. No session, no CSRF check — authenticity comes from the signature. */
export async function POST(request: Request) {
  const mode = getBillingMode();
  if (mode === "disabled") return NextResponse.json({ error: "Not found" }, { status: 404 });
  const rawBody = await request.text();
  try {
    const outcome =
      mode === "stripe_test"
        ? await handleStripeWebhook(getServerRepository(), rawBody, request.headers.get(STRIPE_SIGNATURE_HEADER))
        : await handleSignedWebhook(getServerRepository(), rawBody, request.headers.get(SIGNATURE_HEADER));
    return NextResponse.json({ received: true, ...outcome });
  } catch (e) {
    if (e instanceof BillingError) return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }
}
