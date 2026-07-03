import { Disclaimer } from "@/components/ui/disclaimer";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Akuter Todesfall — AmanahOrdner" };

const steps = [
  { num: 1, title: "Arzt / Totenschein", desc: "Hausarzt oder Notarzt kontaktieren. Totenschein ausstellen lassen." },
  { num: 2, title: "Engste Angehörige informieren", desc: "Familie, Ehepartner, enge Verwandte sofort benachrichtigen." },
  { num: 3, title: "Islamischen Bestatter oder Moschee kontaktieren", desc: "24/7 erreichbare islamische Bestatter oder die örtliche Moschee anrufen." },
  { num: 4, title: "Ghusl / Kafan organisieren", desc: "Totenwaschung und Leichentuch vorbereiten. Bestatter oder Moschee-Helfer." },
  { num: 5, title: "Janazah-Gebet vorbereiten", desc: "Moschee kontaktieren für Salāt al-Janāzah. Zeit und Ort abstimmen." },
  { num: 6, title: "Schnelle würdige islamische Bestattung prüfen", desc: "Unnötige Verzögerung vermeiden. Wünsche des Verstorbenen beachten." },
  { num: 7, title: "Standesamt / Friedhof / Dokumente", desc: "Sterbeurkunde, Friedhofsgenehmigung, Bestattungsgenehmigung." },
  { num: 8, title: "Schulden / Amanah / Familienwünsche prüfen", desc: "Offene Schulden, anvertraute Güter und dokumentierte Wünsche klären." },
];

export default function AkuterTodesfallPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-primary mb-3">Jemand ist gestorben — was jetzt?</h1>
      <p className="text-muted mb-8">Ruhe bewahren. Diese 24-Stunden-Schritte helfen dir und deiner Familie.</p>

      <div className="space-y-4">
        {steps.map((step) => (
          <div key={step.num} className="flex gap-4 rounded-2xl bg-card border border-primary/10 p-5">
            <span className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">{step.num}</span>
            <div>
              <h2 className="font-semibold text-primary">{step.title}</h2>
              <p className="text-sm text-muted mt-1">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl bg-sand p-6 text-center">
        <p className="text-sm text-muted mb-4">Dieser Bereich ist kostenlos und ohne Verkaufsdruck.</p>
        <Link href="/bestatter"><Button variant="outline">Bestatter-Verzeichnis</Button></Link>
      </div>

      <div className="mt-8"><Disclaimer type="islamic" /></div>
    </div>
  );
}
