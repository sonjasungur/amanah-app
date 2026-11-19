import Link from "next/link";
import { KNOWLEDGE_AREAS, getAreaCoverage, getPublishedByArea, type KnowledgeAreaId } from "@/modules/islamic-knowledge";

/**
 * Structure of the free knowledge centre. Shows only published articles;
 * everything else is listed as "in fachlicher Prüfung" without content.
 */
export function KnowledgeAreasOverview({ areaIds }: { areaIds?: KnowledgeAreaId[] }) {
  const coverage = new Map(getAreaCoverage().map((c) => [c.areaId, c]));
  const areas = areaIds ? KNOWLEDGE_AREAS.filter((a) => areaIds.includes(a.id)) : KNOWLEDGE_AREAS;

  return (
    <div className="grid gap-4 md:grid-cols-2" data-testid="knowledge-areas">
      {areas.map((area) => {
        const published = getPublishedByArea(area.id);
        const total = coverage.get(area.id)?.subtopics.length ?? 0;
        return (
          <section key={area.id} className="rounded-2xl border border-border bg-card p-5" aria-labelledby={`area-${area.id}`}>
            <p className="text-xs font-semibold text-muted mb-1">Bereich {area.letter}</p>
            <h3 id={`area-${area.id}`} className="text-lg font-bold text-primary mb-1">{area.title}</h3>
            <p className="text-sm text-muted mb-3">{area.description}</p>
            {published.length > 0 ? (
              <ul className="space-y-1">
                {published.map((a) => (
                  <li key={a.id}>
                    <Link href={`/wissen/islam/${a.slug}`} className="text-sm font-medium text-primary hover:underline min-h-[44px] inline-flex items-center">
                      {a.title}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">
                {total} Themen in Vorbereitung. Artikel erscheinen erst nach Quellen- und Gelehrtenprüfung
                {area.legalReviewRequired ? " sowie juristischer Fachprüfung" : ""}.
              </p>
            )}
          </section>
        );
      })}
    </div>
  );
}
