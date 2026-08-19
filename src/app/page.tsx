import Link from "next/link";
import { AkhiraSection } from "@/components/marketing/akhira-section";
import {
  FreeVsPaidSummary,
  PricingCard,
  SectionHeader,
  StepCard,
  TrustStrip,
} from "@/components/marketing/marketing-ui";
import { BRAND, BRAND_TRUST_ITEMS } from "@/lib/brand";
import { COLORS } from "@/lib/design-tokens";
import { Button, linkButtonClassName } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import {
  Activity,
  ClipboardCheck,
  Compass,
  FileSignature,
  HeartPulse,
  ListChecks,
  Scale,
  Smartphone,
  Sparkles,
  Target,
  Users,
} from "lucide-react";

const OUTCOMES = [
  {
    icon: Users,
    title: "Klarheit für meine Familie",
    description: "Vertrauenspersonen, Kontakte und Wünsche an einem Ort — ohne Rätselraten im Ernstfall.",
    accent: COLORS.catNotfall,
    slug: "familie",
  },
  {
    icon: ListChecks,
    title: "Meine Wünsche festhalten",
    description: "Persönliche und islamische Entscheidungen dokumentieren, bevor es Zeitdruck gibt.",
    accent: COLORS.catJanazah,
    slug: "wuensche",
  },
  {
    icon: Compass,
    title: "Islamische Orientierung",
    description: "Wissen zur Einordnung — zwischen deutschem Recht und islamischen Grundsätzen. Inhalte tragen einen Prüfstatus.",
    accent: COLORS.catAkhira,
    slug: "wissen",
  },
  {
    icon: Target,
    title: "Schritt für Schritt vorbereiten",
    description: "Check, ein nächster Schritt und persönlicher Vorsorgeplan — ohne alles auf einmal erledigen zu müssen.",
    accent: COLORS.catVermogen,
    slug: "plan",
  },
];

const STEPS = [
  {
    step: "1",
    title: "Prüfen",
    text: "Der kostenlose Amanah-Check zeigt in wenigen Minuten, was noch fehlt.",
    icon: ClipboardCheck,
  },
  {
    step: "2",
    title: "Einen Schritt wählen",
    text: "Du erhältst genau eine klare Empfehlung — ohne Überforderung.",
    icon: Sparkles,
  },
  {
    step: "3",
    title: "Festhalten",
    text: "Im persönlichen Vorsorgeplan dokumentieren, was deiner Familie wichtig sein soll.",
    icon: FileSignature,
  },
];

const AREAS = [
  { icon: HeartPulse, title: "Notfall und Gesundheit", text: "Kontakte, Patientenverfügung, medizinische Wünsche.", accent: COLORS.catNotfall },
  { icon: FileSignature, title: "Vollmachten", text: "Wer darf im Ernstfall für dich entscheiden?", accent: COLORS.catNotfall },
  { icon: Activity, title: "Janazah und Bestattung", text: "Islamische Grundsätze verständlich festhalten.", accent: COLORS.catJanazah },
  { icon: Scale, title: "Testament, Erbe, Schulden", text: "Zur Orientierung — mit Anwalt oder Imam prüfen.", accent: COLORS.catVermogen },
  { icon: Smartphone, title: "Digitaler Nachlass", text: "Konten und Zugänge ohne Passwörter im Klartext.", accent: COLORS.catVermogen },
  { icon: Users, title: "Familie und Akhira", text: "Gespräch mit Angehörigen, Familienbrief und Sadaqa Jariya.", accent: COLORS.catAkhira },
] as const;

const PRICING_TEASER = [
  { name: "Amanah-Check", price: "0 €", note: "Einmalig kostenlos, ohne Konto", highlighted: false },
  { name: "Basic", price: "29 €", note: "Einmalig — wichtigste Wünsche dokumentieren", highlighted: false },
  { name: "Komplett", price: "79 €", note: "Einmalig — alle Bereiche, empfohlen", highlighted: true },
  { name: "Familie", price: "99 €", note: "Einmalig — maximal zwei Erwachsenenprofile", highlighted: false },
];

function HeroCheckInfoCard({ className }: { className?: string }) {
  const points = [
    "Welche Bereiche noch offen sind",
    "Was du zuerst klären solltest",
    "Welchen einen Schritt du als Nächstes angehen kannst",
  ];
  return (
    <aside
      className={cn(
        "rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 md:p-7 shadow-2xl",
        className
      )}
    >
      <h2 className="text-lg font-bold text-white mb-4 leading-snug">
        Nach dem kostenlosen Check weißt du:
      </h2>
      <ul className="space-y-3 mb-5">
        {points.map((point) => (
          <li key={point} className="flex items-start gap-3 text-base text-white/90">
            <span className="w-2 h-2 rounded-full bg-emerald shrink-0 mt-2" aria-hidden />
            {point}
          </li>
        ))}
      </ul>
      <p className="text-sm text-white/65 leading-relaxed">
        Dein Ergebnis basiert auf deinen Antworten – ohne Bewertung. Ohne Konto und ohne KI.
      </p>
    </aside>
  );
}

export default function HomePage() {
  return (
    <div>
      <section
        className="relative text-white py-10 md:py-16 overflow-hidden"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 70% 0%, ${COLORS.primary}35 0%, transparent 55%), linear-gradient(165deg, ${COLORS.navy} 0%, ${COLORS.brandDark} 100%)`,
        }}
      >
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-[1fr_320px] gap-8 lg:gap-10 items-start">
            <div className="max-w-xl">
              <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-emerald mb-3 md:mb-4">
                {BRAND.heroEyebrow}
              </p>
              <p className="text-sm text-white/80 mb-3">{BRAND.positioning}</p>
              <h1 className="text-display font-bold mb-3 md:mb-4">{BRAND.heroTitle}</h1>
              <p className="text-body-lg text-white/90 leading-relaxed mb-6 md:mb-7 max-w-lg hidden sm:block">{BRAND.heroDescription}</p>
              <p className="text-base text-white/90 leading-relaxed mb-6 max-w-lg sm:hidden">{BRAND.heroDescriptionMobile}</p>
              <div className="flex flex-col gap-3 max-w-md">
                <Link
                  href="/check"
                  className={linkButtonClassName({ size: "lg", className: "w-full font-bold min-h-[52px] text-lg shadow-lg shadow-emerald/30 ring-2 ring-emerald/20" })}
                >
                  <ClipboardCheck size={20} className="mr-2" aria-hidden /> {BRAND.ctaPrimary}
                </Link>
                <Link href="#so-funktioniert" className="text-center sm:text-left">
                  <span className="inline-flex items-center justify-center w-full sm:w-auto min-h-[44px] text-base text-white/90 underline-offset-4 hover:text-emerald hover:underline font-medium">
                    {BRAND.ctaSecondary}
                  </span>
                </Link>
              </div>
              <div className="mt-6 lg:hidden">
                <HeroCheckInfoCard />
              </div>
              <div className="mt-6">
                <TrustStrip items={[...BRAND_TRUST_ITEMS]} />
              </div>
              <p className="text-sm md:text-base text-white/75 mt-4 md:mt-5 italic max-w-lg hidden sm:block">{BRAND.claim}</p>
            </div>
            <HeroCheckInfoCard className="hidden lg:block" />
          </div>
        </div>
      </section>

      <section className="py-10 md:py-18 bg-background">
        <div className="max-w-6xl mx-auto px-4">
          <SectionHeader
            title="Was du damit erreichst"
            description="Vier klare Ergebnisse — statt langer Listen."
            accent={COLORS.emerald}
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {OUTCOMES.map((o) => (
              <article
                key={o.title}
                data-testid={`home-outcome-${o.slug}`}
                className="rounded-2xl bg-card border-2 border-border p-5 md:p-7 shadow-sm flex flex-col"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 [&_svg]:text-[var(--outcome-accent)]"
                  style={{ backgroundColor: `${o.accent}18`, ["--outcome-accent" as string]: o.accent }}
                >
                  <o.icon size={24} aria-hidden />
                </div>
                <h3 className="text-card-title font-bold text-foreground mb-2">{o.title}</h3>
                <p className="text-body text-muted leading-relaxed flex-1">{o.description}</p>
              </article>
            ))}
          </div>
          <p className="text-body text-muted mt-8 max-w-3xl leading-relaxed">
            Gedacht für Muslime in Deutschland — Eltern, Konvertierte, Alleinlebende und Familien mit unterschiedlichen
            Hintergründen, die heute Klarheit schaffen wollen.
          </p>
          <div className="mt-10">
            <FreeVsPaidSummary />
          </div>
        </div>
      </section>

      <section id="so-funktioniert" className="py-14 md:py-18 bg-accent-soft border-y border-border scroll-mt-24">
        <div className="max-w-6xl mx-auto px-4">
          <SectionHeader
            title="So funktioniert Mein Wille"
            description="Du musst nicht alles heute erledigen. Der erste Überblick dauert nur wenige Minuten."
            accent={COLORS.primary}
          />
          <div className="grid md:grid-cols-3 gap-5 relative">
            <div className="hidden md:block absolute top-1/2 left-[16%] right-[16%] h-0.5 bg-primary/20 -translate-y-8" aria-hidden />
            {STEPS.map((s) => (
              <StepCard key={s.step} {...s} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 md:py-18 bg-card">
        <div className="max-w-6xl mx-auto px-4">
          <SectionHeader
            title="Was du vorbereiten kannst"
            description="Notfall, Entscheidungsunfähigkeit, Janazah und Akhira — mehr als nur Testament und Erbe."
            accent={COLORS.catJanazah}
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {AREAS.map(({ icon: Icon, title, text, accent }) => (
              <article
                key={title}
                className="rounded-2xl border-2 border-border bg-background p-5 md:p-6 flex flex-col"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 [&_svg]:text-[var(--area-accent)]"
                  style={{ backgroundColor: `${accent}18`, ["--area-accent" as string]: accent }}
                >
                  <Icon size={24} aria-hidden />
                </div>
                <h3 className="text-card-title font-bold text-primary-dark">{title}</h3>
                <p className="text-body text-muted mt-2 leading-relaxed flex-1">{text}</p>
              </article>
            ))}
          </div>
          <p className="text-sm text-muted mt-6">
            Die einzelnen Bereiche öffnest du nach dem Check in deinem persönlichen Vorsorgeplan — nicht als gleichwertige Einstiege.
          </p>
        </div>
      </section>

      <AkhiraSection />

      <section className="py-14 md:py-18 bg-background">
        <div className="max-w-6xl mx-auto px-4">
          <SectionHeader
            title="Preise — klar getrennt"
            description="Starte kostenlos. Vollständige Dokumentation ist als Einmalpaket geplant — kein Abo."
            accent={COLORS.emerald}
          />
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
            {PRICING_TEASER.map((p) => (
              <PricingCard
                key={p.name}
                name={p.name}
                price={p.price}
                description={p.note}
                features={[]}
                highlighted={p.highlighted}
                statusNote={p.name === "Amanah-Check" ? undefined : "In Vorbereitung"}
                cta={
                  p.name === "Amanah-Check" ? (
                    <Link href="/check">
                      <Button className="w-full" variant="primary">
                        {BRAND.ctaPrimary}
                      </Button>
                    </Link>
                  ) : undefined
                }
              />
            ))}
          </div>
          <Link href="/preise">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Alle Preise ansehen
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
