import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";

export function PageHeader({ eyebrow, title, description, className }: { eyebrow?: string; title: string; description?: string; className?: string }) {
  return (
    <header className={cn("mb-8", className)}>
      {eyebrow && <p className="text-sm font-semibold uppercase tracking-wide text-primary mb-2">{eyebrow}</p>}
      <h1 className="text-2xl md:text-3xl font-bold text-primary leading-tight">{title}</h1>
      {description && <p className="text-base text-muted mt-3 max-w-2xl leading-relaxed">{description}</p>}
    </header>
  );
}

export function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl md:text-2xl font-bold text-primary">{title}</h2>
      {description && <p className="text-base text-muted mt-2 max-w-2xl">{description}</p>}
    </div>
  );
}

export function TrustStrip({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-sm text-white/80">
      {items.map((item) => (
        <li key={item} className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary-light shrink-0" aria-hidden />
          {item}
        </li>
      ))}
    </ul>
  );
}

export function FeatureList({ items, icon: Icon }: { items: string[]; icon?: React.ComponentType<{ size?: number; className?: string }> }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3 text-base text-muted">
          {Icon ? <Icon size={18} className="text-primary shrink-0 mt-0.5" /> : <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />}
          {item}
        </li>
      ))}
    </ul>
  );
}

export function CategoryBadge({ label, accent }: { label: string; accent: string }) {
  return (
    <span className="text-xs font-semibold uppercase px-2.5 py-1 rounded-full border" style={{ color: accent, borderColor: `${accent}40`, backgroundColor: `${accent}12` }}>
      {label}
    </span>
  );
}

export function FreeVsPaidSummary() {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="font-bold text-primary text-lg mb-3">Kostenlos</h3>
        <FeatureList items={["Amanah-Check", "Wissensbereich", "Erste persönliche Orientierung", "Empfehlung für den nächsten Schritt"]} />
      </div>
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="font-bold text-primary text-lg mb-3">Mit kostenpflichtigem Paket</h3>
        <FeatureList items={["Strukturierte Eingabe und dauerhafte Dokumentation", "Vollständige Vorsorgemodule", "PDF-Ordner und Exporte", "Familienbrief und erweiterte Funktionen"]} />
        <p className="text-sm text-muted mt-4">Kauf derzeit in Vorbereitung — siehe <Link href="/preise" className="text-primary hover:underline">Preise</Link>.</p>
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
    <article className={cn("rounded-2xl border bg-card p-6 flex flex-col h-full", highlighted ? "border-primary ring-2 ring-primary/20" : "border-border")}>
      {highlighted && <p className="text-xs font-bold uppercase text-primary mb-2">Empfohlen</p>}
      <h3 className="text-xl font-bold text-primary">{name}</h3>
      <p className="text-3xl font-bold text-primary mt-2">{price}</p>
      <p className="text-base text-muted mt-2 mb-4">{description}</p>
      <ul className="space-y-2 flex-1 mb-6">
        {features.map((f) => (
          <li key={f} className="text-base text-muted flex gap-2">
            <span className="text-success shrink-0">✓</span> {f}
          </li>
        ))}
      </ul>
      {cta ?? (disabled ? <Button className="w-full" disabled>Noch nicht verfügbar</Button> : null)}
    </article>
  );
}
