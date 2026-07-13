import { DOMAIN_DISCLAIMER } from "@/lib/ai/safety";
import { NO_SOURCE_MESSAGE, ORIENTATION_NOTE } from "./config";
import { toCitation } from "./citations";
import { retrieveKnowledgeSync } from "./retrieval";
import {
  classifyKnowledgeSensitivity,
  isIndividualDecisionQuestion,
  knowledgeRedirectMessage,
} from "./safety";
import type { GroundedKnowledgeAnswer, KnowledgeEntry, KnowledgeLanguage } from "./types";

function composeAnswerFromEntries(entries: KnowledgeEntry[]): string {
  if (entries.length === 1) {
    const e = entries[0];
    return `${e.summary}\n\n${e.content}\n\n${ORIENTATION_NOTE}`;
  }
  const parts = entries.map(
    (e, i) => `**${i + 1}. ${e.title}**\n${e.summary}`
  );
  return `${parts.join("\n\n")}\n\n${ORIENTATION_NOTE}`;
}

export function buildGroundedKnowledgeAnswer(
  question: string,
  options?: { language?: KnowledgeLanguage }
): GroundedKnowledgeAnswer {
  const safetyLevel = classifyKnowledgeSensitivity(question);
  const disclaimer = DOMAIN_DISCLAIMER;

  if (isIndividualDecisionQuestion(question)) {
    return {
      answer: knowledgeRedirectMessage(safetyLevel),
      citations: [],
      usedEntryIds: [],
      safetyLevel,
      blocked: true,
      suggestedNextStep: "Nutze den Amanah Vorsorge zur Dokumentation — Entscheidungen bitte fachlich prüfen lassen.",
      noSource: false,
      disclaimer,
    };
  }

  const results = retrieveKnowledgeSync(question, {
    language: options?.language ?? "de",
    productionOnly: true,
  });

  if (results.length === 0) {
    return {
      answer: `${NO_SOURCE_MESSAGE}\n\n${ORIENTATION_NOTE} Fachliche Prüfung empfohlen.`,
      citations: [],
      usedEntryIds: [],
      safetyLevel: "general_allowed",
      blocked: false,
      suggestedNextStep: "Ergänze deinen Amanah Vorsorge im passenden Modul oder konsultiere eine Fachperson.",
      noSource: true,
      disclaimer,
    };
  }

  const entries = results.map((r) => r.entry);
  const citations = entries.map(toCitation);

  return {
    answer: composeAnswerFromEntries(entries),
    citations,
    usedEntryIds: entries.map((e) => e.id),
    safetyLevel: "general_allowed",
    blocked: false,
    suggestedNextStep: "Dokumentiere passende Angaben im Amanah Vorsorge und lasse sie fachlich prüfen.",
    noSource: false,
    disclaimer: `${disclaimer} Keine Fatwa, keine Rechtsberatung.`,
  };
}

export async function buildGroundedKnowledgeAnswerAsync(
  question: string,
  options?: { language?: KnowledgeLanguage }
): Promise<GroundedKnowledgeAnswer> {
  const base = buildGroundedKnowledgeAnswer(question, options);
  if (base.blocked || base.noSource) return base;

  const { retrieveKnowledge } = await import("./retrieval");
  const results = await retrieveKnowledge(question, {
    language: options?.language ?? "de",
    productionOnly: true,
  });
  if (results.length === 0) return base;

  const entries = results.map((r) => r.entry);
  return {
    ...base,
    answer: composeAnswerFromEntries(entries),
    citations: entries.map(toCitation),
    usedEntryIds: entries.map((e) => e.id),
  };
}

export async function enhanceAnswerWithOpenAI(
  question: string,
  grounded: GroundedKnowledgeAnswer
): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key || grounded.blocked || grounded.noSource || grounded.citations.length === 0) return null;

  const snippets = grounded.citations
    .map((c, i) => `[${i + 1}] ${c.title}: ${grounded.answer.split("\n\n")[0]}`)
    .join("\n");

  try {
    const model = process.env.AMANAH_AI_MODEL_FAST || process.env.OPENAI_MODEL || "gpt-4o-mini";
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "Antworte nur auf Basis der bereitgestellten Quellen. Keine Rechtsberatung, keine Medizinberatung, keine Fatwa. Kurz und vorsichtig formulieren.",
          },
          {
            role: "user",
            content: `Frage: ${question}\n\nQuellen:\n${snippets}\n\nFormuliere eine kurze Orientierungsantwort auf Deutsch.`,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}
