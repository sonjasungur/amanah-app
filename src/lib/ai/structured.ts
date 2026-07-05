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

export function isKnowledgeResult(v: unknown): v is KnowledgeResult {
  const o = v as KnowledgeResult;
  return typeof o?.answer === "string" && typeof o?.blocked === "boolean";
}
