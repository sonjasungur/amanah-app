import { islamicSources } from "@/lib/knowledge/sources";
import { blockingSources } from "./source-verification";
import type { ArticleStatus, KnowledgeArticleRecord, ReviewKind, SunniSchool } from "./types";

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

const ALL_SCHOOLS: SunniSchool[] = ["hanafi", "maliki", "shafii", "hanbali"];
const SAHIHAYN = new Set(["bukhari", "muslim"]);

/** Every source the article cites, including those behind school positions. */
export function allSourceIds(article: KnowledgeArticleRecord): string[] {
  const nested = (article.schoolDifferences ?? []).flatMap((d) => d.positions.flatMap((p) => p.sourceIds));
  return [...new Set([...article.sourceIds, ...nested])];
}

/** Content rules that hold regardless of review state. */
/** Placeholders in drafts; any of them blocks publication. */
export const EDITORIAL_MARKERS = ["[Redaktion", "[Juristische Prüfung"];

export function structuralIssues(article: KnowledgeArticleRecord): string[] {
  const issues: string[] = [];
  const texts = [article.body, article.summary, article.germanLawNote ?? "", article.differingOpinions ?? ""];
  if (texts.some((t) => EDITORIAL_MARKERS.some((m) => t.includes(m)))) {
    issues.push("Text enthält noch offene Redaktions- oder Prüfvermerke.");
  }
  for (const d of article.schoolDifferences ?? []) {
    if (d.positions.length === 0) issues.push(`„${d.question}“: Positionen der Rechtsschulen fehlen noch.`);
    const covered = new Set(d.positions.flatMap((p) => p.schools));
    if (d.kind === "agreement" && !ALL_SCHOOLS.every((s) => covered.has(s))) {
      issues.push(`„${d.question}“: Übereinstimmung nur mit Beleg für alle vier Schulen.`);
    }
    if (d.positions.some((p) => p.sourceIds.length === 0 && !p.reference)) {
      issues.push(`„${d.question}“: Position ohne Quelle oder Werkangabe.`);
    }
  }
  for (const id of allSourceIds(article)) {
    const source = islamicSources[id];
    if (source?.type === "hadith" && source.collection && !SAHIHAYN.has(source.collection) && !source.gradings?.length) {
      issues.push(`${id}: Hadith außerhalb Bukhari/Muslim ohne Authentizitätseinstufung.`);
    }
  }
  return issues;
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
    const issues = structuralIssues(article);
    if (issues.length > 0) return { allowed: false, reason: issues.join(" ") };
    const blocked = blockingSources(allSourceIds(article));
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
    blockingSources(allSourceIds(article)).length === 0 &&
    structuralIssues(article).length === 0 &&
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
