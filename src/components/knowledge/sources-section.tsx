import { getSourcesByIds, getPrimarySourcesByIds } from "@/lib/knowledge/sources";
import { SOURCE_SECTION_LABELS, SOURCE_SECTION_ORDER, auditCategoryForType } from "@/lib/knowledge/source-categories";
import { PrimarySourceCard } from "@/components/ui/primary-source-card";
import type { IslamicSource, ReviewStatus, SourceAuditCategory } from "@/lib/types";
import { ExternalLink } from "lucide-react";

interface SourcesSectionProps {
  sourceIds: string[];
  reviewStatus?: ReviewStatus;
  hidePrimary?: boolean;
  defaultCollapsed?: boolean;
}

export function ReviewBadge({ status }: { status: ReviewStatus }) {
  if (status === "reviewed") {
    return <span className="text-xs font-medium text-success bg-success/10 px-2 py-0.5 rounded-full">Geprüft</span>;
  }
  return (
    <span className="text-xs font-medium text-warning bg-warning/10 px-2 py-0.5 rounded-full">
      Fachliche Prüfung erforderlich
    </span>
  );
}

function groupByAuditCategory(sources: IslamicSource[]): Map<SourceAuditCategory, IslamicSource[]> {
  const map = new Map<SourceAuditCategory, IslamicSource[]>();
  for (const s of sources) {
    const cat = auditCategoryForType(s.type, s.auditCategory);
    const list = map.get(cat) ?? [];
    list.push(s);
    map.set(cat, list);
  }
  return map;
}

export function SourcesSection({
  sourceIds,
  reviewStatus,
  hidePrimary,
  defaultCollapsed = true,
}: SourcesSectionProps) {
  const sources = getSourcesByIds(sourceIds);
  const primarySources = hidePrimary ? [] : getPrimarySourcesByIds(sourceIds);
  const nonPrimary = sources.filter((s) => s.type !== "quran" && s.type !== "hadith");
  const grouped = groupByAuditCategory(nonPrimary);

  if (sources.length === 0) {
    return (
      <section className="mt-8 rounded-2xl bg-sand/60 border-2 border-border p-6">
        <h3 className="text-lg font-bold text-primary-dark mb-2">Quellen und Status</h3>
        <p className="text-sm text-muted">Ausgangspunkt zur Orientierung — Details mit Imam/Gelehrten, Anwalt oder Arzt klären.</p>
        {reviewStatus && (
          <div className="mt-3">
            <ReviewBadge status={reviewStatus} />
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="mt-8 space-y-5 rounded-2xl border-2 border-border bg-sand/40 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-lg font-bold text-primary-dark">Quellen und Status</h3>
        {reviewStatus && <ReviewBadge status={reviewStatus} />}
      </div>
      <p className="text-xs text-muted">
        Keine pauschalen Rechts- oder Religionsurteile — bei Janazah/Ghusl mit Imam klären; bei Vorsorge/Testament rechtlich prüfen lassen.
      </p>

      {primarySources.length > 0 && !hidePrimary && (
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-primary-dark">{SOURCE_SECTION_LABELS.SAHIH_PRIMARY}</h4>
          {primarySources.map((source) => (
            <PrimarySourceCard key={source.id} source={source} defaultOpen={!defaultCollapsed && primarySources.length <= 2} />
          ))}
        </div>
      )}

      {SOURCE_SECTION_ORDER.filter((c) => c !== "QURAN_PRIMARY" && c !== "SAHIH_PRIMARY").map((cat) => {
        const items = grouped.get(cat);
        if (!items?.length) return null;
        const isLegal = cat === "LEGAL_GERMANY";
        return (
          <div
            key={cat}
            className={`rounded-xl border-2 p-4 ${isLegal ? "border-cat-vermoegen/30 bg-[#FDF8F0]" : "border-border bg-card"}`}
          >
            <h4 className="text-sm font-bold text-primary-dark mb-3">{SOURCE_SECTION_LABELS[cat]}</h4>
            <div className="grid gap-3">
              {items.map((source) => (
                <div key={source.id} className="rounded-lg bg-background/80 p-3 text-sm border border-border">
                  <p className="font-semibold text-foreground">{source.title}</p>
                  <p className="text-muted text-xs mt-1">{source.reference}</p>
                  {source.translationDe && <p className="text-xs text-muted mt-2">{source.translationDe}</p>}
                  {source.note && <p className="text-xs text-muted mt-2 italic">{source.note}</p>}
                  {source.url && (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary text-xs font-semibold mt-2 hover:underline min-h-[44px]"
                    >
                      Quelle öffnen <ExternalLink size={12} aria-hidden />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}
