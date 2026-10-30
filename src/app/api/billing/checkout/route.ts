import { NextResponse } from "next/server";
import { crossOriginRejected, getAuthenticatedUserId, getServerRepository } from "@/lib/server/auth-utils";
import { isSameOriginRequest } from "@/lib/server/session-cookie";
import { BillingError, startCheckout } from "@/lib/billing/service";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return crossOriginRejected();
  const userId = await getAuthenticatedUserId(request);
  if (!userId) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  const { productId } = (await request.json().catch(() => ({}))) as { productId?: string };
  try {
    return NextResponse.json(await startCheckout(getServerRepository(), userId, productId ?? ""), { status: 201 });
  } catch (e) {
    if (e instanceof BillingError) return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }
}
