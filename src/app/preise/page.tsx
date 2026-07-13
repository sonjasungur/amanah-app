import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { PageHeader, PricingCard } from "@/components/marketing/marketing-ui";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Disclaimer } from "@/components/ui/disclaimer";
import { ChevronDown } from "lucide-react";

export const metadata = {
  title: `Preise — ${BRAND.name}`,
  description: "Kostenlos starten mit Amanah-Check und Wissen. Vollständige Vorsorgepakete in Vorbereitung — Mein Wille.",
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
      "Alle Vorsorgemodule",
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
    description: "Für Ehepaare oder zwei verbundene Profile.",
    features: [
      "Zwei Profile",
      "Gemeinsame Notfallübersicht",
      "Familienbrief",
      "Gemeinsame Vertrauenspersonen",
      "Inhalte aus dem Komplett-Paket",
    ],
    highlighted: false,
  },
];

const TOPIC_PACKAGES = [
  { name: "Testament-Vorbereitungsreport", price: "49 €", features: ["Ampelcheck", "Fragen für Imam/Notar", "Waṣiyya-Übersicht"] },
  { name: "Barzakh- & Sadaqa-Jariya-Plan", price: "29 €", features: ["Barzakh-Plan", "Sadaqa Jariya", "Projektverknüpfung (geplant)"] },
];

const COMPARE_ROWS = [
  { label: "Notfallkarte", basic: true, komplett: true, familie: true },
  { label: "Alle Module", basic: false, komplett: true, familie: true },
  { label: "PDF-Ordner", basic: "Basis", komplett: "Vollständig", familie: "Vollständig" },
  { label: "Zwei Profile", basic: false, komplett: false, familie: true },
  { label: "JSON-Export", basic: false, komplett: true, familie: true },
];

function CompareCell({ value }: { value: boolean | string }) {
  if (value === true) return <span className="text-success">✓</span>;
  if (value === false) return <span className="text-muted">—</span>;
  return <span className="text-sm text-muted">{value}</span>;
}

export default function PreisePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10 pb-16">
      <PageHeader
        eyebrow="Transparent & fair"
        title="Preise"
        description="Einmalzahlung geplant — kein Abo. Der kostenlose Amanah-Check ist bereits verfügbar."
      />

      <div className="rounded-xl border border-warning/40 bg-warning/5 p-4 mb-10 text-base text-muted">
        Die kostenpflichtigen Pakete befinden sich in Vorbereitung. Der kostenlose Amanah-Check ist bereits verfügbar.
      </div>

      {/* Kostenlos */}
      <section className="mb-14">
        <h2 className="text-xl font-bold text-primary mb-4">Kostenlos starten</h2>
        <Card className="border-success/30 bg-success/5 p-6 max-w-xl">
          <h3 className="text-2xl font-bold text-primary">Amanah-Check — 0 €</h3>
          <ul className="mt-4 space-y-2 text-base text-muted">
            <li>✓ Persönlicher Vorsorge-Check</li>
            <li>✓ Überblick über offene Bereiche</li>
            <li>✓ Wissensartikel</li>
            <li>✓ Empfehlung für den nächsten Schritt</li>
          </ul>
          <Link href="/check" className="inline-block mt-6">
            <Button size="lg">Kostenlosen Check starten</Button>
          </Link>
        </Card>
      </section>

      {/* Hauptpakete */}
      <section className="mb-14">
        <h2 className="text-xl font-bold text-primary mb-6">Deine vollständige Vorsorge</h2>
        <div className="grid lg:grid-cols-3 gap-5">
          {MAIN_PACKAGES.map((pkg) => (
            <PricingCard key={pkg.id} {...pkg} disabled />
          ))}
        </div>

        {/* Desktop Vergleich */}
        <div className="hidden md:block mt-10 overflow-x-auto">
          <table className="w-full text-base border border-border rounded-xl overflow-hidden">
            <thead className="bg-background">
              <tr>
                <th className="text-left p-3 font-semibold text-primary">Funktion</th>
                <th className="p-3 font-semibold text-primary">Basic</th>
                <th className="p-3 font-semibold text-primary">Komplett</th>
                <th className="p-3 font-semibold text-primary">Familie</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((row) => (
                <tr key={row.label} className="border-t border-border">
                  <td className="p-3 text-muted">{row.label}</td>
                  <td className="p-3 text-center"><CompareCell value={row.basic} /></td>
                  <td className="p-3 text-center"><CompareCell value={row.komplett} /></td>
                  <td className="p-3 text-center"><CompareCell value={row.familie} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Vergleich */}
        <div className="md:hidden mt-8 space-y-3">
          {MAIN_PACKAGES.map((pkg) => (
            <details key={pkg.id} className="rounded-xl border border-border bg-card p-4">
              <summary className="font-semibold text-primary cursor-pointer min-h-[44px] flex items-center justify-between">
                {pkg.name} — {pkg.price}
                <ChevronDown size={18} className="text-muted" />
              </summary>
              <ul className="mt-3 space-y-1 text-base text-muted">
                {pkg.features.map((f) => (
                  <li key={f}>✓ {f}</li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      </section>

      {/* Themenpakete */}
      <section className="mb-10">
        <details className="rounded-xl border border-border bg-card p-4">
          <summary className="font-semibold text-primary cursor-pointer min-h-[44px]">Weitere Einzelpakete</summary>
          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            {TOPIC_PACKAGES.map((pkg) => (
              <div key={pkg.name} className="rounded-lg border border-border p-4">
                <h4 className="font-bold text-primary">{pkg.name}</h4>
                <p className="text-xl font-bold text-primary my-1">{pkg.price}</p>
                <ul className="text-base text-muted space-y-1">
                  {pkg.features.map((f) => (
                    <li key={f}>✓ {f}</li>
                  ))}
                </ul>
                <Button className="w-full mt-4" disabled>Noch nicht verfügbar</Button>
              </div>
            ))}
          </div>
        </details>
      </section>

      <Disclaimer />
    </div>
  );
}
