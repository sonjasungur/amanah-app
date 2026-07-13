import type { AmanahOrdnerData } from "@/lib/domain/types";
import {
  getAllModuleProgress,
  getCriticalMissing,
  getRecommendedNextStep,
} from "@/lib/domain/validation";
import { buildFamilyMessageContext, labelForField, moduleTitle } from "./context";
import { answerKnowledgeQuestion } from "./knowledge-answer";
import { DOMAIN_DISCLAIMER } from "./safety";
import type {
  AmanahAIProvider,
  AiProviderName,
  CompletionReviewResult,
  ExtractResult,
  FamilyMessageResult,
  FamilyMessageTone,
  KnowledgeResult,
  NextQuestionResult,
} from "./types";

const QUESTION_TEMPLATES: Record<string, string> = {
  "emergencyCard.emergencyContact1.name": "Damit deine Familie im Notfall handeln kann: Wen soll sie zuerst kontaktieren?",
  "emergencyCard.emergencyContact1.phone": "Wie kann deine Familie den Notfallkontakt am schnellsten erreichen?",
  "emergencyCard.name": "Unter welchem Namen sollen Rettungskräfte dich identifizieren?",
  "janazahWishes.preferredFuneralDirector": "Welchen Bestatter möchtest du für die Janazah-Vorbereitung benennen?",
  "powerOfAttorney.authorizedPerson": "Wer soll im Krankheitsfall für dich entscheiden dürfen?",
  "medicalWishes.medicalWishes": "Welche medizinischen Wünsche möchtest du dokumentieren — zur Orientierung, nicht als ärztliche Beratung?",
  "familyMessage.familyLetter": "Möchtest du deiner Familie einen persönlichen Brief hinterlassen?",
};

export class RuleBasedAIProvider implements AmanahAIProvider {
  readonly name: AiProviderName = "rules";

  async nextQuestion(data: AmanahOrdnerData): Promise<NextQuestionResult> {
    const next = getRecommendedNextStep(data);
    const modProgress = getAllModuleProgress(data).find((m) => m.moduleId === next.moduleId);
    const fieldPath = modProgress?.missingRequired[0] || "emergencyCard.emergencyContact1.name";

    const question =
      QUESTION_TEMPLATES[fieldPath] ||
      `Im Bereich „${next.title}“ fehlt noch eine wichtige Angabe. Was möchtest du dazu festhalten?`;

    return {
      question,
      moduleId: next.moduleId,
      fieldPath,
      reason: `Modul „${next.title}“ ist noch nicht vollständig — fachliche Prüfung empfohlen, sobald du die Angaben ergänzt hast.`,
      disclaimer: DOMAIN_DISCLAIMER,
    };
  }

  async completionReview(data: AmanahOrdnerData): Promise<CompletionReviewResult> {
    const criticalLabels = getCriticalMissing(data);
    const allProgress = getAllModuleProgress(data);

    const critical = criticalLabels.map((label) => ({ label }));
    const recommended: CompletionReviewResult["recommended"] = [];
    const optional: CompletionReviewResult["optional"] = [];

    for (const mod of allProgress) {
      if (mod.percent >= 100) continue;
      const item = {
        label: `${moduleTitle(mod.moduleId)} (${mod.percent}%)`,
        moduleId: mod.moduleId,
        fieldPath: mod.missingRequired[0],
      };
      if (mod.percent < 40) recommended.push(item);
      else optional.push(item);
    }

    if (data.debtsAmanah.length === 0) {
      optional.push({ label: "Schulden & Amanah — auch „keine offenen Punkte“ dokumentieren", moduleId: "schulden-amanah" });
    }

    return {
      critical,
      recommended: recommended.slice(0, 6),
      optional: optional.slice(0, 6),
      summary: critical.length
        ? `${critical.length} kritische Lücke(n) — bitte zur Vorbereitung ergänzen. Keine Garantie auf Vollständigkeit.`
        : "Grundstruktur vorhanden — empfohlene Module können weiter ergänzt werden.",
      disclaimer: DOMAIN_DISCLAIMER,
    };
  }

  async extract(data: AmanahOrdnerData, freeText: string): Promise<ExtractResult> {
    const suggestions: ExtractResult["suggestedUpdates"] = [];
    const clarificationNeeded: string[] = [];

    const phoneMatch = freeText.match(/(?:\+49|0)\s*[\d\s\-/]{8,}/);
    if (phoneMatch) {
      suggestions.push({
        fieldPath: "emergencyCard.emergencyContact1.phone",
        value: phoneMatch[0].replace(/\s/g, ""),
        confidence: "high",
        label: labelForField("emergencyCard.emergencyContact1.phone"),
      });
    }

    const relationPatterns = [
      { re: /(?:meine|mein)\s+(?:schwester|bruder|ehefrau|ehemann|mutter|vater|sohn|tochter)\s+([A-ZÄÖÜ][a-zäöüß]+)/i, rel: "Angehörige" },
      { re: /(?:schwester|bruder)\s+([A-ZÄÖÜ][a-zäöüß]+)/i, rel: "Geschwister" },
      { re: /(?:kontakt|anrufen|informieren).*?([A-ZÄÖÜ][a-zäöüß]+)/i, rel: "Kontakt" },
    ];

    for (const { re, rel } of relationPatterns) {
      const m = freeText.match(re);
      if (m?.[1]) {
        suggestions.push({
          fieldPath: "emergencyCard.emergencyContact1.name",
          value: m[1],
          confidence: "medium",
          label: labelForField("emergencyCard.emergencyContact1.name"),
        });
        if (!data.emergencyCard.emergencyContact1.relation) {
          suggestions.push({
            fieldPath: "emergencyCard.emergencyContact1.relation",
            value: rel,
            confidence: "low",
            label: labelForField("emergencyCard.emergencyContact1.relation"),
          });
        }
        break;
      }
    }

    if (/bestatt|janazah|beerdig/i.test(freeText)) {
      const fd = freeText.match(/bestatter\s+([^.,\n]+)/i);
      if (fd?.[1]) {
        suggestions.push({
          fieldPath: "janazahWishes.preferredFuneralDirector",
          value: fd[1].trim(),
          confidence: "medium",
          label: labelForField("janazahWishes.preferredFuneralDirector"),
        });
      }
    }

    if (suggestions.length === 0) {
      clarificationNeeded.push("Welche Angabe möchtest du festhalten — Notfallkontakt, Janazah oder Familienwunsch?");
    }

    return {
      suggestedUpdates: suggestions,
      clarificationNeeded,
      previewNote: "Vorschläge werden nicht automatisch gespeichert — bitte aktiv übernehmen.",
      disclaimer: DOMAIN_DISCLAIMER,
    };
  }

  async familyMessage(data: AmanahOrdnerData, tone: FamilyMessageTone): Promise<FamilyMessageResult> {
    const ctx = buildFamilyMessageContext(data);
    const name = (ctx.name as string) || "[Dein Name]";
    const contact = (ctx.emergencyContact as string) || "die benannte Vertrauensperson";
    const fd = (ctx.funeralDirector as string) || "den von mir benannten Bestatter";

    const templates: Record<FamilyMessageTone, string> = {
      liebevoll: `Liebe Familie,\n\nich bereite meinen Amanah Vorsorge vor, damit ihr im schwersten Moment Orientierung habt. Bitte kontaktiert im Notfall zuerst ${contact}. Mir ist eine würdevolle islamische Bestattung wichtig — ${fd} und unsere Moschee können euch unterstützen.\n\nDies ist mein Entwurf zur Vorbereitung — bitte mit Imam/Gelehrten und ggf. Anwalt fachlich prüfen lassen.\n\nIn Liebe,\n${name}`,
      sachlich: `An meine Angehörigen,\n\nim Notfall bitte ${contact} informieren. Bestattung: islamische Grundsätze, zeitnahe Beisetzung. Bestatter: ${fd}.\n\nDetails im Amanah Vorsorge. Keine Rechtsberatung — fachliche Prüfung empfohlen.\n\n${name}`,
      kurz: `Im Notfall: ${contact} anrufen. Janazah-Wünsche und Details im Amanah Vorsorge. — ${name}`,
      ausfuehrlich: `Liebe Familie,\n\nmit meinem Amanah Vorsorge möchte ich euch im Fall meines Todes oder einer schweren Krankheit Orientierung geben — nicht Entscheidungen abnehmen.\n\nNotfallkontakt: ${contact}\nBestattung: islamische Grundsätze, ${fd}\n\nBitte keine aufwendigen kulturellen Trauerfeiern, die finanziell belasten. Stattdessen Dua und einfache Sadaqa Jariya.\n\nAlle Details im Ordner. Bitte Imam/Gelehrte und Anwalt/Notar zur fachlichen Prüfung hinzuziehen.\n\n${name}`,
    };

    return {
      message: templates[tone],
      tone,
      disclaimer: DOMAIN_DISCLAIMER + " Kein automatischer Versand — bitte Entwurf prüfen.",
    };
  }

  async knowledge(question: string): Promise<KnowledgeResult> {
    return answerKnowledgeQuestion(question);
  }
}

export const ruleBasedAIProvider = new RuleBasedAIProvider();
