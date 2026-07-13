import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Disclaimer } from "@/components/ui/disclaimer";
import { PathSelector } from "@/components/onboarding/path-selector";
import { Logo } from "@/components/layout/logo";
import { MobileStickyCta } from "@/components/layout/mobile-sticky-cta";
import { moduleConfigs } from "@/lib/modules/config";
import {
  AlertTriangle,
  ArrowRight,
  ClipboardCheck,
  Compass,
  FileCheck,
  Shield,
  Clock,
} from "lucide-react";

const whyNow = [
  { icon: Clock, title: "Der Tod kommt ohne Termin", text: "Nicht „irgendwann“ — heute anfangen, morgen ergänzen." },
  { icon: AlertTriangle, title: "Unklare Wünsche belasten Angehörige", text: "Schuld, Streit, teure Fehlentscheidungen — oft vermeidbar." },
  { icon: Shield, title: "Schulden & Zugänge gehen verloren", text: "Amanah und digitale Konten überleben deinen Tod nicht automatisch." },
  { icon: FileCheck, title: "Islam in Deutschland = Vorbereitung", text: "Janazah, Vorsorge und Erbe brauchen klare Dokumente — nicht nur gute Absicht." },
];

const audiences = [
  "Muslime in Deutschland",
  "Konvertierte",
  "Unverheiratete",
  "Nicht-muslimische Familie",
  "Eltern",
  "Alleinlebende",
  "Ohne klare Vertrauensperson",
];

const deliverables = [
  "Klarer Überblick über Lücken",
  "Priorisierte To-do-Liste",
  "Familienbrief (auch für Nicht-Muslime)",
  "Notfallkarte & Export",
  "Hinweise: Imam / Anwalt / Arzt / Notar",
];

export default function HomePage() {
  return (
    <div className="pb-24 md:pb-0">
      <section className="relative bg-navy text-white py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_70%_20%,#c45c26_0%,transparent_45%)]" />
        <div className="max-w-4xl mx-auto px-4 relative">
          <Logo variant="hero" tone="light" className="mb-8" />
          <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-6">
            Wenn du plötzlich nicht mehr selbst entscheiden kannst, soll deine Familie nicht raten müssen.
          </h1>
          <p className="text-lg text-white/85 mb-4 max-w-2xl leading-relaxed">
            Amanah hilft dir, alles Wichtige für Notfall und Todesfall verständlich zu ordnen – von Vertrauenspersonen,
            Dokumenten und medizinischen Wünschen bis zu Schulden, digitalen Zugängen und Janazah-Wünschen.
          </p>
          <p className="text-sm text-accent-light font-medium mb-8 tracking-wide">
            Persönlich. Quellenbasiert. Für muslimisches Leben in Deutschland.
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            <Link href="/check">
              <Button size="lg" className="bg-accent hover:bg-accent-light text-white font-bold shadow-lg w-full sm:w-auto">
                <ClipboardCheck size={18} className="mr-2" /> Kostenlosen Amanah-Check starten
              </Button>
            </Link>
            <Link href="/dashboard/ausfuellen">
              <Button size="lg" variant="outline" className="border-white/50 text-white hover:bg-white/10 w-full sm:w-auto">
                <Compass size={18} className="mr-2" /> Geführt meinen Ordner ausfüllen
              </Button>
            </Link>
            <Link href="/konvertierte">
              <Button size="lg" variant="ghost" className="text-accent-light hover:bg-white/10 w-full sm:w-auto">
                Für Konvertierte ansehen
              </Button>
            </Link>
          </div>
          <p className="text-sm text-white/70 mt-5 max-w-xl leading-relaxed">
            In wenigen Minuten erfährst du, was bereits geregelt ist, was deiner Familie fehlen würde und welchen nächsten Schritt du heute erledigen kannst.
          </p>
        </div>
      </section>

      <section className="py-14 max-w-5xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-primary mb-8 text-center">Warum jetzt?</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {whyNow.map(({ icon: Icon, title, text }) => (
            <Card key={title} className="border-l-4 border-l-accent">
              <Icon className="text-accent mb-2" size={22} />
              <h3 className="font-bold text-primary mb-1">{title}</h3>
              <p className="text-sm text-muted">{text}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="py-14 bg-sand/60">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-primary mb-8 text-center">Was ordnest du?</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {moduleConfigs.map((m) => (
              <Link key={m.id} href={m.path}>
                <Card className="h-full hover:border-accent/50 transition-colors py-4">
                  <h3 className="font-semibold text-primary text-sm">{m.title}</h3>
                  <p className="text-xs text-muted mt-1 line-clamp-2">{m.description}</p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 max-w-4xl mx-auto px-4 grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-bold text-primary mb-4">Für wen?</h2>
          <ul className="space-y-2">
            {audiences.map((a) => (
              <li key={a} className="text-sm text-muted flex items-center gap-2">
                <ArrowRight size={14} className="text-accent shrink-0" /> {a}
              </li>
            ))}
          </ul>
          <Link href="/konvertierte" className="inline-block mt-4 text-accent font-medium hover:underline text-sm">
            Konvertierten-Checkliste ansehen →
          </Link>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-primary mb-4">Was bekommst du?</h2>
          <ul className="space-y-2">
            {deliverables.map((d) => (
              <li key={d} className="text-sm text-muted flex items-center gap-2">
                <FileCheck size={14} className="text-success shrink-0" /> {d}
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted mt-4">Keine Garantie auf Vollständigkeit oder rechtliche Wirksamkeit — fachliche Prüfung empfohlen.</p>
        </div>
      </section>

      <PathSelector />

      <section className="py-14 max-w-3xl mx-auto px-4 text-center">
        <h2 className="text-xl font-bold text-primary mb-3">Erster Schritt — wenige Minuten</h2>
        <p className="text-muted mb-6">
          Der kostenlose Amanah-Check zeigt, was geregelt ist, was fehlt — und was du heute als Nächstes tun kannst.
        </p>
        <Link href="/check"><Button size="lg">Kostenlosen Amanah-Check starten</Button></Link>
      </section>

      <section className="max-w-3xl mx-auto px-4 pb-16">
        <Disclaimer />
      </section>

      <MobileStickyCta href="/check" label="Kostenlosen Check starten" />
    </div>
  );
}
