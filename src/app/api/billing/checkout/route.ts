import { NextResponse } from "next/server";
import { crossOriginRejected, getAuthenticatedUserId, getServerRepository } from "@/lib/server/auth-utils";
import { isSameOriginRequest } from "@/lib/server/session-cookie";
import { BillingError, startCheckout } from "@/lib/billing/service";
import { emailVerificationInfo, mayPurchase, VERIFICATION_REQUIRED_RESPONSE } from "@/lib/server/email-verification";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return crossOriginRejected();
  const userId = await getAuthenticatedUserId(request);
  if (!userId) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  const repo = getServerRepository();
  const user = await repo.getUserById(userId);
  if (!user || !mayPurchase(emailVerificationInfo(user))) {
    return NextResponse.json(VERIFICATION_REQUIRED_RESPONSE, { status: 403 });
  }
  const { productId } = (await request.json().catch(() => ({}))) as { productId?: string };
  try {
    return NextResponse.json(await startCheckout(repo, userId, productId ?? ""), { status: 201 });
  } catch (e) {
    if (e instanceof BillingError) return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }
}
