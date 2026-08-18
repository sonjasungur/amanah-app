import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { CHECK_LABELS } from "@/lib/design-tokens";
import { isPublicRegistrationEnabled } from "@/lib/auth/public-registration";
import { PageHeader, PricingCard } from "@/components/marketing/marketing-ui";
import { linkButtonClassName } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Disclaimer } from "@/components/ui/disclaimer";
import { ChevronDown } from "lucide-react";

export const metadata = {
  title: `Preise — ${BRAND.name}`,
  description: "Kostenlos starten mit Vorsorge-Check und Wissen. Vollständige Vorsorgepakete in Vorbereitung — Mein Wille.",
};

const MAIN_PACKAGES = [
  {
    id: "basic",
    name: "Basic",
    price: "29 €",
    description: "Für Menschen, die die wichtigsten Wünsche dokumentieren möchten.",
    features: ["Notfallkarte", "Janazah-Wünsche", "Familienbrief", "PDF-Export"],
    highlighted: false,
  },
  {
    id: "komplett",
    name: "Komplett",
    price: "79 €",
    description: "Für Menschen, die alle Bereiche strukturiert vorbereiten möchten.",
    features: [
      "Alle Vorsorgebereiche",
      "Vollständiger PDF-Ordner",
      "JSON-Export",
      "Erb- und Vollständigkeitscheck",
      "Schulden- und Nachlassübersicht",
    ],
    highlighted: true,
  },
  {
    id: "familie",
    name: "Familie",
    price: "99 €",
    description: "Maximal zwei Erwachsenenprofile. Kein unbegrenzter Support, kein 24/7-Zugang, keine unbegrenzte KI.",
    features: [
      "Zwei Erwachsenenprofile",
      "Gemeinsame Notfallübersicht",
      "Familienbrief",
      "Gemeinsame Vertrauenspersonen",
      "Inhalte aus dem Komplett-Paket",
    ],
    highlighted: false,
  },
];

const COMPARE_ROWS = [
  { label: "Notfallkarte", basic: true, komplett: true, familie: true },
  { label: "Alle Vorsorgebereiche", basic: false, komplett: true, familie: true },
  { label: "PDF-Ordner", basic: "Basis", komplett: "Vollständig", familie: "Vollständig" },
  { label: "Zwei Erwachsenenprofile", basic: false, komplett: false, familie: true },
  { label: "JSON-Export", basic: false, komplett: true, familie: true },
];

function CompareCell({ value }: { value: boolean | string }) {
  if (value === true) return <span className="text-emerald font-bold">✓</span>;
  if (value === false) return <span className="text-muted">—</span>;
  return <span className="text-base text-muted">{value}</span>;
}

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
        Bezahlte Pakete sind in Vorbereitung. Kauf ist noch nicht möglich. Der kostenlose {CHECK_LABELS.nav} ist bereits verfügbar — ohne KI und ohne Serverkonto.
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
        <div className="grid lg:grid-cols-3 gap-6">
          {MAIN_PACKAGES.map((pkg) => (
            <PricingCard key={pkg.id} {...pkg} statusNote="In Vorbereitung" />
          ))}
        </div>

        <div className="hidden md:block mt-12 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-base">
            <thead className="bg-accent-soft">
              <tr>
                <th className="text-left p-4 font-bold text-foreground">Funktion</th>
                <th className="p-4 font-bold text-foreground">Basic</th>
                <th className="p-4 font-bold text-primary">Komplett</th>
                <th className="p-4 font-bold text-foreground">Familie</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((row) => (
                <tr key={row.label} className="border-t border-border">
                  <td className="p-4 text-muted">{row.label}</td>
                  <td className="p-4 text-center"><CompareCell value={row.basic} /></td>
                  <td className="p-4 text-center bg-emerald/5"><CompareCell value={row.komplett} /></td>
                  <td className="p-4 text-center"><CompareCell value={row.familie} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="md:hidden mt-10 space-y-4">
          {MAIN_PACKAGES.map((pkg) => (
            <details key={pkg.id} className="rounded-2xl border border-border bg-card p-5">
              <summary className="font-bold text-foreground cursor-pointer min-h-[44px] flex items-center justify-between text-lg">
                {pkg.name} — {pkg.price}
                <ChevronDown size={20} className="text-muted" />
              </summary>
              <ul className="mt-4 space-y-2 text-body text-muted">
                {pkg.features.map((f) => (
                  <li key={f}>✓ {f}</li>
                ))}
              </ul>
              <p className="text-sm font-semibold text-muted mt-4">In Vorbereitung</p>
            </details>
          ))}
        </div>
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
