import Link from "next/link";
import { moduleConfigs } from "@/lib/modules/config";
import { COLORS } from "@/lib/design-tokens";
import { cn } from "@/lib/utils/cn";
import { ArrowRight, ClipboardCheck, CreditCard, UserPlus } from "lucide-react";

const FEATURED_MODULE_IDS = [
  "notfallkarte",
  "janazah",
  "vollmacht",
  "testament",
  "digitaler-nachlass",
  "familie",
] as const;

const QUICK_LINKS = [
  {
    title: "Vorsorge-Check",
    text: "Kostenlos prüfen, was noch fehlt",
    href: "/check",
    icon: ClipboardCheck,
    accent: COLORS.catNotfall,
    testId: "dashboard-tile-check",
  },
  {
    title: "Preise",
    text: "Kostenlos vs. Pakete im Überblick",
    href: "/preise",
    icon: CreditCard,
    accent: COLORS.emerald,
    testId: "dashboard-tile-preise",
  },
  {
    title: "Konto erstellen",
    text: "Vorsorge dauerhaft sichern",
    href: "/register",
    icon: UserPlus,
    accent: COLORS.catAkhira,
    testId: "dashboard-tile-register",
  },
] as const;

export function ModuleTiles() {
  const modules = FEATURED_MODULE_IDS.map((id) => moduleConfigs.find((m) => m.id === id)).filter(Boolean);

  return (
    <section aria-label="Vorsorgemodule" data-testid="dashboard-module-tiles">
      <h2 className="text-section-title font-bold text-foreground mb-2">Deine Vorsorgemodule</h2>
      <p className="text-body text-muted mb-5 max-w-2xl">Direkt zu den Bereichen, die du vorbereiten kannst.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((mod) => (
          <Link
            key={mod!.id}
            href={mod!.path}
            data-testid={`dashboard-tile-${mod!.id}`}
            aria-label={`${mod!.title} öffnen`}
            className={cn(
              "group rounded-2xl border-2 border-border bg-card p-5 min-h-[44px]",
              "hover:border-primary/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/50",
              "active:scale-[0.99] transition-all flex flex-col"
            )}
          >
            <span className="text-2xl mb-3" aria-hidden>
              {mod!.icon}
            </span>
            <h3 className="text-card-title font-bold text-primary-dark group-hover:text-primary transition-colors">
              {mod!.title}
            </h3>
            <p className="text-sm text-muted mt-2 leading-relaxed flex-1">{mod!.description}</p>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary mt-4 group-hover:gap-2.5 transition-all">
              Modul öffnen <ArrowRight size={16} aria-hidden />
            </span>
          </Link>
        ))}
        {QUICK_LINKS.map(({ title, text, href, icon: Icon, accent, testId }) => (
          <Link
            key={href}
            href={href}
            data-testid={testId}
            aria-label={`${title} öffnen`}
            className={cn(
              "group rounded-2xl border-2 border-border bg-background p-5 min-h-[44px]",
              "hover:border-primary/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/50",
              "active:scale-[0.99] transition-all flex flex-col"
            )}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center mb-3 [&_svg]:text-[var(--tile-accent)]"
              style={{ backgroundColor: `${accent}18`, ["--tile-accent" as string]: accent }}
            >
              <Icon size={22} aria-hidden />
            </div>
            <h3 className="text-card-title font-bold text-primary-dark group-hover:text-primary transition-colors">{title}</h3>
            <p className="text-sm text-muted mt-2 leading-relaxed flex-1">{text}</p>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary mt-4 group-hover:gap-2.5 transition-all">
              Öffnen <ArrowRight size={16} aria-hidden />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
