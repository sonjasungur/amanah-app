import type { AmanahOrdnerData } from "@/lib/domain/types";
import { getNestedValue, isFieldFilled } from "@/lib/domain/validation";
import { GUIDED_QUESTION_PLAN, getQuestionById } from "./question-plan";
import { computeFlowProgress } from "./progress";
import type { GuidedQuestion, NextQuestionResponse } from "./types";

export function isQuestionAnswered(data: AmanahOrdnerData, question: GuidedQuestion): boolean {
  const value = getNestedValue(data, question.fieldPath);
  return isFieldFilled(value);
}

export function getNextGuidedQuestion(
  data: AmanahOrdnerData,
  skippedQuestions: string[] = [],
  completedQuestions: string[] = []
): NextQuestionResponse {
  const skipped = new Set(skippedQuestions);
  const completed = new Set(completedQuestions);
  const flowProgress = computeFlowProgress(data, skippedQuestions, completedQuestions);

  const candidates = GUIDED_QUESTION_PLAN.filter(
    (q) => !skipped.has(q.id) && !completed.has(q.id) && !isQuestionAnswered(data, q)
  );

  const critical = candidates.filter((q) => q.critical).sort((a, b) => a.priority - b.priority);
  const optional = candidates.filter((q) => !q.critical).sort((a, b) => a.priority - b.priority);

  const next = critical[0] ?? optional[0] ?? null;

  if (!next) {
    return {
      question: null,
      flowProgress,
      done: true,
      message: flowProgress.allCriticalDone
        ? "Die wichtigsten Grundlagen sind vorbereitet."
        : "Alle geplanten Fragen wurden bearbeitet oder übersprungen.",
    };
  }

  return { question: next, flowProgress, done: false };
}

export function markQuestionComplete(
  questionId: string,
  completedQuestions: string[]
): string[] {
  if (completedQuestions.includes(questionId)) return completedQuestions;
  return [...completedQuestions, questionId];
}

export function markQuestionSkipped(
  questionId: string,
  skippedQuestions: string[]
): string[] {
  if (skippedQuestions.includes(questionId)) return skippedQuestions;
  return [...skippedQuestions, questionId];
}

export function resolveQuestion(questionId: string | null): GuidedQuestion | null {
  if (!questionId) return null;
  return getQuestionById(questionId) ?? null;
}
