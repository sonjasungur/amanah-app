import { KNOWLEDGE_CATALOG } from "./catalog";
import { KNOWLEDGE_AREAS } from "./structure";
import { matchesQuery, rankPublished, type PreparedTopic } from "./search-text";
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
  return rankPublished(query, getPublishedArticles(catalog));
}

/** Titles of topics without a published article. No content, no links. */
export function plannedTopics(catalog = KNOWLEDGE_CATALOG): PreparedTopic[] {
  return getAreaCoverage(catalog).flatMap((coverage) => {
    const area = KNOWLEDGE_AREAS.find((a) => a.id === coverage.areaId)!;
    return coverage.subtopics
      .filter((s) => s.published === 0)
      .map((s) => ({ id: s.id, title: s.title, areaTitle: area.title }));
  });
}

export function searchPreparedTopics(query: string, catalog = KNOWLEDGE_CATALOG): PreparedTopic[] {
  return plannedTopics(catalog).filter((t) => matchesQuery(query, [t.title]));
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
