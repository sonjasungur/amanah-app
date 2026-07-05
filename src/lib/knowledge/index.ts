import type { KnowledgeArticle } from "@/lib/types";
import type { KnowledgeEntry, KnowledgeLanguage } from "./types";
import { getAllEntries, getProductionEntries, getEntryById, getReviewedEntries, getEntriesNeedingReview, getFaqEntries } from "./entries";
import { keywordSearchOrFallback } from "./search";
import { retrieveKnowledgeSync, retrieveKnowledge } from "./retrieval";
import { toPublicEntry, toPublicEntryDetail, toCitation } from "./citations";
import { buildGroundedKnowledgeAnswer, buildGroundedKnowledgeAnswerAsync } from "./grounded-answer";
import { isProductionSafe } from "./safety";

export { islamicSources, getSourcesByIds } from "./sources";
export { cultureFilterCards } from "./kulturfilter";
export { janazahArticles } from "./janazah";
export { barzakhArticles } from "./barzakh";
export { testamentArticles } from "./testament-erbe";
export { patientenverfuegungArticles } from "./patientenverfuegung";
export { sadaqaJariyaArticles } from "./sadaqa-jariya";
export { ghuslKafanArticles } from "./ghusl-kafan";

export * from "./types";
export * from "./config";
export * from "./safety";
export * from "./citations";
export * from "./entries";
export * from "./search";
export * from "./retrieval";
export * from "./grounded-answer";

function entryToLegacyArticle(entry: KnowledgeEntry): KnowledgeArticle {
  return {
    id: entry.id,
    slug: entry.id.replace(/^kb-/, ""),
    title: entry.title,
    summary: entry.summary,
    content: entry.content,
    sourceIds: [],
    reviewStatus: entry.reviewedStatus === "reviewed" ? "reviewed" : "needs_scholar_review",
    category: entry.category,
  };
}

/** @deprecated use retrieveKnowledgeSync */
export function searchKnowledge(query: string): KnowledgeArticle[] {
  return keywordSearchOrFallback(query, getProductionEntries())
    .map((r) => entryToLegacyArticle(r.entry));
}

/** @deprecated use getProductionEntries */
export function getAllPublishedArticles(): KnowledgeArticle[] {
  return getProductionEntries().map(entryToLegacyArticle);
}

export function searchKnowledgeEntries(query: string, language: KnowledgeLanguage = "de") {
  return retrieveKnowledgeSync(query, { language, productionOnly: true });
}

export function listPublicEntries(language: KnowledgeLanguage = "de") {
  return getProductionEntries()
    .filter((e) => e.language === language)
    .map(toPublicEntry);
}

export function getPublicEntry(id: string) {
  const entry = getEntryById(id);
  if (!entry) return null;
  return toPublicEntryDetail(entry);
}

export {
  getAllEntries,
  getProductionEntries,
  getReviewedEntries,
  getEntriesNeedingReview,
  getFaqEntries,
  toCitation,
  buildGroundedKnowledgeAnswer,
  buildGroundedKnowledgeAnswerAsync,
  retrieveKnowledge,
  isProductionSafe,
};
