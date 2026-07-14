import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { CHECK_LABELS } from "@/lib/design-tokens";

export function PageHeader({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <header className={cn("mb-8 md:mb-10", className)}>
      {eyebrow && (
        <p className="text-sm font-bold uppercase tracking-widest text-emerald mb-3">{eyebrow}</p>
      )}
      <h1 className="text-page-title font-bold text-foreground leading-tight">{title}</h1>
      {description && (
        <p className="text-body-lg text-muted mt-4 max-w-2xl leading-relaxed">{description}</p>
      )}
    </header>
  );
}

export function SectionHeader({
  title,
  description,
  accent,
}: {
  title: string;
  description?: string;
  accent?: string;
}) {
  return (
    <div className="mb-8">
      {accent && (
        <div className="w-12 h-1 rounded-full mb-4" style={{ backgroundColor: accent }} aria-hidden />
      )}
      <h2 className="text-section-title font-bold text-foreground">{title}</h2>
      {description && <p className="text-body-lg text-muted mt-3 max-w-2xl leading-relaxed">{description}</p>}
    </div>
  );
}

export function TrustStrip({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-5 text-sm md:text-base text-white/85">
      {items.map((item) => (
        <li key={item} className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-emerald shrink-0" aria-hidden />
          {item}
        </li>
      ))}
    </ul>
  );
}

export function FeatureList({
  items,
  icon: Icon,
}: {
  items: string[];
  icon?: React.ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3 text-body text-muted">
          {Icon ? (
            <Icon size={20} className="text-primary shrink-0 mt-0.5" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-emerald mt-2.5 shrink-0" />
          )}
          {item}
        </li>
      ))}
    </ul>
  );
}

export function CategoryBadge({ label, accent }: { label: string; accent: string }) {
  return (
    <span
      className="text-xs font-bold uppercase px-2.5 py-1 rounded-md tracking-wide"
      style={{ color: accent, backgroundColor: `${accent}18`, border: `1px solid ${accent}35` }}
    >
      {label}
    </span>
  );
}

export function FreeVsPaidSummary() {
  return (
    <div className="grid md:grid-cols-2 gap-5">
      <div className="rounded-2xl border-2 border-emerald/30 bg-accent-soft p-6 md:p-7">
        <h3 className="font-bold text-primary text-card-title mb-4">Kostenlos</h3>
        <FeatureList
          items={[
            CHECK_LABELS.nav,
            "Wissensbereich",
            "Erste persönliche Orientierung",
            "Empfehlung für den nächsten Schritt",
          ]}
        />
      </div>
      <div className="rounded-2xl border border-border bg-card p-6 md:p-7 shadow-sm">
        <h3 className="font-bold text-foreground text-card-title mb-4">Mit kostenpflichtigem Paket</h3>
        <FeatureList
          items={[
            "Strukturierte Eingabe und dauerhafte Dokumentation",
            "Vollständige Vorsorgemodule",
            "PDF-Ordner und Exporte",
            "Familienbrief und erweiterte Funktionen",
          ]}
        />
        <p className="text-sm text-muted mt-5">
          Kauf derzeit in Vorbereitung — siehe{" "}
          <Link href="/preise" className="text-primary font-semibold hover:underline">
            Preise
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

export function PricingCard({
  name,
  price,
  description,
  features,
  highlighted,
  cta,
  disabled,
}: {
  name: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  cta?: ReactNode;
  disabled?: boolean;
}) {
  return (
    <article
      className={cn(
        "rounded-2xl border bg-card flex flex-col h-full overflow-hidden shadow-sm transition-shadow hover:shadow-md",
        highlighted ? "border-primary ring-2 ring-emerald/25" : "border-border"
      )}
    >
      {highlighted && (
        <div className="bg-primary-dark text-white text-center py-2.5 text-xs font-bold uppercase tracking-widest">
          Empfohlen
        </div>
      )}
      <div className="p-7 flex flex-col flex-1">
        <h3 className="text-card-title font-bold text-foreground">{name}</h3>
        <p className="text-4xl font-bold text-primary mt-3">{price}</p>
        <p className="text-body text-muted mt-3 mb-5 leading-relaxed">{description}</p>
        <ul className="space-y-2.5 flex-1 mb-6">
          {features.map((f) => (
            <li key={f} className="text-body text-muted flex gap-2.5">
              <span className="text-emerald shrink-0 font-bold">✓</span> {f}
            </li>
          ))}
        </ul>
        {features.length === 0 && <div className="flex-1 mb-2" />}
        {cta ?? (disabled ? <Button className="w-full" disabled>Noch nicht verfügbar</Button> : null)}
      </div>
    </article>
  );
}

export function OutcomeCard({
  title,
  description,
  accent,
  icon: Icon,
}: {
  title: string;
  description: string;
  accent: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <div className="rounded-2xl bg-card border border-border p-6 md:p-7 shadow-sm hover:shadow-md hover:border-primary/25 transition-all group">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 [&_svg]:text-[var(--accent)]"
        style={{ backgroundColor: `${accent}18`, ["--accent" as string]: accent }}
      >
        <Icon size={24} aria-hidden />
      </div>
      <h3 className="text-card-title font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
        {title}
      </h3>
      <p className="text-body text-muted leading-relaxed">{description}</p>
    </div>
  );
}

export function StepCard({
  step,
  title,
  text,
  icon: Icon,
}: {
  step: string;
  title: string;
  text: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <div className="relative rounded-2xl bg-card border border-border p-6 md:p-8 shadow-sm flex flex-col">
      <span className="text-5xl font-black text-emerald/20 absolute top-4 right-6 select-none" aria-hidden>
        {step}
      </span>
      <div className="w-14 h-14 rounded-2xl bg-accent-soft flex items-center justify-center mb-5">
        <Icon size={28} className="text-primary" aria-hidden />
      </div>
      <h3 className="text-card-title font-bold text-foreground mb-2">{title}</h3>
      <p className="text-body text-muted leading-relaxed">{text}</p>
    </div>
  );
}
