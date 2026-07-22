import type {
  CompletionReviewResult,
  ExtractResult,
  FamilyMessageResult,
  KnowledgeResult,
  NextQuestionResult,
} from "./types";

export function isNextQuestionResult(v: unknown): v is NextQuestionResult {
  const o = v as NextQuestionResult;
  return typeof o?.question === "string" && typeof o?.fieldPath === "string";
}

export function isCompletionReviewResult(v: unknown): v is CompletionReviewResult {
  const o = v as CompletionReviewResult;
  return Array.isArray(o?.critical) && Array.isArray(o?.recommended) && typeof o?.summary === "string";
}

export function isExtractResult(v: unknown): v is ExtractResult {
  const o = v as ExtractResult;
  return Array.isArray(o?.suggestedUpdates) && Array.isArray(o?.clarificationNeeded);
}

export function isFamilyMessageResult(v: unknown): v is FamilyMessageResult {
  const o = v as FamilyMessageResult;
  return typeof o?.message === "string" && typeof o?.tone === "string";
}

function isKnowledgeCitation(v: unknown): boolean {
  if (!v || typeof v !== "object") return false;
  const c = v as Record<string, unknown>;
  return (
    typeof c.entryId === "string" &&
    c.entryId.length > 0 &&
    typeof c.title === "string" &&
    c.title.length > 0 &&
    typeof c.sourceLabel === "string" &&
    c.sourceLabel.length > 0
  );
}

export function isKnowledgeResult(v: unknown): v is KnowledgeResult {
  if (!v || typeof v !== "object") return false;
  const o = v as KnowledgeResult;
  if (typeof o.answer !== "string" || o.answer.trim().length === 0) return false;
  if (typeof o.blocked !== "boolean") return false;
  if (typeof o.disclaimer !== "string") return false;
  // Grounded answers must expose citation arrays; missing evidence uses empty arrays + noSource.
  if (!Array.isArray(o.citations) || !Array.isArray(o.usedEntryIds)) return false;
  if (!o.citations.every(isKnowledgeCitation)) return false;
  if (!o.usedEntryIds.every((id) => typeof id === "string" && id.length > 0)) return false;
  if (o.blocked === true || o.noSource === true) return true;
  // When evidence is expected, require at least one structurally valid citation.
  return o.citations.length > 0;
}
