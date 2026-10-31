import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { CHECK_LABELS } from "@/lib/design-tokens";
import { isPublicRegistrationEnabled } from "@/lib/auth/public-registration";
import { PageHeader, PricingCard } from "@/components/marketing/marketing-ui";
import { linkButtonClassName } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Disclaimer } from "@/components/ui/disclaimer";
import { featuresByTier } from "@/lib/billing/plan-matrix";
import { formatPrice, getTestPriceCents } from "@/lib/billing/products";

export const metadata = {
  title: `Preise — ${BRAND.name}`,
  description: "Kostenlos starten mit Vorsorge-Check und Wissen. Vorsorge Plus als Einmalkauf in Vorbereitung — Mein Wille.",
};

/** Derived from the plan matrix and catalog, so the page cannot drift from what the code enforces. */
const PLUS_PRICE = formatPrice(getTestPriceCents());
const FREE_FEATURES = featuresByTier("free").map((f) => f.title);
const PLUS_FEATURES = featuresByTier("plus").map((f) => f.title);

export default function PreisePage() {
  const showRegister = isPublicRegistrationEnabled();

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 md:py-14 pb-16">
      <PageHeader
        eyebrow="Transparent & fair"
        title="Preise"
        description="Einmalzahlung geplant — kein Abo. Der kostenlose Check braucht kein Konto."
      />

      <div className="rounded-xl border border-border bg-accent-soft p-5 mb-12 text-body text-muted">
        Vorsorge Plus ist in Vorbereitung. Kauf ist noch nicht möglich. Der kostenlose {CHECK_LABELS.nav} ist bereits verfügbar — ohne KI und ohne Serverkonto.
      </div>

      <section className="mb-16">
        <h2 className="text-section-title font-bold text-foreground mb-6">Kostenlos starten</h2>
        <Card className="border-2 border-emerald/40 bg-card p-8 md:p-10 max-w-2xl shadow-sm">
          <div className="inline-block px-3 py-1 rounded-full bg-emerald/15 text-emerald text-xs font-bold uppercase tracking-wide mb-4">
            Kostenlos
          </div>
          <h3 className="text-3xl md:text-4xl font-bold text-foreground">{CHECK_LABELS.freeCard}</h3>
          <ul className="mt-6 space-y-3 text-body text-muted">
            <li className="flex gap-2"><span className="text-emerald font-bold">✓</span> Persönlicher Vorsorge-Check</li>
            <li className="flex gap-2"><span className="text-emerald font-bold">✓</span> Überblick über offene Bereiche</li>
            <li className="flex gap-2"><span className="text-emerald font-bold">✓</span> Wissensartikel mit sichtbarem Prüfstatus</li>
            <li className="flex gap-2"><span className="text-emerald font-bold">✓</span> Genau eine Empfehlung für den nächsten Schritt</li>
          </ul>
          <Link href="/check" className={linkButtonClassName({ size: "lg", className: "inline-block mt-8" })}>
            {BRAND.ctaPrimary}
          </Link>
        </Card>
      </section>

      <section className="mb-16">
        <h2 className="text-section-title font-bold text-foreground mb-8">Deine vollständige Vorsorge</h2>
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
          <PricingCard
            name="Kostenlos"
            price="0 €"
            description="Dauerhaft frei, ohne Paket."
            features={FREE_FEATURES}
          />
          <PricingCard
            name="Vorsorge Plus"
            price={PLUS_PRICE}
            description="Einmalzahlung, kein Abo. Alles aus „Kostenlos“ und dazu:"
            features={PLUS_FEATURES}
            highlighted
            statusNote="In Vorbereitung"
          />
        </div>
        <ul className="mt-8 space-y-2 text-body text-muted max-w-3xl">
          <li>Das islamische Wissenszentrum bleibt immer kostenlos und ist nie Teil eines Pakets.</li>
          <li>Bestehende Konten behalten die Funktionen, die vor der Einführung von Vorsorge Plus verfügbar waren. Später neu hinzukommende Plus-Funktionen sind davon nicht automatisch umfasst.</li>
          <li>Deine Daten kannst du jederzeit exportieren und löschen, auch ohne Vorsorge Plus.</li>
        </ul>
      </section>

      <Disclaimer />
      <section className="mt-12 rounded-2xl border-2 border-emerald/30 bg-accent-soft p-6 md:p-8">
        <h2 className="text-section-title font-bold text-foreground mb-3">Bereit für deine Vorsorge?</h2>
        <p className="text-body text-muted mb-6 max-w-2xl">
          Starte kostenlos mit dem Amanah-Check. Ein Konto ist dafür nicht nötig.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/check" className={linkButtonClassName({ size: "lg", className: "w-full sm:w-auto font-bold" })}>
            {BRAND.ctaPrimary}
          </Link>
          {showRegister && (
            <Link href="/register" className={linkButtonClassName({ variant: "outline", size: "lg", className: "w-full sm:w-auto" })}>
              Konto erstellen — Vorsorge beginnen
            </Link>
          )}
          <Link href="/login" className={linkButtonClassName({ variant: "outline", size: "lg", className: "w-full sm:w-auto" })}>
            Anmelden
          </Link>
        </div>
      </section>
    </div>
  );
}
