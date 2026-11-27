import { getPublicWissenTopics } from "@/lib/knowledge/wissen-topics";
import { WISSEN_META } from "@/lib/knowledge/wissen-meta";
import { KnowledgeAreasOverview } from "@/components/islamic-knowledge/knowledge-areas-overview";
import { WissenHubView } from "@/components/wissen/wissen-hub-view";
import { getPublishedArticles, plannedTopics } from "@/modules/islamic-knowledge";
import { isKnowledgePreviewEnabled } from "@/lib/flags/knowledge-preview";
import { redirect } from "next/navigation";
import { publicPageMetadata } from "@/lib/seo/public-pages";

export const metadata = publicPageMetadata("/wissen");

/** The preview switch (P2.7) is read at runtime, so the page is rendered per request. */
export const dynamic = "force-dynamic";

/**
 * AP22 EA-05.1: where the knowledge centre preview is on (staging behind its password, local development),
 * "Islamisches Wissen" leads straight into the new centre; a search term is carried over. Where it is off
 * (production), this page is exactly the former public overview: only reviewed texts and the titles of planned
 * topics reach the browser.
 */
export default async function WissenPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  if (isKnowledgePreviewEnabled()) {
    const q = (await searchParams).q;
    const term = typeof q === "string" ? q.trim().slice(0, 120) : "";
    redirect(term ? `/wissen/zentrum/suche?q=${encodeURIComponent(term)}` : "/wissen/zentrum");
  }
  return (
    <WissenHubView
      topics={getPublicWissenTopics().map((t) => ({ ...t, wissenMeta: WISSEN_META[t.id] }))}
      publishedArticles={getPublishedArticles()}
      plannedTopics={plannedTopics()}
      areasOverview={<KnowledgeAreasOverview />}
    />
  );
}
