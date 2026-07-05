import { buildGroundedKnowledgeAnswer, enhanceAnswerWithOpenAI } from "@/lib/knowledge/grounded-answer";
import type { KnowledgeResult } from "./types";

export async function answerKnowledgeQuestion(
  question: string,
  options?: { useOpenAI?: boolean }
): Promise<KnowledgeResult> {
  const grounded = buildGroundedKnowledgeAnswer(question);

  if (grounded.blocked) {
    return {
      answer: grounded.answer,
      blocked: true,
      safetyLevel: grounded.safetyLevel,
      citations: [],
      usedEntryIds: [],
      suggestedNextStep: grounded.suggestedNextStep,
      disclaimer: grounded.disclaimer,
    };
  }

  let answer = grounded.answer;
  if (options?.useOpenAI && !grounded.noSource) {
    const enhanced = await enhanceAnswerWithOpenAI(question, grounded);
    if (enhanced) answer = `${enhanced}\n\n${grounded.disclaimer}`;
  }

  return {
    answer,
    citations: grounded.citations,
    usedEntryIds: grounded.usedEntryIds,
    safetyLevel: grounded.safetyLevel,
    blocked: false,
    noSource: grounded.noSource,
    suggestedNextStep: grounded.suggestedNextStep,
    sources: grounded.citations.map((c) => `${c.title} — ${c.sourceLabel}`),
    disclaimer: grounded.disclaimer,
  };
}
