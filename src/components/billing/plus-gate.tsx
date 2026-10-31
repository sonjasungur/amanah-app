"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatPrice, getTestPriceCents } from "@/lib/billing/products";

interface BillingStatus {
  enforced: boolean;
  entitlements: string[];
  plusAccess?: { allowed: boolean };
  plusAccessByFeature?: Record<string, { allowed: boolean }>;
}

async function fetchBillingStatus(): Promise<BillingStatus> {
  try {
    const res = await fetch("/api/billing/status");
    if (!res.ok) return { enforced: false, entitlements: [] };
    return (await res.json()) as BillingStatus;
  } catch {
    return { enforced: false, entitlements: [] };
  }
}

/**
 * Shows `children` unless billing is enforced and the user has no Plus access.
 * Enforcement is off by default (AMANAH_BILLING_ENFORCE), so nothing is locked today;
 * accounts from before the Plus launch keep access (plus-access.ts).
 * Never used for knowledge content.
 */
export function PlusGate({ feature, children }: { feature: string; children: React.ReactNode }) {
  const [status, setStatus] = useState<BillingStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchBillingStatus().then((s) => {
      if (!cancelled) setStatus(s);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const allowed = status?.plusAccessByFeature?.[feature]?.allowed ?? status?.plusAccess?.allowed;
  if (!status || !status.enforced || allowed || status.entitlements.includes("vorsorge_plus")) return children;
  return (
    <div className="rounded-xl border border-border bg-accent-soft p-4 text-sm" data-testid={`plus-gate-${feature}`}>
      <p className="font-semibold mb-1">Teil von Vorsorge Plus ({formatPrice(getTestPriceCents())} einmalig)</p>
      <p className="text-muted mb-2">Alle kostenlosen Bereiche, dein Datenexport und das Löschen bleiben immer nutzbar.</p>
      <Link href="/dashboard/einstellungen" className="text-primary font-semibold hover:underline">Paket ansehen</Link>
    </div>
  );
}
