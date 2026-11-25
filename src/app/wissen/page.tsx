import { getPublicWissenTopics } from "@/lib/knowledge/wissen-topics";
import { WISSEN_META } from "@/lib/knowledge/wissen-meta";
import { KnowledgeAreasOverview } from "@/components/islamic-knowledge/knowledge-areas-overview";
import { WissenHubView } from "@/components/wissen/wissen-hub-view";
import { getPublishedArticles, plannedTopics } from "@/modules/islamic-knowledge";
import { isKnowledgePreviewEnabled } from "@/lib/flags/knowledge-preview";
import { KnowledgeCentrePreviewEntry } from "@/components/knowledge/zentrum/preview-entry";
import { publicPageMetadata } from "@/lib/seo/public-pages";

export const metadata = publicPageMetadata("/wissen");

/** The preview entry depends on a runtime switch (P2.7), so the page is rendered per request. */
export const dynamic = "force-dynamic";

/** Filters on the server: only reviewed texts and the titles of planned topics reach the browser. */
export default function WissenPage() {
  return (
    <>
      {isKnowledgePreviewEnabled() && <KnowledgeCentrePreviewEntry />}
      <WissenHubView
      topics={getPublicWissenTopics().map((t) => ({ ...t, wissenMeta: WISSEN_META[t.id] }))}
      publishedArticles={getPublishedArticles()}
      plannedTopics={plannedTopics()}
      areasOverview={<KnowledgeAreasOverview />}
      />
    </>
  );
}
