import type { AmanahOrdnerData } from "@/lib/domain/types";
import { labelForField } from "./context";
import { DOMAIN_DISCLAIMER } from "./safety";
import type { ExtractResult } from "./types";

/** Reads suggestions from free text. Own file, because it runs in the browser: no knowledge texts here. */
export async function extractFromFreeText(data: AmanahOrdnerData, freeText: string): Promise<ExtractResult> {
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
