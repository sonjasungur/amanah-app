import { Disclaimer } from "@/components/ui/disclaimer";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TopicFunctionLinks, TopicHero } from "@/components/marketing/topic-page";
import { publicPageMetadata } from "@/lib/seo/public-pages";

export const metadata = publicPageMetadata("/akuter-todesfall");

const steps = [
  { num: 1, title: "Arzt / Totenschein", desc: "Hausarzt oder Notarzt kontaktieren. Totenschein ausstellen lassen." },
  { num: 2, title: "Engste Angehörige informieren", desc: "Familie, Ehepartner, enge Verwandte sofort benachrichtigen." },
  { num: 3, title: "Islamischen Bestatter oder Moschee kontaktieren", desc: "24/7 erreichbare islamische Bestatter oder die örtliche Moschee anrufen." },
  { num: 4, title: "Ghusl und Kafan ansprechen", desc: "Bestatter oder Moschee fragen, wer das übernimmt und was zu tun ist." },
  { num: 5, title: "Janazah-Gebet vorbereiten", desc: "Moschee kontaktieren für Salāt al-Janāzah. Zeit und Ort abstimmen." },
  { num: 6, title: "Zeitpunkt der Bestattung klären", desc: "Mit Bestatter, Moschee und Friedhof abstimmen. Wünsche des Verstorbenen beachten." },
  { num: 7, title: "Standesamt / Friedhof / Dokumente", desc: "Sterbeurkunde, Friedhofsgenehmigung, Bestattungsgenehmigung." },
  { num: 8, title: "Schulden / Amanah / Familienwünsche prüfen", desc: "Offene Schulden, anvertraute Güter und dokumentierte Wünsche klären." },
];

export default function AkuterTodesfallPage() {
  return (
    <div>
      <TopicHero
        eyebrow="Soforthilfe für Angehörige"
        title="Jemand ist gestorben — was jetzt?"
        image="janazah"
        intro={<p>Ruhe bewahren. Diese 24-Stunden-Schritte helfen dir und deiner Familie.</p>}
      />
      <div className="max-w-5xl mx-auto px-4 py-10 md:py-14">
        <ol className="space-y-4">
          {steps.map((step) => (
            <li key={step.num} className="flex gap-4 md:gap-5 rounded-2xl bg-card gold-frame p-5 md:p-6">
              <span className="flex-shrink-0 w-11 h-11 rounded-full wasiyya-cta flex items-center justify-center font-bold">{step.num}</span>
              <div>
                <h2 className="font-semibold text-primary-dark text-lg">{step.title}</h2>
                <p className="text-muted mt-1">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>

        <TopicFunctionLinks
          title="Vorsorgen, damit die Familie später nichts suchen muss"
          actions={[
            { href: "/dashboard/notfallkarte", label: "Notfallkarte", text: "Kontakte, Allergien und Medikamente für den Ernstfall." },
            { href: "/dashboard/bestattung", label: "Bestattung oder Überführung", text: "Bestatter, Moschee und Wünsche zur Beisetzung." },
            { href: "/dashboard/notfallpaket", label: "Notfallpaket", text: "Die wichtigsten Angaben für die Familie zum Ausdrucken." },
          ]}
        />

        <div className="mt-10 rounded-2xl gold-frame bg-card p-6 text-center">
          <p className="text-sm text-muted mb-4">Dieser Bereich ist kostenlos und ohne Verkaufsdruck.</p>
          <Link href="/wissen"><Button variant="outline">Wissen zu Janazah</Button></Link>
        </div>

        <div className="mt-8"><Disclaimer type="islamic" /></div>
      </div>
    </div>
  );
}
