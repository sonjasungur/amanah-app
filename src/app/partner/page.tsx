import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Partner werden — Amanah Vorsorge",
  description: "Partnerschaften für Bestatter, Moscheen/Vereine und Anwälte/Notare.",
};

const sections = [
  {
    id: "bestatter",
    icon: "🕌",
    title: "Bestatter",
    description:
      "Islamische Bestattungsdienste können sich im Verzeichnis listen lassen — mit Verifizierung, 24/7-Anzeige und regionaler Priorität für Familien im Notfall.",
    features: [
      "Kostenloser Basiseintrag mit regionalem Profil",
      "Verifiziertes Partner-Badge und 24/7-Sichtbarkeit",
      "Direkte Verknüpfung mit Amanah Vorsorge-Nutzerwünschen",
    ],
    cta: { label: "Bestatter-Verzeichnis ansehen", href: "/bestatter" },
    buttonLabel: "Interesse anmelden",
  },
  {
    id: "moscheen",
    icon: "🤝",
    title: "Moscheen & Vereine",
    description:
      "Gemeinden und islamische Vereine erhalten kostenlose Materialien: Janazah-Checklisten, QR-Codes für Vorsorge und optionale Workshops vor Ort.",
    features: [
      "Kostenloses Infopaket für Janazah-Vorsorge",
      "QR-Code für Gemeinde-Mitglieder",
      "Workshop-Paket für Vorträge und Checklisten",
    ],
    cta: { label: "Janazah-Kompass", href: "/janazah-kompass" },
    buttonLabel: "Interesse anmelden",
  },
  {
    id: "anwaelte",
    icon: "⚖️",
    title: "Anwälte & Notare",
    description:
      "Fachleute für Erbrecht, Patientenverfügung und Testament unterstützen Muslime bei der rechtlichen Umsetzung islamischer Vorsorge in Deutschland.",
    features: [
      "Vermittlung für Testament- und Erbberatung",
      "Patientenverfügung und Vorsorgevollmacht",
      "Zusammenarbeit mit Imam/Gelehrten empfohlen",
    ],
    cta: { label: "Testament & Erbe", href: "/testament-erbe" },
    buttonLabel: "Interesse anmelden",
  },
];

export default function PartnerPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-12 text-center">
        <p className="text-accent font-medium mb-2">Gemeinsam stärker</p>
        <h1 className="text-3xl font-bold text-primary mb-3">Partner werden</h1>
        <p className="text-muted max-w-2xl mx-auto leading-relaxed">
          Amanah Vorsorge verbindet Muslime in Deutschland mit vertrauenswürdigen Partnern —
          im Alltag und im schwersten Moment.
        </p>
      </div>

      <div className="space-y-8">
        {sections.map((section) => (
          <Card key={section.id} className="overflow-hidden">
            <div className="flex items-start gap-4 mb-4">
              <span className="text-4xl">{section.icon}</span>
              <div>
                <CardTitle className="text-xl">{section.title}</CardTitle>
                <p className="text-muted leading-relaxed mt-2">{section.description}</p>
              </div>
            </div>

            <ul className="space-y-2 mb-6 ml-14">
              {section.features.map((feature) => (
                <li key={feature} className="text-sm text-muted flex items-start gap-2">
                  <span className="text-accent">✓</span>
                  {feature}
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-3 ml-14">
              <Link href={section.cta.href}>
                <Button variant="outline" size="sm">{section.cta.label}</Button>
              </Link>
              <Button variant="secondary" size="sm" disabled>
                {section.buttonLabel}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-12 rounded-2xl bg-sand border border-primary/10 p-6 text-center">
        <p className="text-sm text-muted">
          Partner-Anfragen werden derzeit manuell bearbeitet. Schreib uns an{" "}
          <a href="mailto:partner@amanahordner.de" className="text-primary-light underline">
            partner@amanahordner.de
          </a>
        </p>
      </div>
    </div>
  );
}
