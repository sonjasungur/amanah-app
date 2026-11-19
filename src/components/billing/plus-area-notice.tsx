"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { featureForRoute } from "@/lib/billing/plan-matrix";

/**
 * Hint on every dashboard area that the plan matrix assigns to Vorsorge Plus. Informational only:
 * it locks nothing and has no buy button (enforcement stays off until the owner approves it).
 */
export function PlusAreaNotice() {
  const feature = featureForRoute(usePathname() ?? "");
  if (!feature || feature.tier !== "plus") return null;
  return (
    <aside
      className="no-print mb-4 text-xs text-muted"
      data-testid="plus-area-notice"
      data-feature={feature.id}
      aria-label="Hinweis zu Vorsorge Plus"
    >
      {/* No price while the package cannot be bought; the price page states it. */}
      Diesen Bereich nutzt du derzeit ohne Einschränkung. Er gehört später zum Paket Vorsorge Plus;{" "}
      <Link href="/preise" className="text-primary hover:underline">
        mehr dazu
      </Link>
      .
    </aside>
  );
}
