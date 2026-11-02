import { getPublicWissenTopics } from "@/lib/knowledge/wissen-topics";
import { WISSEN_META } from "@/lib/knowledge/wissen-meta";
import { KnowledgeAreasOverview } from "@/components/islamic-knowledge/knowledge-areas-overview";
import { WissenHubView } from "@/components/wissen/wissen-hub-view";
import { getPublishedArticles, plannedTopics } from "@/modules/islamic-knowledge";

/** Filters on the server: only reviewed texts and the titles of planned topics reach the browser. */
export default function WissenPage() {
  return (
    <WissenHubView
      topics={getPublicWissenTopics().map((t) => ({ ...t, wissenMeta: WISSEN_META[t.id] }))}
      publishedArticles={getPublishedArticles()}
      plannedTopics={plannedTopics()}
      areasOverview={<KnowledgeAreasOverview />}
    />
  );
}
