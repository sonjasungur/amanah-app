import { blockingSources } from "./source-verification";
import type { ArticleStatus, KnowledgeArticleRecord, ReviewKind } from "./types";

export const STATUS_ORDER: ArticleStatus[] = ["DRAFT", "SOURCE_REVIEW", "SCHOLAR_REVIEW", "APPROVED", "PUBLISHED"];

export const STATUS_LABELS: Record<ArticleStatus, string> = {
  DRAFT: "Entwurf",
  SOURCE_REVIEW: "Quellenprüfung",
  SCHOLAR_REVIEW: "Prüfung durch Gelehrte",
  APPROVED: "Freigegeben",
  PUBLISHED: "Veröffentlicht",
};

const REVIEW_LABELS: Record<ReviewKind, string> = {
  source: "Quellenprüfung",
  scholar: "Prüfung durch islamische Fachperson",
  legal: "Juristische Fachprüfung",
};

export function requiredReviews(article: Pick<KnowledgeArticleRecord, "requiresLegalReview">): ReviewKind[] {
  return article.requiresLegalReview ? ["source", "scholar", "legal"] : ["source", "scholar"];
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Reviews that are complete and apply to the current version. */
function validReviewKinds(article: KnowledgeArticleRecord): Set<ReviewKind> {
  return new Set(
    article.reviews
      .filter((r) => r.version === article.version && r.reviewer.trim().length > 0 && ISO_DATE.test(r.reviewedAt))
      .map((r) => r.kind)
  );
}

export function missingReviews(article: KnowledgeArticleRecord): ReviewKind[] {
  const present = validReviewKinds(article);
  return requiredReviews(article).filter((kind) => !present.has(kind));
}

export function describeMissingReviews(article: KnowledgeArticleRecord): string[] {
  return missingReviews(article).map((kind) => REVIEW_LABELS[kind]);
}

/** Forward one step at a time; any step may go back to DRAFT (e.g. after an edit). */
export function canTransition(article: KnowledgeArticleRecord, to: ArticleStatus): { allowed: boolean; reason?: string } {
  const from = STATUS_ORDER.indexOf(article.status);
  const target = STATUS_ORDER.indexOf(to);
  if (to === "DRAFT") return { allowed: true };
  if (target !== from + 1) return { allowed: false, reason: "Nur ein Schritt vorwärts ist erlaubt." };

  const present = validReviewKinds(article);
  if (to === "SCHOLAR_REVIEW" && !present.has("source")) {
    return { allowed: false, reason: "Quellenprüfung fehlt." };
  }
  if (to === "SCHOLAR_REVIEW" && article.sourceIds.length === 0) {
    return { allowed: false, reason: "Artikel ohne Quellen kann nicht zur Gelehrtenprüfung." };
  }
  if (to === "APPROVED" || to === "PUBLISHED") {
    const blocked = blockingSources(article.sourceIds);
    if (blocked.length > 0) return { allowed: false, reason: `Quellen mit offenem Befund: ${blocked.join(", ")}` };
    const missing = missingReviews(article);
    if (missing.length > 0) return { allowed: false, reason: `Fehlende Prüfungen: ${missing.join(", ")}` };
  }
  return { allowed: true };
}

/** The single public gate. Everything shown to visitors goes through this. */
export function isPublishable(article: KnowledgeArticleRecord): boolean {
  return (
    article.status === "PUBLISHED" &&
    article.sourceIds.length > 0 &&
    blockingSources(article.sourceIds).length === 0 &&
    missingReviews(article).length === 0
  );
}

export function lastReviewDate(article: KnowledgeArticleRecord): string | undefined {
  return article.reviews
    .filter((r) => r.version === article.version)
    .map((r) => r.reviewedAt)
    .sort()
    .at(-1);
}
