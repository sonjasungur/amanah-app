"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function SandboxCheckout() {
  const ref = useSearchParams().get("ref") ?? "";
  const [result, setResult] = useState("");

  const complete = async (outcome: "succeeded" | "failed") => {
    const res = await fetch("/api/billing/sandbox/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ref, outcome }),
    });
    const body = await res.json();
    setResult(res.ok ? `Status: ${body.status}` : body.error ?? "Fehler");
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <Card>
        <p className="mb-4 rounded-lg border-2 border-warning bg-warning/10 p-3 font-bold text-sm" role="note">
          TESTMODUS – es findet keine echte Zahlung statt.
        </p>
        <CardTitle>Sandbox-Kasse</CardTitle>
        <p className="text-sm text-muted mt-2 mb-6 break-all">Testkauf {ref}</p>
        <div className="flex flex-col gap-3">
          <Button type="button" onClick={() => void complete("succeeded")} data-testid="sandbox-pay-success">Testzahlung erfolgreich</Button>
          <Button type="button" variant="outline" onClick={() => void complete("failed")} data-testid="sandbox-pay-fail">Testzahlung fehlgeschlagen</Button>
        </div>
        {result && <p className="mt-4 text-sm" role="status" data-testid="sandbox-result">{result}</p>}
        <Link href="/dashboard/einstellungen" className="mt-6 inline-block text-sm text-primary hover:underline">Zurück zu meinem Konto</Link>
      </Card>
    </div>
  );
}

export default function SandboxCheckoutPage() {
  return (
    <Suspense>
      <SandboxCheckout />
    </Suspense>
  );
}
