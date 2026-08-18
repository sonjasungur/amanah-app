import Link from "next/link";
import { moduleConfigs } from "@/lib/modules/config";
import { COLORS } from "@/lib/design-tokens";
import { cn } from "@/lib/utils/cn";
import { ArrowRight, ClipboardCheck } from "lucide-react";

export function ModuleTiles() {
  return (
    <section aria-label="Alle Vorsorgebereiche" data-testid="dashboard-module-tiles">
      <details className="rounded-2xl border border-border bg-card p-5 md:p-6">
        <summary
          className="cursor-pointer font-semibold text-foreground min-h-[44px] flex items-center justify-between gap-3"
          data-testid="dashboard-all-areas-toggle"
        >
          <span>
            Alle Vorsorgebereiche
            <span className="block text-sm font-normal text-muted mt-1">Gespeicherte Angaben und Formulare</span>
          </span>
        </summary>
        <div className="grid sm:grid-cols-2 gap-3 mt-5">
          <Link
            href="/check"
            data-testid="dashboard-tile-check"
            className={cn(
              "group rounded-xl border border-border bg-background p-4 min-h-[44px]",
              "hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/50"
            )}
          >
            <ClipboardCheck size={20} className="text-primary mb-2" aria-hidden />
            <h3 className="font-bold text-primary-dark">Vorsorge-Check</h3>
            <p className="text-sm text-muted mt-1">Kostenlos prüfen, was noch fehlt</p>
          </Link>
          {moduleConfigs.map((mod) => (
            <Link
              key={mod.id}
              href={mod.path}
              data-testid={`dashboard-tile-${mod.id}`}
              aria-label={`${mod.title} öffnen`}
              className={cn(
                "group rounded-xl border border-border bg-background p-4 min-h-[44px]",
                "hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/50",
                "flex flex-col"
              )}
            >
              <span className="text-xl mb-2" aria-hidden>
                {mod.icon}
              </span>
              <h3 className="font-bold text-primary-dark group-hover:text-primary">{mod.title}</h3>
              <p className="text-sm text-muted mt-1 flex-1">{mod.description}</p>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary mt-3">
                Öffnen <ArrowRight size={14} aria-hidden />
              </span>
            </Link>
          ))}
        </div>
        <p className="text-xs text-muted mt-4" style={{ color: COLORS.muted }}>
          „Mein Ordner“ meint hier gespeicherte Angaben — der Überblick bleibt dein Vorsorgeplan.
        </p>
      </details>
    </section>
  );
}
