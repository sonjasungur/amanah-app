import { KNOWLEDGE_CATALOG } from "./catalog";
import { KNOWLEDGE_AREAS } from "./structure";
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

function normalize(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯʾʿ]/g, "");
}

/** Full-text search over published articles only. */
export function searchPublished(query: string, catalog = KNOWLEDGE_CATALOG): KnowledgeArticleRecord[] {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];
  return getPublishedArticles(catalog)
    .map((a) => {
      const title = normalize(a.title);
      const text = normalize(`${a.summary} ${a.body} ${a.differingOpinions ?? ""}`);
      const score = terms.reduce((s, t) => s + (title.includes(t) ? 3 : 0) + (text.includes(t) ? 1 : 0), 0);
      return { a, score, all: terms.every((t) => title.includes(t) || text.includes(t)) };
    })
    .filter((r) => r.all)
    .sort((x, y) => y.score - x.score)
    .map((r) => r.a);
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
