"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { featureForRoute } from "@/lib/billing/plan-matrix";
import { formatPrice, getTestPriceCents } from "@/lib/billing/products";

/**
 * Hint on every dashboard area that the plan matrix assigns to Vorsorge Plus. Informational only:
 * it locks nothing and has no buy button (enforcement stays off until the owner approves it).
 */
export function PlusAreaNotice() {
  const feature = featureForRoute(usePathname() ?? "");
  if (!feature || feature.tier !== "plus") return null;
  return (
    <aside
      className="mb-6 rounded-xl border border-border bg-accent-soft p-4 text-sm"
      data-testid="plus-area-notice"
      data-feature={feature.id}
      aria-label="Hinweis zu Vorsorge Plus"
    >
      <p className="font-semibold text-foreground">
        Dieser Bereich gehört künftig zu Vorsorge Plus ({formatPrice(getTestPriceCents())} einmalig, kein Abo).
      </p>
      <p className="text-muted mt-1">
        Vorsorge Plus ist in Vorbereitung. Du kannst diesen Bereich derzeit ohne Einschränkung nutzen. Funktionen, die
        dein Konto schon vor der Einführung von Vorsorge Plus nutzen konnte, bleiben dir erhalten.
      </p>
      <Link href="/preise" className="mt-2 inline-block text-primary font-semibold hover:underline">
        Was gehört zu Vorsorge Plus?
      </Link>
    </aside>
  );
}
