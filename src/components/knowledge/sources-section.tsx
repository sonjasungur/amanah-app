import { getSourcesByIds } from "@/lib/knowledge/sources";
import type { ReviewStatus } from "@/lib/types";

interface SourcesSectionProps {
  sourceIds: string[];
  reviewStatus?: ReviewStatus;
}

export function ReviewBadge({ status }: { status: ReviewStatus }) {
  if (status === "reviewed") return null;
  if (status === "draft") return null;
  return (
    <span className="inline-flex items-center rounded-full bg-warning/20 text-warning px-3 py-1 text-xs font-medium">
      In fachlicher Prüfung
    </span>
  );
}

export function SourcesSection({ sourceIds, reviewStatus }: SourcesSectionProps) {
  const sources = getSourcesByIds(sourceIds);
  if (sources.length === 0) return null;

  return (
    <section className="mt-8 rounded-2xl bg-sand/50 border border-primary/10 p-6">
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-lg font-semibold text-primary">Quellen & Hinweise</h3>
        {reviewStatus && <ReviewBadge status={reviewStatus} />}
      </div>
      <ul className="space-y-3">
        {sources.map((source) => (
          <li key={source.id} className="text-sm">
            <span className="font-medium text-primary capitalize">{source.type}: </span>
            <span>{source.reference}</span>
            {source.translationDe && (
              <p className="text-muted mt-1 italic">&ldquo;{source.translationDe}&rdquo;</p>
            )}
            {source.url && (
              <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-primary-light underline text-xs block mt-1">
                {source.url}
              </a>
            )}
            {source.note && <p className="text-xs text-muted mt-1">{source.note}</p>}
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted mt-4">Bei Detailfragen bitte Imam/Gelehrte fragen.</p>
    </section>
  );
}
