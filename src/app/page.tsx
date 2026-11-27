import Image from "next/image";
import Link from "next/link";
import { TOPIC_IMAGES } from "@/lib/content/topic-images";
import { AkhiraSection } from "@/components/marketing/akhira-section";
import { HomeEntryPoints } from "@/components/marketing/home-entry-points";
import {
  SectionHeader,
  StepCard,
  TrustStrip,
} from "@/components/marketing/marketing-ui";
import { BRAND, BRAND_TRUST_ITEMS } from "@/lib/brand";
import { COLORS } from "@/lib/design-tokens";
import { START_ALWAYS_FREE, START_BASIS, START_PLUS_PLANNED, START_PLUS_STATUS, START_PREMIUM_SUMMARY } from "@/lib/billing/start-offer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { WasiyyaMark } from "@/components/layout/wasiyya-logo";
import { publicPageMetadata } from "@/lib/seo/public-pages";
import { OrganizationJsonLd } from "@/components/seo/organization-json-ld";
import {
  Activity,
  ArrowRight,
  ClipboardCheck,
  Clock3,
  Compass,
  FileSignature,
  HeartHandshake,
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
    title: "Deine Familie entlasten",
    description: "Gib deinen Angehörigen Orientierung, wenn sie in einer schwierigen Situation Entscheidungen treffen müssen.",
    accent: COLORS.catNotfall,
    slug: "familie",
  },
  {
    icon: ListChecks,
    title: "Deine Wünsche festhalten",
    description: "Dokumentiere, was dir bei Krankheit, im Notfall und nach deinem Tod wichtig ist.",
    accent: COLORS.catJanazah,
    slug: "wuensche",
  },
  {
    icon: Compass,
    title: "Nach islamischen Grundsätzen vorsorgen",
    description: "Verstehe deine religiösen Verpflichtungen und bereite deren Umsetzung im Rahmen des deutschen Rechts vor.",
    accent: COLORS.catAkhira,
    slug: "wissen",
  },
  {
    icon: Target,
    title: "Alles Wichtige an einem Ort",
    description: "Organisiere deine Wünsche, Dokumente, Verpflichtungen und Informationen für deine Angehörigen.",
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

/** Three compact benefits with gold symbols, no shared frame (owner 26.11.2026). */
function HeroBenefits({ className }: { className?: string }) {
  const items = [
    { icon: Clock3, title: "Wenige Minuten", text: "15 kurze Fragen, ohne Konto." },
    { icon: ListChecks, title: "Klare nächste Schritte", text: "Du siehst, was zuerst wichtig ist." },
    { icon: HeartHandshake, title: "Kostenlos starten", text: "Kein Abo, keine Verpflichtung." },
  ];
  return (
    <ul className={cn("grid gap-6 sm:grid-cols-3", className)} data-testid="home-hero-benefits">
      {items.map(({ icon: Icon, title, text }) => (
        <li key={title} className="flex items-start gap-4">
          <span className="w-12 h-12 rounded-full ring-1 ring-[#D4A537]/70 bg-white/[0.04] flex items-center justify-center shrink-0">
            <Icon size={22} className="text-[#F2CF6C]" aria-hidden />
          </span>
          <span>
            <span className="block text-lg font-semibold text-white">{title}</span>
            <span className="block text-base text-white/75">{text}</span>
          </span>
        </li>
      ))}
    </ul>
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
          <div className="grid lg:grid-cols-[0.92fr_1.08fr] gap-8 lg:gap-10 xl:gap-14 items-center">
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
                {BRAND.heroTitle.slice(0, BRAND.heroTitle.indexOf(".") + 1)}{" "}
                <span className="gold-text">{BRAND.heroTitle.slice(BRAND.heroTitle.indexOf(".") + 2)}</span>
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
              <div className="mt-6">
                <TrustStrip items={[...BRAND_TRUST_ITEMS]} />
              </div>
              <p className="text-sm md:text-base text-white/75 mt-4 md:mt-5 italic max-w-lg hidden sm:block">{BRAND.claim}</p>
            </div>
            <figure className="hero-image relative w-full max-w-2xl mx-auto lg:max-w-none" data-testid="home-hero-image">
              <Image
                src={TOPIC_IMAGES.startseite.src}
                alt={TOPIC_IMAGES.startseite.alt}
                width={1448}
                height={1086}
                priority
                sizes="(min-width: 1280px) 680px, (min-width: 1024px) 52vw, 100vw"
                className="w-full h-auto"
              />
            </figure>
          </div>
          <HeroBenefits className="mt-10 md:mt-14" />
        </div>
      </section>

      <HomeEntryPoints />

      <section className="py-10 md:py-18 bg-background">
        <div className="max-w-6xl mx-auto px-4">
          <SectionHeader
            title="Heute geregelt. Morgen eine Sorge weniger."
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
        </div>
      </section>

      <AkhiraSection />

      <section className="py-14 md:py-18 bg-background" data-testid="home-availability">
        <div className="max-w-7xl mx-auto px-4">
          <SectionHeader
            title="Kostenlos beginnen. Einmal bezahlen, wenn du mehr brauchst."
            description="Kein Abo. Wer später ein größeres Paket wählt, zahlt nur die Differenz."
            accent={COLORS.emerald}
          />
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <article className="gold-frame-strong rounded-2xl p-6" data-testid="home-free">
              <p className="text-xs font-bold uppercase tracking-wider text-accent">Kostenlos</p>
              <h3 className="text-card-title font-bold text-foreground mt-1">Basis</h3>
              <ul className="mt-4 space-y-2 text-sm text-muted">
                {FREE_TITLES.map((t) => (
                  <li key={t} className="flex gap-2"><span className="text-accent font-bold" aria-hidden>✓</span>{t}</li>
                ))}
              </ul>
              <p className="text-xs text-muted mt-4 pt-3 border-t border-border">{START_ALWAYS_FREE}</p>
            </article>
            <article className="on-dark rounded-2xl bg-navy text-white p-6 ring-1 ring-[#D4A537]/50" data-testid="home-plus">
              <p className="text-xs font-bold uppercase tracking-wider text-[#F2CF6C]">In Vorbereitung · einmalig</p>
              <h3 className="text-card-title font-bold mt-1">Wasiyya Vorsorge</h3>
              <ul className="mt-4 space-y-2 text-sm text-white/85">
                {START_PLUS_PLANNED.slice(0, 3).map((t) => (
                  <li key={t} className="flex gap-2"><span className="text-[#F2CF6C]" aria-hidden>✓</span>{t}</li>
                ))}
              </ul>
            </article>
            <article className="gold-frame rounded-2xl p-6" data-testid="home-komplett">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">In Vorbereitung · einmalig</p>
              <h3 className="text-card-title font-bold text-foreground mt-1">Wasiyya Komplett</h3>
              <p className="text-sm text-muted mt-3">Vorsorge und Testament vorbereiten. Die Testament-Vorbereitung folgt erst nach juristischer Prüfung.</p>
            </article>
            <article className="gold-frame rounded-2xl p-6" data-testid="home-pending">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">Später · individuell</p>
              <h3 className="text-card-title font-bold text-foreground mt-1">Premium – Rundum-sorglos</h3>
              <p className="text-sm text-muted mt-3">{START_PREMIUM_SUMMARY}</p>
            </article>
          </div>
          <p className="text-sm text-muted mt-6">{START_PLUS_STATUS}</p>
          <Link href="/preise" className="inline-block mt-6">
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
