import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { isPublicRegistrationEnabled } from "@/lib/auth/public-registration";
import { PageHeader } from "@/components/marketing/marketing-ui";
import { linkButtonClassName } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Disclaimer } from "@/components/ui/disclaimer";
import { START_ALWAYS_FREE, START_BASIS, START_PLUS_PLANNED, START_PLUS_STATUS } from "@/lib/billing/start-offer";

export const metadata = {
  title: `Pakete — ${BRAND.name}`,
  description: "Wasiyya startet kostenlos: Vorsorge-Check, Notfallkarte und Vermögensübersicht. Vorsorge Plus ist in Vorbereitung.",
};

/**
 * Start version (owner order 23.11.2026, staging draft): Basis free, Vorsorge Plus in preparation.
 * No price and no purchase button until the owner releases price, terms and payment.
 */
const FAQ: readonly { q: string; a: string }[] = [
  {
    q: "Muss ich etwas bezahlen, um anzufangen?",
    a: "Nein. Vorsorge-Check, Notfallkarte und Vermögensübersicht sind kostenlos. Für den Check brauchst du kein Konto.",
  },
  {
    q: "Was passiert mit meinen Angaben, wenn Vorsorge Plus kommt?",
    a: "Was du gespeichert hast, bleibt lesbar. Export und Löschen bleiben immer kostenlos. Bestehende Konten behalten die Funktionen, die vor der Einführung von Vorsorge Plus verfügbar waren.",
  },
  {
    q: "Erstellt Wasiyya ein Testament?",
    a: "Nein. Wasiyya hilft dir, Wünsche und Unterlagen zu ordnen. Ein Testament und die Berechnung von Erbanteilen gehören zu Anwalt, Notar und islamischer Fachperson.",
  },
];

export default function PreisePage() {
  const showRegister = isPublicRegistrationEnabled();

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 md:py-14 pb-16" data-testid="pricing-start">
      <PageHeader
        eyebrow="Pakete"
        title="Was Wasiyya kostet"
        description="Wasiyya startet kostenlos. Du brauchst für den Vorsorge-Check kein Konto, und es gibt kein Abo."
      />

      <div className="grid gap-6 md:grid-cols-2 max-w-5xl">
        <Card className="border-2 border-emerald/40 bg-card p-7 md:p-8 shadow-sm" data-testid="pricing-basis">
          <p className="inline-block px-3 py-1 rounded-full bg-emerald/15 text-emerald text-xs font-bold uppercase tracking-wide">Kostenlos</p>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-3">Basis</h2>
          <p className="text-body text-muted mt-1">Für alle, die jetzt beginnen wollen.</p>
          <ul className="mt-6 space-y-4">
            {START_BASIS.map((item) => (
              <li key={item.title} className="flex gap-3">
                <span className="text-emerald font-bold mt-0.5" aria-hidden>✓</span>
                <span>
                  <span className="font-semibold text-foreground">{item.title}</span>
                  <span className="block text-sm text-muted">{item.text}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-muted border-t border-border pt-4">{START_ALWAYS_FREE}</p>
          <Link href="/check" className={linkButtonClassName({ size: "lg", className: "inline-block mt-6" })}>
            {BRAND.ctaPrimary}
          </Link>
        </Card>

        <Card className="border-2 border-dashed border-border bg-card p-7 md:p-8" data-testid="pricing-plus">
          <p className="inline-block px-3 py-1 rounded-full bg-accent-soft text-primary text-xs font-bold uppercase tracking-wide">In Vorbereitung</p>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-3">Vorsorge Plus</h2>
          <p className="text-body text-muted mt-1">Für alle, die ihre Vorsorge vollständig an einem Ort festhalten wollen. Geplant sind:</p>
          <ul className="mt-6 space-y-3 text-body text-muted">
            {START_PLUS_PLANNED.map((t) => (
              <li key={t} className="flex gap-3">
                <span aria-hidden>•</span>
                {t}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-foreground border-t border-border pt-4" data-testid="pricing-plus-status">
            {START_PLUS_STATUS}
          </p>
        </Card>
      </div>

      <section className="mt-14 max-w-3xl" aria-labelledby="pricing-faq">
        <h2 id="pricing-faq" className="text-section-title font-bold text-foreground mb-5">Häufige Fragen</h2>
        <dl className="space-y-5">
          {FAQ.map((f) => (
            <div key={f.q}>
              <dt className="font-semibold text-foreground">{f.q}</dt>
              <dd className="text-body text-muted mt-1">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="mt-12">
        <Disclaimer />
      </div>
      <section className="mt-12 rounded-2xl border-2 border-emerald/30 bg-accent-soft p-6 md:p-8">
        <h2 className="text-section-title font-bold text-foreground mb-3">Bereit für deine Vorsorge?</h2>
        <p className="text-body text-muted mb-6 max-w-2xl">
          Starte kostenlos mit dem Vorsorge-Check. Ein Konto ist dafür nicht nötig.
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
