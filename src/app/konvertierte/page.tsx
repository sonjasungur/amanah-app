import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Disclaimer } from "@/components/ui/disclaimer";
import { Users, HeartHandshake, FileText, Phone } from "lucide-react";

export const metadata = {
  title: "Für Konvertierte & alleinstehende Muslime — Mein Wille",
};

const checklist = [
  "Muslimischer Notfallkontakt benennen",
  "Moschee / Imam / Gemeinde kontaktieren",
  "Islamischen Bestatter recherieren",
  "Wunsch: Ghusl, Kafan, Janazah schriftlich",
  "Bestattung in Deutschland oder Überführung klären",
  "Familienbrief in einfachem Deutsch",
  "Erklärung für nicht-muslimische Angehörige",
  "Wer darf im Notfall angerufen werden?",
  "Wo liegen Dokumente physisch?",
  "Was ist religiös wichtig vs. kulturell?",
  "Was muss rechtlich (Anwalt/Notar/Arzt) geprüft werden?",
];

export default function KonvertiertePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <p className="text-accent font-semibold uppercase text-sm tracking-wide mb-2">Zielgruppe</p>
      <h1 className="text-3xl font-bold text-primary mb-4">Für Konvertierte & alleinstehende Muslime</h1>
      <p className="text-muted text-lg mb-8 leading-relaxed">
        Wenn deine Familie nicht muslimisch ist, du unverheiratet lebst oder niemand deine Janazah-Wünsche kennt —
        musst du deine Amanah besonders klar dokumentieren. Nicht aus Angst, sondern aus Verantwortung.
      </p>

      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        <Card className="border-l-4 border-l-accent">
          <Users className="text-accent mb-2" size={24} />
          <h2 className="font-semibold text-primary mb-2">Nicht-muslimische Familie</h2>
          <p className="text-sm text-muted">Ghusl, Kafan und Janazah sind oft unbekannt. Ein einfacher Brief kann Leben retten — im wörtlichen Sinne deiner Würde.</p>
        </Card>
        <Card className="border-l-4 border-l-accent">
          <HeartHandshake className="text-accent mb-2" size={24} />
          <h2 className="font-semibold text-primary mb-2">Ohne Ehepartner</h2>
          <p className="text-sm text-muted">Vertrauensperson, Moschee und Bestatter müssen vorher benannt sein — sonst entscheidet das deutsche System allein.</p>
        </Card>
      </div>

      <Card className="mb-10">
        <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
          <FileText size={20} className="text-accent" /> Checkliste
        </h2>
        <ul className="space-y-2">
          {checklist.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-muted">
              <span className="text-accent font-bold">→</span> {item}
            </li>
          ))}
        </ul>
      </Card>

      <Card className="bg-primary text-white mb-10">
        <Phone className="mb-3 text-accent" size={28} />
        <h2 className="text-xl font-bold mb-2">Erster Schritt heute</h2>
        <p className="text-white/80 text-sm mb-4">Starte mit dem Amanah-Check — er erkennt deine Situation und empfiehlt konkrete nächste Schritte.</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/check"><Button size="lg">Amanah-Check starten</Button></Link>
          <Link href="/dashboard/familie"><Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10">Familienbrief vorbereiten</Button></Link>
          <Link href="/dashboard/notfallkarte"><Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10">Notfallkontakt</Button></Link>
        </div>
      </Card>

      <Disclaimer type="islamic" />
    </div>
  );
}
