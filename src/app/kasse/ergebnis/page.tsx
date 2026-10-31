"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardTitle } from "@/components/ui/card";

const STATUS_TEXT: Record<string, string> = {
  pending: "Die Zahlung wird noch bestätigt …",
  paid: "Vorsorge Plus ist freigeschaltet (Test).",
  failed: "Die Testzahlung ist fehlgeschlagen oder abgelaufen. Es wurde nichts abgebucht.",
  refunded: "Die Testzahlung wurde erstattet.",
};

/**
 * Return page after the Stripe test checkout. The status comes only from our server, which learns
 * it from the signed webhook — never from the redirect itself (that URL could be opened by anyone).
 */
function CheckoutResult() {
  const params = useSearchParams();
  const ref = params.get("ref") ?? "";
  const cancelled = params.get("abgebrochen") === "1";
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const poll = async () => {
      const res = await fetch("/api/billing/status");
      if (!res.ok) return setStatus("unknown");
      const body = (await res.json()) as { purchases: { providerRef: string; status: string }[] };
      const current = body.purchases.find((p) => p.providerRef === ref)?.status ?? "unknown";
      setStatus(current);
      // The webhook usually arrives within seconds; stop after about a minute.
      if (current === "pending" && !cancelled && ++attempts < 20) timer = setTimeout(() => void poll(), 3000);
    };
    void poll();
    return () => clearTimeout(timer);
  }, [ref, cancelled]);

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <Card>
        <p className="mb-4 rounded-lg border-2 border-warning bg-warning/10 p-3 font-bold text-sm" role="note">
          TESTMODUS – es findet keine echte Zahlung statt.
        </p>
        <CardTitle>{cancelled ? "Bezahlung abgebrochen" : "Ergebnis der Testzahlung"}</CardTitle>
        <p className="text-sm mt-4" role="status" data-testid="checkout-result">
          {cancelled
            ? "Du hast die Testkasse verlassen. Es wurde nichts abgebucht."
            : status === null
              ? "Status wird geladen …"
              : (STATUS_TEXT[status] ?? "Dieser Kauf wurde nicht gefunden.")}
        </p>
        <Link href="/dashboard/einstellungen" className="mt-6 inline-block text-sm text-primary hover:underline">Zurück zu meinem Konto</Link>
      </Card>
    </div>
  );
}

export default function CheckoutResultPage() {
  return (
    <Suspense>
      <CheckoutResult />
    </Suspense>
  );
}
