"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatPrice, type Product } from "@/lib/billing/products";

interface Purchase {
  productId: string;
  providerRef: string;
  status: string;
  amountCents: number;
  createdAt: string;
}

interface Status {
  mode: "disabled" | "sandbox";
  products: Product[];
  purchases: Purchase[];
  entitlements: string[];
}

const STATUS_LABELS: Record<string, string> = { pending: "offen", paid: "freigeschaltet (Test)", failed: "fehlgeschlagen", refunded: "erstattet" };

async function fetchStatus(): Promise<Status | null> {
  const res = await fetch("/api/billing/status");
  return res.ok ? ((await res.json()) as Status) : null;
}

/** "Mein Paket": product status and, in sandbox mode only, a test purchase. */
export function BillingControls() {
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void fetchStatus().then(setStatus);
  }, []);

  if (!status) return null;
  const plus = status.products.find((p) => p.id === "vorsorge_plus");
  const hasPlus = status.entitlements.includes("vorsorge_plus");

  const buy = async () => {
    setError("");
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: "vorsorge_plus" }),
    });
    const body = await res.json();
    if (!res.ok) return setError(body.error ?? "Nicht möglich.");
    window.location.href = body.checkoutUrl;
  };

  return (
    <div className="space-y-3 text-sm" data-testid="billing-controls">
      <p>
        <span className="font-semibold">Vorsorge Plus:</span> {hasPlus ? "freigeschaltet (Test)" : "nicht gebucht"}
        {plus?.testPriceCents ? ` · Testpreis ${formatPrice(plus.testPriceCents)} einmalig` : ""}
      </p>
      {status.mode === "disabled" && <p className="text-muted">Buchung ist noch nicht möglich. Es werden keine Zahlungen verarbeitet.</p>}
      {status.mode === "sandbox" && !hasPlus && (
        <Button type="button" size="sm" variant="outline" onClick={() => void buy()} data-testid="billing-buy-sandbox">
          Vorsorge Plus testen (Sandbox, keine echte Zahlung)
        </Button>
      )}
      {error && <p className="text-destructive" role="alert">{error}</p>}
      {status.purchases.length > 0 && (
        <ul className="text-xs text-muted space-y-1">
          {status.purchases.map((p) => (
            <li key={p.providerRef}>
              {new Date(p.createdAt).toLocaleDateString("de-DE")} · {formatPrice(p.amountCents)} · {STATUS_LABELS[p.status] ?? p.status} ·{" "}
              <a href={`/api/billing/receipt/${encodeURIComponent(p.providerRef)}`} className="underline" target="_blank" rel="noopener noreferrer">
                Testbeleg
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
