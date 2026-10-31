import { NextResponse } from "next/server";
import { getAuthenticatedUserId, getServerRepository } from "@/lib/server/auth-utils";
import { formatPrice, getProducts } from "@/lib/billing/products";

const STATUS: Record<string, string> = { pending: "offen", paid: "bezahlt (Test)", failed: "fehlgeschlagen", refunded: "erstattet" };

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** Test receipt for sandbox and Stripe test-mode purchases — explicitly not an invoice, no customer data. */
export async function GET(request: Request, { params }: { params: Promise<{ ref: string }> }) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  const { ref } = await params;
  const purchase = await getServerRepository().getPurchaseByRef(ref);
  if (!purchase || purchase.userId !== userId) return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });

  const product = getProducts().find((p) => p.id === purchase.productId);
  const html = `<!doctype html><html lang="de"><meta charset="utf-8"><title>Testbeleg</title>
<body style="font-family:sans-serif;max-width:40rem;margin:2rem auto">
<p style="border:2px solid #b45309;padding:.5rem;font-weight:bold">TESTBELEG – keine Rechnung, keine echte Zahlung (Testmodus)</p>
<h1>Mein Wille</h1>
<p>Produkt: ${escapeHtml(product?.name ?? purchase.productId)}</p>
<p>Betrag: ${formatPrice(purchase.amountCents)} (${escapeHtml(purchase.currency)})</p>
<p>Status: ${STATUS[purchase.status] ?? escapeHtml(purchase.status)}</p>
<p>Datum: ${new Date(purchase.createdAt).toLocaleString("de-DE")}</p>
<p>Referenz: ${escapeHtml(purchase.providerRef)}</p>
<p style="color:#555">Rechnungsangaben (Anbieter, Steuer, Widerrufsbelehrung) sind noch nicht festgelegt und werden erst nach rechtlicher und steuerlicher Klärung ergänzt.</p>
</body></html>`;
  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}
