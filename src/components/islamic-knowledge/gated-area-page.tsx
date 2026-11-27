import Link from "next/link";
import { KnowledgeAreasOverview } from "@/components/islamic-knowledge/knowledge-areas-overview";
import { TopicFunctionLinks, TopicHero, type TopicAction } from "@/components/marketing/topic-page";
import type { TopicImageId } from "@/lib/content/topic-images";
import type { KnowledgeAreaId } from "@/modules/islamic-knowledge";

/**
 * Former topic pages (Janazah-Kompass, Barzakh, …) show religious content only
 * through the knowledge-centre publication gate. Each page links to the matching functions of the
 * planning folder (owner order 25.11.2026).
 */
export function GatedAreaPage({
  eyebrow,
  title,
  intro,
  areaIds,
  actions = [],
  image,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  areaIds: KnowledgeAreaId[];
  /** Matching planning functions — kept below the knowledge content. */
  actions?: readonly TopicAction[];
  image?: TopicImageId;
}) {
  return (
    <div>
      <TopicHero eyebrow={eyebrow} title={title} intro={<p>{intro}</p>} image={image} />
      <div className="max-w-7xl mx-auto px-4 py-10 md:py-14">
        <div className="max-w-4xl">
          <KnowledgeAreasOverview areaIds={areaIds} />
        </div>
        <TopicFunctionLinks actions={actions} />
        <p className="mt-10 text-sm text-muted">
          Das islamische Wissenszentrum ist dauerhaft kostenlos und ohne Konto lesbar.{" "}
          <Link href="/wissen" className="text-primary font-medium hover:underline">
            Zum Wissenszentrum
          </Link>
        </p>
      </div>
    </div>
  );
}
