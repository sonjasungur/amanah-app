import Link from "next/link";
import { ArrowRight, BookOpen, FolderHeart, Moon, Scale } from "lucide-react";
import { COLORS } from "@/lib/design-tokens";

const ENTRY_POINTS = [
  {
    id: "wissen",
    icon: BookOpen,
    title: "Islamisches Wissen",
    text: "Erbe, Tod, Janazah und Vorsorge — veröffentlicht erst nach fachlicher Prüfung der Quellen.",
    badge: "Dauerhaft kostenlos, ohne Registrierung",
    href: "/wissen",
    cta: "Wissen lesen",
    accent: COLORS.catAkhira,
  },
  {
    id: "vorsorge",
    icon: FolderHeart,
    title: "Meine Vorsorge",
    text: "Notfallkarte, wichtige Dokumente und Familienbrief an einem Ort.",
    badge: "Mit dem kostenlosen Check beginnen",
    href: "/check",
    cta: "Vorsorge starten",
    accent: COLORS.catNotfall,
  },
  {
    id: "testament",
    icon: Scale,
    title: "Mein Testament",
    text: "Erbprofil und Wünsche als Vorbereitung für das Gespräch mit Anwalt oder Notar.",
    badge: "Vorbereitung — erstellt kein Testament",
    href: "/dashboard/testament",
    cta: "Erbprofil vorbereiten",
    accent: COLORS.catVermogen,
  },
  {
    id: "janazah",
    icon: Moon,
    title: "Janazah",
    text: "Wünsche zu Ghusl, Kafan, Gebet und Beisetzung festhalten.",
    badge: "Schritt für Schritt",
    href: "/dashboard/janazah",
    cta: "Wünsche festhalten",
    accent: COLORS.catJanazah,
  },
] as const;

/** Four equal entry points directly below the hero. */
export function HomeEntryPoints() {
  return (
    <section className="py-10 md:py-14 bg-background" aria-labelledby="home-entry-heading">
      <div className="max-w-6xl mx-auto px-4">
        <h2 id="home-entry-heading" className="text-section-title font-bold text-foreground mb-6">
          Womit möchtest du beginnen?
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="home-entry-points">
          {ENTRY_POINTS.map(({ id, icon: Icon, title, text, badge, href, cta, accent }) => (
            <Link
              key={id}
              href={href}
              data-testid={`home-entry-${id}`}
              className="group rounded-2xl border-2 border-border bg-card p-5 md:p-6 flex flex-col hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/50 transition-colors"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 [&_svg]:text-[var(--entry-accent)]"
                style={{ backgroundColor: `${accent}18`, ["--entry-accent" as string]: accent }}
              >
                <Icon size={24} aria-hidden />
              </div>
              <h3 className="text-card-title font-bold text-foreground mb-1">{title}</h3>
              <p className="text-xs font-semibold text-muted mb-2">{badge}</p>
              <p className="text-body text-muted leading-relaxed flex-1">{text}</p>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary mt-4 group-hover:gap-2 transition-all">
                {cta} <ArrowRight size={14} aria-hidden />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
