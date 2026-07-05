import type { AmanahOrdnerData } from "@/lib/domain/types";
import { labelForField } from "@/lib/ai/context";
import { enforceAiSafety } from "@/lib/ai/safety";
import { ruleBasedAIProvider } from "@/lib/ai/rule-based-ai-provider";
import { getQuestionById } from "./question-plan";
import { buildPatchPreview } from "./patch-preview";
import type { GuidedQuestion, ParseAnswerResponse, SuggestedUpdate } from "./types";

function parseBoolean(text: string): boolean | null {
  const t = text.toLowerCase().trim();
  if (/^(ja|yes|true|1|habe|haben|vorhanden)/i.test(t)) return true;
  if (/^(nein|no|false|0|nicht|keine)/i.test(t)) return false;
  return null;
}

function extractPersonName(text: string): string | null {
  const patterns = [
    /(?:meine|mein)\s+(?:schwester|bruder|ehefrau|ehemann|mutter|vater|sohn|tochter)\s+([A-ZÄÖÜ][a-zäöüß]+)/i,
    /(?:schwester|bruder)\s+([A-ZÄÖÜ][a-zäöüß]+)/i,
    /(?:kontakt|anrufen|informieren|heißt|heisst|name ist)\s+([A-ZÄÖÜ][a-zäöüß]+)/i,
    /^([A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß]+)?)$/,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m?.[1]) return m[1].trim();
  }
  return null;
}

function extractPhone(text: string): string | null {
  const m = text.match(/(?:\+49|0)\s*[\d\s\-/]{8,}/);
  return m ? m[0].replace(/\s/g, "") : null;
}

function extractRelation(text: string): string | null {
  const rels = ["schwester", "bruder", "ehefrau", "ehemann", "mutter", "vater", "sohn", "tochter", "freund", "freundin"];
  const t = text.toLowerCase();
  for (const r of rels) {
    if (t.includes(r)) return r.charAt(0).toUpperCase() + r.slice(1);
  }
  return null;
}

function labelForPath(path: string, question?: GuidedQuestion): string {
  const fromContext = labelForField(path);
  if (fromContext !== path) return fromContext;
  return question?.questionText.slice(0, 60) ?? path;
}

function ruleBasedParse(
  answer: string,
  question: GuidedQuestion
): { updates: SuggestedUpdate[]; clarifications: string[] } {
  const updates: SuggestedUpdate[] = [];
  const clarifications: string[] = [];
  const trimmed = answer.trim();
  if (!trimmed) {
    clarifications.push("Bitte gib eine Antwort ein oder überspringe die Frage.");
    return { updates, clarifications };
  }

  const { fieldPath, moduleId, expectedAnswerType } = question;

  if (expectedAnswerType === "boolean") {
    const b = parseBoolean(trimmed);
    if (b !== null) {
      updates.push({
        fieldPath,
        label: labelForPath(fieldPath, question),
        value: b,
        confidence: "high",
        moduleId,
      });
    } else {
      clarifications.push("Bitte antworte mit „ja“ oder „nein“.");
    }
    return { updates, clarifications };
  }

  if (expectedAnswerType === "phone") {
    const phone = extractPhone(trimmed);
    if (phone) {
      updates.push({
        fieldPath,
        label: labelForPath(fieldPath, question),
        value: phone,
        confidence: "high",
        moduleId,
      });
    } else {
      clarifications.push("Keine Telefonnummer erkannt — bitte Nummer angeben.");
    }
    if (fieldPath.includes("emergencyContact1") && !fieldPath.endsWith("relation")) {
      const rel = extractRelation(trimmed);
      if (rel) {
        updates.push({
          fieldPath: "emergencyCard.emergencyContact1.relation",
          label: labelForField("emergencyCard.emergencyContact1.relation"),
          value: rel,
          confidence: "medium",
          moduleId: "notfallkarte",
        });
      }
    }
    return { updates, clarifications };
  }

  if (expectedAnswerType === "person") {
    const name = extractPersonName(trimmed) ?? (trimmed.length < 80 ? trimmed : null);
    if (name) {
      updates.push({
        fieldPath,
        label: labelForPath(fieldPath, question),
        value: name,
        confidence: extractPersonName(trimmed) ? "high" : "medium",
        moduleId,
      });
      const rel = extractRelation(trimmed);
      if (rel && fieldPath.includes("emergencyContact1.name")) {
        updates.push({
          fieldPath: "emergencyCard.emergencyContact1.relation",
          label: labelForField("emergencyCard.emergencyContact1.relation"),
          value: rel,
          confidence: "medium",
          moduleId: "notfallkarte",
        });
      }
    } else {
      clarifications.push("Bitte gib einen Namen an.");
    }
    return { updates, clarifications };
  }

  updates.push({
    fieldPath,
    label: labelForPath(fieldPath, question),
    value: trimmed,
    confidence: "high",
    moduleId,
  });
  return { updates, clarifications };
}

export async function parseGuidedAnswer(
  data: AmanahOrdnerData,
  questionId: string,
  answer: string,
  options?: { useAiExtract?: boolean }
): Promise<ParseAnswerResponse> {
  const safety = enforceAiSafety(answer, "extract");
  if (!safety.allowed) {
    return {
      suggestedUpdates: [],
      clarificationNeeded: [safety.redirectMessage ?? "Frage nicht erlaubt."],
      previewItems: [],
      blocked: true,
      message: safety.redirectMessage,
    };
  }

  const question = getQuestionById(questionId);
  if (!question) {
    return {
      suggestedUpdates: [],
      clarificationNeeded: ["Unbekannte Frage."],
      previewItems: [],
    };
  }

  let updates: SuggestedUpdate[] = [];
  let clarifications: string[] = [];

  const ruleResult = ruleBasedParse(answer, question);
  updates = ruleResult.updates;
  clarifications = ruleResult.clarifications;

  if (options?.useAiExtract && updates.length === 0) {
    const extract = await ruleBasedAIProvider.extract(data, answer);
    for (const s of extract.suggestedUpdates) {
      updates.push({
        fieldPath: s.fieldPath,
        label: s.label,
        value: s.value,
        confidence: s.confidence,
        moduleId: question.moduleId,
      });
    }
    clarifications = [...clarifications, ...extract.clarificationNeeded];
  }

  if (updates.length === 0 && clarifications.length === 0) {
    clarifications.push("Konnte keine Angabe erkennen — bitte präziser formulieren.");
  }

  const previewItems = buildPatchPreview(data, updates, clarifications);

  return {
    suggestedUpdates: updates,
    clarificationNeeded: clarifications,
    previewItems,
  };
}
