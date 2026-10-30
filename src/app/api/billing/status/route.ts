import { NextResponse } from "next/server";
import { getAuthenticatedUserId, getServerRepository } from "@/lib/server/auth-utils";
import { getBillingMode, isBillingEnforced } from "@/lib/billing/config";
import { getProducts } from "@/lib/billing/products";

export async function GET(request: Request) {
  const userId = await getAuthenticatedUserId(request);
  const purchases = userId ? await getServerRepository().listPurchases(userId) : [];
  return NextResponse.json({
    mode: getBillingMode(),
    enforced: isBillingEnforced(),
    products: getProducts(),
    purchases: purchases.map((p) => ({
      productId: p.productId,
      providerRef: p.providerRef,
      status: p.status,
      amountCents: p.amountCents,
      currency: p.currency,
      createdAt: p.createdAt,
    })),
    entitlements: [...new Set(purchases.filter((p) => p.status === "paid").map((p) => p.productId))],
  });
}
