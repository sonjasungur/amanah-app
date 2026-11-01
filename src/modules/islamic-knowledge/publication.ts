import { KNOWLEDGE_CATALOG } from "./catalog";
import { KNOWLEDGE_AREAS } from "./structure";
import { matchesQuery, normalizeSearchText, searchTerms, termMatches } from "./search-text";
import type { KnowledgeAreaId, KnowledgeArticleRecord } from "./types";
import { blockingSources } from "./source-verification";
import { allSourceIds, describeMissingReviews, isPublishable, structuralIssues } from "./workflow";

export function getPublishedArticles(catalog: KnowledgeArticleRecord[] = KNOWLEDGE_CATALOG): KnowledgeArticleRecord[] {
  return catalog.filter(isPublishable);
}

export function getPublishedArticleBySlug(slug: string, catalog = KNOWLEDGE_CATALOG): KnowledgeArticleRecord | undefined {
  return getPublishedArticles(catalog).find((a) => a.slug === slug);
}

export function getPublishedByArea(area: KnowledgeAreaId, catalog = KNOWLEDGE_CATALOG): KnowledgeArticleRecord[] {
  return getPublishedArticles(catalog).filter((a) => a.area === area);
}

/** Related links only ever point to published articles. */
export function getRelatedPublished(article: KnowledgeArticleRecord, catalog = KNOWLEDGE_CATALOG): KnowledgeArticleRecord[] {
  const published = getPublishedArticles(catalog);
  return article.relatedSlugs
    .map((slug) => published.find((a) => a.slug === slug))
    .filter((a): a is KnowledgeArticleRecord => Boolean(a));
}

/** Full-text search over published articles only. */
export function searchPublished(query: string, catalog = KNOWLEDGE_CATALOG): KnowledgeArticleRecord[] {
  const terms = searchTerms(query);
  if (terms.length === 0) return [];
  return getPublishedArticles(catalog)
    .map((a) => {
      const title = normalizeSearchText(a.title);
      const text = normalizeSearchText(`${a.summary} ${a.body} ${a.differingOpinions ?? ""}`);
      const score = terms.reduce((s, t) => s + (termMatches(t, title) ? 3 : 0) + (termMatches(t, text) ? 1 : 0), 0);
      return { a, score, all: terms.every((t) => termMatches(t, title) || termMatches(t, text)) };
    })
    .filter((r) => r.all)
    .sort((x, y) => y.score - x.score)
    .map((r) => r.a);
}

/**
 * Planned topics that match a query and have no published article yet. Titles from the public
 * area overview only: never draft text, never a link.
 */
export function searchPreparedTopics(query: string, catalog = KNOWLEDGE_CATALOG): { id: string; title: string; areaTitle: string }[] {
  return getAreaCoverage(catalog).flatMap((coverage) => {
    const area = KNOWLEDGE_AREAS.find((a) => a.id === coverage.areaId)!;
    return coverage.subtopics
      .filter((s) => s.published === 0 && matchesQuery(query, [s.title]))
      .map((s) => ({ id: s.id, title: s.title, areaTitle: area.title }));
  });
}

export interface AreaCoverage {
  areaId: KnowledgeAreaId;
  subtopics: { id: string; title: string; total: number; published: number }[];
  total: number;
  published: number;
}

export function getAreaCoverage(catalog = KNOWLEDGE_CATALOG): AreaCoverage[] {
  return KNOWLEDGE_AREAS.map((area) => {
    const inArea = catalog.filter((a) => a.area === area.id);
    const subtopics = area.subtopics.map((s) => {
      const items = inArea.filter((a) => a.subtopicId === s.id);
      return { id: s.id, title: s.title, total: items.length, published: items.filter(isPublishable).length };
    });
    return {
      areaId: area.id,
      subtopics,
      total: inArea.length,
      published: inArea.filter(isPublishable).length,
    };
  });
}

export function getEditorialQueue(catalog = KNOWLEDGE_CATALOG) {
  return catalog.map((a) => ({
    article: a,
    missing: describeMissingReviews(a),
    blockedSources: blockingSources(allSourceIds(a)),
    issues: structuralIssues(a),
    public: isPublishable(a),
  }));
}
