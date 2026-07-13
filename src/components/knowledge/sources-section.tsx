import { getSourcesByIds, getPrimarySourcesByIds } from "@/lib/knowledge/sources";
import { PrimarySourceCard } from "@/components/ui/primary-source-card";
import type { ReviewStatus } from "@/lib/types";
import { ExternalLink } from "lucide-react";

interface SourcesSectionProps {
  sourceIds: string[];
  reviewStatus?: ReviewStatus;
  hidePrimary?: boolean;
}

export function ReviewBadge({ status }: { status: ReviewStatus }) {
  if (status === "reviewed") {
    return <span className="text-xs font-medium text-success bg-success/10 px-2 py-0.5 rounded-full">Geprüft</span>;
  }
  return <span className="text-xs font-medium text-warning bg-warning/10 px-2 py-0.5 rounded-full">Fachlich prüfen</span>;
}

export function SourcesSection({ sourceIds, reviewStatus, hidePrimary }: SourcesSectionProps) {
  const sources = getSourcesByIds(sourceIds);
  const primarySources = hidePrimary ? [] : getPrimarySourcesByIds(sourceIds);
  const otherSources = sources.filter((s) => s.type !== "quran" && s.type !== "hadith");

  if (sources.length === 0) {
    return (
      <section className="mt-8 rounded-2xl bg-sand/50 border border-primary/10 p-6">
        <h3 className="text-lg font-semibold text-primary mb-2">Quellen & Status</h3>
        <p className="text-sm text-muted">Ausgangspunkt zur Orientierung — Details mit Imam/Gelehrten, Anwalt oder Arzt klären.</p>
        {reviewStatus && <div className="mt-3"><ReviewBadge status={reviewStatus} /></div>}
      </section>
    );
  }

  return (
    <section className="mt-8 space-y-4">
      <div className="flex items-center gap-3">
        <h3 className="text-lg font-semibold text-primary">Quellen & Hinweise</h3>
        {reviewStatus && <ReviewBadge status={reviewStatus} />}
      </div>
      <p className="text-xs text-muted">Keine pauschalen Rechts- oder Religionsurteile — bei Janazah/Ghusl mit Imam klären; bei Vorsorge/Testament rechtlich prüfen lassen.</p>
      {primarySources.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-primary">Islamische Primärquellen (Qur&apos;an, Sahih al-Bukhari, Sahih Muslim)</h4>
          {primarySources.map((source) => (
            <PrimarySourceCard key={source.id} source={source} />
          ))}
        </div>
      )}
      {otherSources.length > 0 && (
        <div className="rounded-xl border border-primary/10 bg-card p-4">
          <h4 className="text-sm font-semibold text-primary mb-3">Weitere Hinweise & offizielle Quellen</h4>
          <div className="grid gap-3">
            {otherSources.map((source) => (
              <div key={source.id} className="rounded-lg bg-sand/50 p-3 text-sm">
                <p className="font-medium text-primary">{source.title}</p>
                <p className="text-muted text-xs mt-1">{source.reference}</p>
                {source.note && <p className="text-xs text-muted mt-2">{source.note}</p>}
                {source.type === "fiqh" && (
                  <p className="text-xs text-muted mt-2 italic">Praktische Einordnung — keine Primärquelle. Details mit Imam/Gelehrten klären.</p>
                )}
                {source.url && (
                  <a href={source.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-accent text-xs font-medium mt-2 hover:underline">
                    Quelle öffnen <ExternalLink size={12} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
