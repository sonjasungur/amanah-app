import { NextResponse } from "next/server";
import { getServerRepository } from "@/lib/server/auth-utils";
import { getBillingMode } from "@/lib/billing/config";
import { BillingError, SIGNATURE_HEADER, handleSignedWebhook } from "@/lib/billing/service";

/** Provider callback. No session, no CSRF check — authenticity comes from the signature. */
export async function POST(request: Request) {
  if (getBillingMode() === "disabled") return NextResponse.json({ error: "Not found" }, { status: 404 });
  const rawBody = await request.text();
  try {
    const outcome = await handleSignedWebhook(getServerRepository(), rawBody, request.headers.get(SIGNATURE_HEADER));
    return NextResponse.json({ received: true, ...outcome });
  } catch (e) {
    if (e instanceof BillingError) return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }
}
