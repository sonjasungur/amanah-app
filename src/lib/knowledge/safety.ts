import type { KnowledgeEntry, KnowledgeSafetyLevel } from "./types";

const LEGAL_INDIVIDUAL = [
  /ist mein testament/i, /gültig/i, /gueltig/i, /wirksam/i, /rechtlich anerkannt/i,
  /darf ich rechtlich/i, /verbindlich/i, /erbrecht.*mein/i,
];

const MEDICAL_INDIVIDUAL = [
  /welche behandlung soll ich/i, /soll ich.*ablehnen/i, /soll ich.*annehmen/i,
  /welche medikamente/i, /diagnose/i, /symptom.*habe/i, /operieren.*soll/i,
];

const RELIGIOUS_INDIVIDUAL = [
  /fatwa/i, /halal.*haram.*mein/i, /darf ich islamisch/i, /ist es erlaubt.*mein/i,
  /fiqh.*urteil/i, /erbverteilung.*islam/i, /gib mir eine fatwa/i,
];

const GENERAL_ALLOWED = [
  /was ist/i, /was bedeutet/i, /was gehört/i, /allgemein/i, /erkläre/i, /erklaere/i,
  /orientierung/i, /begriff/i,
];

export function classifyKnowledgeSensitivity(question: string): KnowledgeSafetyLevel {
  const q = question.trim();
  if (RELIGIOUS_INDIVIDUAL.some((p) => p.test(q))) return "religious_sensitive";
  if (MEDICAL_INDIVIDUAL.some((p) => p.test(q))) return "medical_sensitive";
  if (LEGAL_INDIVIDUAL.some((p) => p.test(q))) return "legal_sensitive";
  if (GENERAL_ALLOWED.some((p) => p.test(q))) return "general_allowed";
  return "general_allowed";
}

export function isIndividualDecisionQuestion(question: string): boolean {
  const level = classifyKnowledgeSensitivity(question);
  return level !== "general_allowed";
}

export function knowledgeRedirectMessage(level: KnowledgeSafetyLevel): string {
  switch (level) {
    case "legal_sensitive":
      return "Bei individuellen Rechtsfragen bitte Anwalt, Notar oder eine qualifizierte Beratungsstelle konsultieren. Der Amanah-Assistent kann nur allgemeine Orientierung aus geprüften Einträgen geben — keine Rechtsberatung.";
    case "medical_sensitive":
      return "Bei medizinischen Entscheidungen bitte Arzt oder Fachperson konsultieren. Der Assistent hilft nur beim Dokumentieren deiner Wünsche — keine medizinische Beratung.";
    case "religious_sensitive":
      return "Bei religiösen Urteilsfragen bitte Imam/Gelehrte oder qualifizierte Fachperson konsultieren — keine Fatwa.";
    default:
      return "";
  }
}

export function isProductionSafe(entry: KnowledgeEntry): boolean {
  if (entry.reviewedStatus === "reviewed") return true;
  if (entry.reviewedStatus === "draft" && entry.riskLevel === "low") return true;
  return false;
}

export function reviewBadge(entry: KnowledgeEntry): string | undefined {
  if (entry.reviewedStatus === "reviewed") return undefined;
  if (entry.reviewedStatus === "needs_review") return "In fachlicher Prüfung";
  if (entry.reviewedStatus === "draft") return "Entwurf — allgemeine Orientierung";
  return undefined;
}
