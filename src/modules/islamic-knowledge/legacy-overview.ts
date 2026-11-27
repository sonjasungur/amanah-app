import { getEditorialQueue } from "./publication";
import { FULL_ARTICLES, type FullArticle } from "./full-articles";

/**
 * AP22 EA-05.7: the older catalog (KNOWLEDGE_CATALOG, 44 entries: old articles, culture filter cards, page texts and
 * start drafts) next to the knowledge centre (33 articles). The centre is the main stock; every catalog entry says
 * which centre article replaces it (from the articles' own `replacesExisting`) and which other catalog entries cover
 * the same sub-topic (likely duplicates). Server only.
 */
export interface LegacyEntry {
  id: string;
  title: string;
  area: string;
  subtopicId: string;
  origin: string;
  statusLabel: string;
  replacedBy: FullArticle[];
  /** Other catalog entries on the same sub-topic. */
  sameTopic: { id: string; title: string }[];
}

/** `replacesExisting` names catalog ids with or without the "ik-" prefix. */
const matches = (catalogId: string, named: string) => catalogId === named || catalogId === `ik-${named}`;

export function legacyCatalogOverview(): LegacyEntry[] {
  const queue = getEditorialQueue();
  return queue.map(({ article }) => ({
    id: article.id,
    title: article.title,
    area: article.area,
    subtopicId: article.subtopicId,
    origin: article.legacy?.file ?? (article.id.startsWith("ik-start-") ? "Startentwurf" : "Katalog"),
    statusLabel: article.status,
    replacedBy: FULL_ARTICLES.filter((a) => a.replacesExisting.some((r) => matches(article.id, r))),
    sameTopic: queue
      .filter((o) => o.article.id !== article.id && o.article.subtopicId === article.subtopicId && o.article.area === article.area)
      .map((o) => ({ id: o.article.id, title: o.article.title })),
  }));
}

export function legacyCatalogCounts(entries = legacyCatalogOverview()) {
  return {
    total: entries.length,
    replaced: entries.filter((e) => e.replacedBy.length > 0).length,
    withDuplicates: entries.filter((e) => e.sameTopic.length > 0).length,
  };
}
