/**
 * Editorial model of the free Islamic knowledge centre (Sadaqa Jariyah).
 * Content is only public when every required review is recorded — see workflow.ts.
 */

export type ArticleStatus = "DRAFT" | "SOURCE_REVIEW" | "SCHOLAR_REVIEW" | "APPROVED" | "PUBLISHED";

/** Legal review is an additional gate for articles touching German law. */
export type ReviewKind = "source" | "scholar" | "legal";

export type KnowledgeAreaId = "faraid" | "tod-sterben" | "janazah" | "vorsorge" | "islam-und-recht";

export interface ReviewRecord {
  kind: ReviewKind;
  /** Name and qualification of the responsible reviewer. Never a placeholder. */
  reviewer: string;
  /** ISO date (YYYY-MM-DD). */
  reviewedAt: string;
  /** Article version the review applies to. A new version needs new reviews. */
  version: number;
  note?: string;
}

/** Where pre-existing content came from. Kept so nothing is overwritten unseen. */
export interface LegacyOrigin {
  file: string;
  recordId: string;
  /** Status the legacy record claimed. Not trusted: no reviewer or date was recorded. */
  claimedStatus?: string;
}

export interface KnowledgeArticleRecord {
  id: string;
  slug: string;
  area: KnowledgeAreaId;
  subtopicId: string;
  title: string;
  summary: string;
  /** Plain-language explanation. Paragraphs separated by blank lines. */
  body: string;
  /** IDs from src/lib/knowledge/sources.ts (Qur'an, Hadith, Fiqh, official). */
  sourceIds: string[];
  /** Different recognised positions, labelled — never presented as the single view. */
  differingOpinions?: string;
  /** German-law aspects are kept separate from religious statements. */
  germanLawNote?: string;
  requiresLegalReview: boolean;
  status: ArticleStatus;
  version: number;
  reviews: ReviewRecord[];
  relatedSlugs: string[];
  legacy?: LegacyOrigin;
}

export interface KnowledgeSubtopic {
  id: string;
  title: string;
}

export interface KnowledgeArea {
  id: KnowledgeAreaId;
  letter: "A" | "B" | "C" | "D" | "E";
  title: string;
  description: string;
  /** Every article in this area needs a legal review in addition to the scholar review. */
  legalReviewRequired: boolean;
  subtopics: KnowledgeSubtopic[];
}
