export type KnowledgeCategory =
  | "notfallmappe"
  | "notfallkontakte"
  | "dokumentenuebersicht"
  | "vorsorgevollmacht"
  | "patientenverfuegung"
  | "bestattungswuensche"
  | "janazah-begriffe"
  | "ghusl-kafan"
  | "sadaqa-jariya"
  | "digitaler-nachlass"
  | "familiennachricht"
  | "app-grenzen";

/**
 * "reviewed" counts only together with a documented review (see ReviewEvidence).
 * "orientation": purely organisational help without religious or legal statements, not reviewed.
 */
export type ReviewedStatus = "draft" | "reviewed" | "needs_review" | "orientation";

/** Who reviewed what, and where it is documented. Without this, nothing may appear as reviewed. */
export interface ReviewEvidence {
  reviewer: string;
  reviewedAt: string;
  document: string;
}
export type RiskLevel = "low" | "medium" | "sensitive";
export type KnowledgeLanguage = "de" | "en" | "tr" | "ar";

export interface KnowledgeEntry {
  id: string;
  title: string;
  category: KnowledgeCategory;
  language: KnowledgeLanguage;
  summary: string;
  content: string;
  sourceLabel: string;
  sourceUrl?: string;
  reviewedStatus: ReviewedStatus;
  riskLevel: RiskLevel;
  tags: string[];
  lastReviewedAt?: string;
  reviewEvidence?: ReviewEvidence;
}

export interface KnowledgeSearchResult {
  entry: KnowledgeEntry;
  score: number;
}

export interface KnowledgeCitation {
  entryId: string;
  title: string;
  category: KnowledgeCategory;
  sourceLabel: string;
  sourceUrl?: string;
  reviewedStatus: ReviewedStatus;
  orientationNote: string;
}

export type KnowledgeSafetyLevel =
  | "general_allowed"
  | "legal_sensitive"
  | "medical_sensitive"
  | "religious_sensitive";

export interface GroundedKnowledgeAnswer {
  answer: string;
  citations: KnowledgeCitation[];
  usedEntryIds: string[];
  safetyLevel: KnowledgeSafetyLevel;
  blocked: boolean;
  suggestedNextStep?: string;
  noSource: boolean;
  disclaimer: string;
}

export interface PublicKnowledgeEntry {
  id: string;
  title: string;
  category: KnowledgeCategory;
  language: KnowledgeLanguage;
  summary: string;
  sourceLabel: string;
  sourceUrl?: string;
  reviewedStatus: ReviewedStatus;
  riskLevel: RiskLevel;
  tags: string[];
  lastReviewedAt?: string;
  reviewBadge?: string;
}

export interface PublicKnowledgeEntryDetail extends PublicKnowledgeEntry {
  content: string;
}
