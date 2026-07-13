import Link from "next/link";
import { MobileStickyCta } from "@/components/layout/mobile-sticky-cta";
import { AkhiraSection } from "@/components/marketing/akhira-section";
import {
  FeatureList,
  FreeVsPaidSummary,
  SectionHeader,
  TrustStrip,
} from "@/components/marketing/marketing-ui";
import { BRAND } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import {
  Activity,
  ClipboardCheck,
  FileSignature,
  HeartPulse,
  Scale,
  Smartphone,
  Users,
} from "lucide-react";

const FOR_WHO = [
  "Muslime in Deutschland",
  "Eltern und Ehepaare",
  "Konvertierte",
  "Alleinlebende",
  "Menschen ohne klare Vertrauensperson",
  "Familien mit nicht muslimischen Angehörigen",
];

const BENEFITS = [
  "Überblick über offene Vorsorgethemen",
  "Klare nächste Schritte",
  "Persönliche Notfallinformationen",
  "Dokumentierte Wünsche für Familie und Janazah",
  "Familienbrief und Notfallkarte",
  "Strukturierter Vorsorgeordner mit Export",
];

const WHY = [
  "Deine Familie erhält Klarheit.",
  "Wichtige Wünsche gehen nicht verloren.",
  "Du beginnst mit einem kleinen, machbaren Schritt.",
];

const STEPS = [
  { n: "1", title: "Check starten", text: "In wenigen Minuten siehst du, was fehlt." },
  { n: "2", title: "Nächsten Schritt wählen", text: "Priorisierte Empfehlung — ohne Überforderung." },
  { n: "3", title: "Geführt dokumentieren", text: "Schritt für Schritt im persönlichen Ordner." },
];

const AREAS = [
  { icon: HeartPulse, title: "Notfall und Gesundheit", text: "Kontakte, Patientenverfügung, medizinische Wünsche." },
  { icon: FileSignature, title: "Vollmachten und Vertrauenspersonen", text: "Wer darf im Ernstfall entscheiden?" },
  { icon: Activity, title: "Janazah und Bestattungswünsche", text: "Islamische Grundsätze verständlich festhalten." },
  { icon: Scale, title: "Testament, Erbe und Schulden", text: "Orientierung — fachlich mit Anwalt/Imam prüfen." },
  { icon: Smartphone, title: "Digitaler Nachlass", text: "Konten und Zugänge ohne Passwörter im Klartext." },
  { icon: Users, title: "Familie, Akhira und gute Taten", text: "Briefe, Sadaqa Jariya und Herzensprojekte." },
];

const PRICING_TEASER = [
  { name: "Basic", price: "29 €", note: "Wichtigste Dokumente" },
  { name: "Komplett", price: "79 €", note: "Alle Module — empfohlen" },
  { name: "Familie", price: "99 €", note: "Zwei Profile" },
];

export default function HomePage() {
  return (
    <div className="pb-28 md:pb-0">
      {/* Hero */}
      <section className="relative bg-navy text-white py-10 md:py-16">
        <div className="max-w-3xl mx-auto px-4">
          <p className="text-xs md:text-sm font-semibold uppercase tracking-widest text-accent mb-4">{BRAND.eyebrow}</p>
          <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4 max-w-xl">
            Damit deine Familie nicht raten muss.
          </h1>
          <p className="text-base md:text-lg text-white/85 leading-relaxed mb-6 max-w-xl">
            {BRAND.name} hilft dir, wichtige Wünsche, Dokumente und Ansprechpartner für Krankheit, Notfall und Todesfall verständlich festzuhalten.
          </p>
          <div className="flex flex-col gap-3 max-w-md">
            <Link href="/check">
              <Button size="lg" className="w-full bg-accent hover:bg-accent-light text-white font-semibold min-h-[48px]">
                <ClipboardCheck size={18} className="mr-2" /> Kostenlosen 3-Minuten-Check starten
              </Button>
            </Link>
            <Link href="/dashboard/ausfuellen" className="text-center sm:text-left">
              <span className="inline-flex items-center justify-center w-full sm:w-auto min-h-[44px] text-base text-white/90 underline-offset-4 hover:underline">
                Direkt geführt ausfüllen
              </span>
            </Link>
          </div>
          <div className="mt-6">
            <TrustStrip items={["Kostenlos starten", "Quellenbasiert", "Für muslimisches Leben in Deutschland"]} />
          </div>
          <p className="text-sm text-white/65 mt-5 max-w-lg leading-relaxed">
            Der Check zeigt dir, was bereits geregelt ist, was fehlt und welchen Schritt du als Nächstes angehen solltest.
          </p>
        </div>
      </section>

      {/* Für wen + Nutzen */}
      <section className="py-12 md:py-14 max-w-5xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          <div>
            <SectionHeader title="Für wen ist Amanah Vorsorge?" />
            <FeatureList items={FOR_WHO} />
          </div>
          <div>
            <SectionHeader title="Was bringt dir Amanah Vorsorge?" />
            <FeatureList items={BENEFITS} />
          </div>
        </div>
        <div className="mt-10">
          <FreeVsPaidSummary />
        </div>
      </section>

      {/* So funktioniert es + Warum */}
      <section className="py-12 md:py-14 bg-card border-y border-border">
        <div className="max-w-5xl mx-auto px-4">
          <SectionHeader title="So funktioniert es" description="Du musst nicht alles heute erledigen. Der erste Überblick dauert nur wenige Minuten." />
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-xl border border-border p-5 bg-background">
                <span className="text-sm font-bold text-accent">{s.n}</span>
                <h3 className="font-semibold text-primary mt-1 mb-2">{s.title}</h3>
                <p className="text-base text-muted">{s.text}</p>
              </div>
            ))}
          </div>
          <ul className="space-y-2">
            {WHY.map((w) => (
              <li key={w} className="text-base text-muted flex gap-2">
                <span className="text-accent">•</span> {w}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Bereiche */}
      <section className="py-12 md:py-14 max-w-5xl mx-auto px-4">
        <SectionHeader title="Was du mit Amanah Vorsorge regeln kannst" />
        <div className="grid sm:grid-cols-2 gap-3">
          {AREAS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-4 rounded-xl border border-border bg-card p-4 min-h-[44px]">
              <Icon size={22} className="text-primary shrink-0 mt-0.5" aria-hidden />
              <div>
                <h3 className="font-semibold text-primary text-base">{title}</h3>
                <p className="text-sm text-muted mt-1">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <AkhiraSection />

      {/* Preise kompakt */}
      <section className="py-12 md:py-14 max-w-5xl mx-auto px-4">
        <SectionHeader
          title="Preise — klar getrennt"
          description="Starte kostenlos. Vollständige Dokumentation und Exporte sind als Einmalpakete geplant — Kauf derzeit noch nicht aktiv."
        />
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          {PRICING_TEASER.map((p) => (
            <div key={p.name} className="rounded-xl border border-border bg-card p-5 text-center">
              <p className="font-bold text-primary">{p.name}</p>
              <p className="text-2xl font-bold text-primary my-1">{p.price}</p>
              <p className="text-sm text-muted">{p.note}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/check"><Button size="lg" className="w-full sm:w-auto">Kostenlosen Check starten</Button></Link>
          <Link href="/preise"><Button size="lg" variant="outline" className="w-full sm:w-auto">Alle Preise ansehen</Button></Link>
        </div>
      </section>

      <MobileStickyCta href="/check" label="3-Minuten-Check starten" />
    </div>
  );
}
