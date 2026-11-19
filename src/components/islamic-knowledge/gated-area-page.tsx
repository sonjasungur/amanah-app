import Link from "next/link";
import { KnowledgeAreasOverview } from "@/components/islamic-knowledge/knowledge-areas-overview";
import type { KnowledgeAreaId } from "@/modules/islamic-knowledge";

/**
 * Former topic pages (Janazah-Kompass, Barzakh, …) show religious content only
 * through the knowledge-centre publication gate.
 */
export function GatedAreaPage({
  eyebrow,
  title,
  intro,
  areaIds,
  cta,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  areaIds: KnowledgeAreaId[];
  /** Optional link to the matching planning module — kept below the knowledge content. */
  cta?: { href: string; label: string };
}) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8">
        <p className="text-accent font-medium mb-2">{eyebrow}</p>
        <h1 className="text-3xl font-bold text-primary mb-3">{title}</h1>
        <p className="text-muted leading-relaxed">{intro}</p>
      </div>
      <KnowledgeAreasOverview areaIds={areaIds} />
      {cta && (
        <p className="mt-8">
          <Link href={cta.href} className="text-primary font-semibold hover:underline">
            {cta.label}
          </Link>
        </p>
      )}
      <p className="mt-8 text-sm text-muted">
        Das islamische Wissenszentrum ist dauerhaft kostenlos und ohne Konto lesbar.{" "}
        <Link href="/wissen" className="text-primary font-medium hover:underline">
          Zum Wissenszentrum
        </Link>
      </p>
    </div>
  );
}
