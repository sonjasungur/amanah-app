import Image from "next/image";
import Link from "next/link";
import { TOPIC_IMAGES } from "@/lib/content/topic-images";
import { AkhiraSection } from "@/components/marketing/akhira-section";
import { HomeEntryPoints } from "@/components/marketing/home-entry-points";
import {
  FreeVsPaidSummary,
  SectionHeader,
  StepCard,
  TrustStrip,
} from "@/components/marketing/marketing-ui";
import { BRAND, BRAND_TRUST_ITEMS } from "@/lib/brand";
import { COLORS } from "@/lib/design-tokens";
import { START_ALWAYS_FREE, START_BASIS, START_PLUS_PLANNED } from "@/lib/billing/start-offer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { WasiyyaMark } from "@/components/layout/wasiyya-logo";
import { publicPageMetadata } from "@/lib/seo/public-pages";
import { OrganizationJsonLd } from "@/components/seo/organization-json-ld";
import {
  Activity,
  ArrowRight,
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
    text: "Der kostenlose Vorsorge-Check zeigt in wenigen Minuten, was noch fehlt.",
    icon: ClipboardCheck,
  },
  {
    step: "2",
    title: "Schritt für Schritt festhalten",
    text: "Ein geführter Ablauf durch sechs Bereiche. Jede Angabe ist freiwillig, du kannst jederzeit pausieren und später weitermachen.",
    icon: Sparkles,
  },
  {
    step: "3",
    title: "Notfallpaket für die Familie",
    text: "Du wählst aus, was deine Familie wissen soll, und druckst es aus. Online wird nichts geteilt.",
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

/** Start offer (owner order 23.11.2026): only free features that are on at the start; Plus without price. */
const FREE_TITLES = START_BASIS.map((f) => f.title);

function HeroCheckInfoCard({ className }: { className?: string }) {
  const points = [
    "Welche Bereiche noch offen sind",
    "Was du zuerst klären solltest",
    "Welchen einen Schritt du als Nächstes angehen kannst",
  ];
  return (
    <aside
      className={cn(
        "relative rounded-2xl border border-[#D4A537]/45 bg-[#0B1226]/80 backdrop-blur-md p-6 md:p-7 shadow-2xl before:absolute before:inset-x-6 before:top-0 before:h-0.5 before:bg-[#D4A537] before:rounded-full",
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

export const metadata = publicPageMetadata("/");

export default function HomePage() {
  return (
    <div>
      <OrganizationJsonLd />
      <section
        className="on-dark wasiyya-hero relative text-white pt-8 pb-12 md:pt-20 md:pb-24 overflow-hidden"
        data-testid="home-hero"
      >
        <div className="relative max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 lg:gap-14 items-center">
            <div className="max-w-2xl min-w-0">
              {/* Phones show the descriptor here, because the compact header leaves it out. */}
              <p className="md:hidden flex items-center gap-2.5 mb-4 text-[15px] font-medium text-[#F2CF6C]" data-testid="home-hero-descriptor">
                <WasiyyaMark height={26} inverted />
                {BRAND.descriptor}
              </p>
              <p className="hidden md:flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.18em] text-emerald mb-4">
                <span className="h-px w-8 bg-[#D4A537]" aria-hidden />
                {BRAND.heroEyebrow}
              </p>
              <h1 className="text-display mb-4 md:mb-5 text-balance">
                {BRAND.heroTitle.slice(0, BRAND.heroTitle.indexOf(",") + 1)}{" "}
                <span className="gold-text">{BRAND.heroTitle.slice(BRAND.heroTitle.indexOf(",") + 2)}</span>
              </h1>
              <p className="text-body-lg text-white/90 leading-relaxed mb-6 md:mb-7 max-w-lg hidden sm:block">{BRAND.heroDescription}</p>
              <p className="text-base text-white/90 leading-relaxed mb-6 max-w-lg sm:hidden">{BRAND.heroDescriptionMobile}</p>
              <div className="flex flex-col gap-3 max-w-md">
                <Link
                  href="/check"
                  className="wasiyya-cta group inline-flex items-center justify-center w-full rounded-xl font-bold min-h-[58px] text-[14px] tracking-tight min-[370px]:text-[15px] min-[400px]:text-base min-[400px]:tracking-normal sm:text-lg px-2 min-[340px]:px-2.5 sm:px-7 py-3 text-center leading-snug sm:whitespace-nowrap"
                  data-testid="home-hero-cta"
                >
                  <ClipboardCheck size={20} className="mr-2 shrink-0 hidden min-[360px]:inline" aria-hidden /> {BRAND.ctaPrimary}
                  <ArrowRight size={20} className="ml-2 shrink-0 hidden min-[420px]:inline transition-transform group-hover:translate-x-0.5" aria-hidden />
                </Link>
                <Link
                  href="#so-funktioniert"
                  className="inline-flex items-center justify-center w-full sm:w-auto sm:self-start min-h-[48px] px-5 rounded-xl border border-[#C9A04A]/60 text-base font-semibold text-white hover:bg-white/5 hover:border-[#DDBB66]"
                >
                  {BRAND.ctaSecondary}
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
            <div className="hidden lg:block relative">
              <figure className="wasiyya-photo wasiyya-arch">
                <div className="relative aspect-[4/5]">
                  <Image src={TOPIC_IMAGES.hero.src} alt={TOPIC_IMAGES.hero.alt} fill priority sizes="40vw" className="object-cover" />
                </div>
              </figure>
              <HeroCheckInfoCard className="absolute -left-10 bottom-10 max-w-[330px]" />
            </div>
          </div>
        </div>
      </section>

      <HomeEntryPoints />

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
            title="So funktioniert Wasiyya"
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

      <section className="py-14 md:py-18 bg-background" data-testid="home-availability">
        <div className="max-w-6xl mx-auto px-4">
          <SectionHeader
            title="Was du heute nutzen kannst"
            description="Was kostenlos ist, was in Vorbereitung ist und was noch auf eine fachliche Prüfung wartet."
            accent={COLORS.emerald}
          />
          <div className="grid gap-5 md:grid-cols-3">
            <article className="rounded-2xl border-2 border-emerald/40 bg-card p-6" data-testid="home-free">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald">Kostenlos</p>
              <h3 className="text-card-title font-bold text-foreground mt-1">Dauerhaft frei</h3>
              <ul className="mt-4 space-y-2 text-sm text-muted">
                {FREE_TITLES.map((t) => (
                  <li key={t} className="flex gap-2"><span className="text-emerald font-bold" aria-hidden>✓</span>{t}</li>
                ))}
                <li className="flex gap-2 pt-2 border-t border-border"><span aria-hidden /> {START_ALWAYS_FREE}</li>
              </ul>
            </article>
            <article className="rounded-2xl border-2 border-border bg-card p-6" data-testid="home-plus">
              <p className="text-xs font-bold uppercase tracking-wide text-primary">Vorsorge Plus · ohne Preis, noch nicht buchbar</p>
              <h3 className="text-card-title font-bold text-foreground mt-1">In Vorbereitung</h3>
              <p className="text-sm text-muted mt-1">Kauf ist noch nicht möglich. Bis zum Start nutzt du diese Bereiche ohne Einschränkung.</p>
              <ul className="mt-4 space-y-2 text-sm text-muted">
                {START_PLUS_PLANNED.map((t) => (
                  <li key={t} className="flex gap-2"><span aria-hidden>•</span>{t}</li>
                ))}
              </ul>
            </article>
            <article className="rounded-2xl border-2 border-dashed border-border bg-card p-6" data-testid="home-pending">
              <p className="text-xs font-bold uppercase tracking-wide text-muted">Noch nicht verfügbar</p>
              <h3 className="text-card-title font-bold text-foreground mt-1">Wartet auf fachliche Freigabe</h3>
              <ul className="mt-4 space-y-2 text-sm text-muted">
                <li className="flex gap-2"><span aria-hidden>–</span>Islamische Fachartikel (Themen sind angelegt, Inhalte erst nach Prüfung durch Gelehrte)</li>
                <li className="flex gap-2"><span aria-hidden>–</span>Vorbereitung des Testaments und Hinweise zum Erbe (nach juristischer Prüfung)</li>
                <li className="flex gap-2"><span aria-hidden>–</span>Digitaler Zugang für Angehörige (Konzept in Prüfung, bis dahin teilt Wasiyya nichts online)</li>
              </ul>
            </article>
          </div>
          <Link href="/preise" className="inline-block mt-8">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Pakete ansehen
            </Button>
          </Link>
        </div>
      </section>

      {/* Closing call to action: one clear next step before the footer. */}
      <section className="on-dark wasiyya-hero relative overflow-hidden text-white py-14 md:py-20" data-testid="home-final-cta">
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <WasiyyaMark height={56} inverted className="mx-auto mb-5" />
          <h2 className="text-section-title text-balance">Heute festhalten, was deiner Familie später Klarheit gibt.</h2>
          <p className="mt-3 text-body-lg text-white/85">Der kostenlose Vorsorge-Check zeigt in wenigen Minuten, was noch fehlt. Ohne Konto und ohne KI.</p>
          <Link
            href="/check"
            className="wasiyya-cta group mt-8 inline-flex items-center justify-center w-full sm:w-auto rounded-xl font-bold min-h-[58px] text-[14px] tracking-tight min-[370px]:text-[15px] min-[400px]:text-base min-[400px]:tracking-normal sm:text-lg px-2 min-[340px]:px-2.5 sm:px-9 py-3 text-center leading-snug sm:whitespace-nowrap"
          >
            <ClipboardCheck size={20} className="mr-2 shrink-0 hidden min-[360px]:inline" aria-hidden /> {BRAND.ctaPrimary}
            <ArrowRight size={20} className="ml-2 shrink-0 hidden min-[420px]:inline transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </div>
      </section>
    </div>
  );
}
