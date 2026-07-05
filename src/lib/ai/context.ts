import type { AmanahOrdnerData, ModuleId } from "@/lib/domain/types";
import { getAllModuleProgress, getCriticalMissing, getRecommendedNextStep } from "@/lib/domain/validation";
import { pickDataFields } from "@/lib/store/store-utils";

const SENSITIVE_KEYS = new Set([
  "passwordHash", "token", "tokenHash", "session", "saveStatus", "saveError",
]);

export function sanitizeForAi<T extends Record<string, unknown>>(obj: T): T {
  const out = { ...obj };
  for (const key of Object.keys(out)) {
    if (SENSITIVE_KEYS.has(key)) delete out[key];
  }
  return out;
}

export function buildNextQuestionContext(data: AmanahOrdnerData) {
  const progress = getAllModuleProgress(data).map((m) => ({
    moduleId: m.moduleId,
    percent: m.percent,
    missing: m.missingRequired.slice(0, 3),
  }));
  const critical = getCriticalMissing(data);
  const next = getRecommendedNextStep(data);
  return { progress, critical, nextStep: { moduleId: next.moduleId, title: next.title } };
}

export function buildCompletionReviewContext(data: AmanahOrdnerData) {
  return {
    critical: getCriticalMissing(data),
    modules: getAllModuleProgress(data).filter((m) => m.percent < 100).slice(0, 8),
  };
}

export function buildFamilyMessageContext(data: AmanahOrdnerData) {
  return sanitizeForAi({
    name: data.emergencyCard.name || data.userProfile.name,
    emergencyContact: data.emergencyCard.emergencyContact1.name,
    janazahWish: data.janazahWishes.islamicBurialDesired,
    funeralDirector: data.janazahWishes.preferredFuneralDirector,
    familyNote: data.familyMessage.keyWishesSummary || data.janazahWishes.messageToFamily,
  });
}

export function buildExtractContext(data: AmanahOrdnerData, freeText: string) {
  return {
    freeText: freeText.slice(0, 2000),
    existingEmergencyContact: data.emergencyCard.emergencyContact1.name || null,
    existingName: data.emergencyCard.name || data.userProfile.name || null,
  };
}

export function buildKnowledgeContext(_question: string) {
  return { question: _question.slice(0, 500) };
}

export function minimalDataFromStore(store: Record<string, unknown>): AmanahOrdnerData {
  return pickDataFields(store as unknown as Parameters<typeof pickDataFields>[0]);
}

const FIELD_LABELS: Record<string, string> = {
  "emergencyCard.emergencyContact1.name": "Notfallkontakt Name",
  "emergencyCard.emergencyContact1.phone": "Notfallkontakt Telefon",
  "emergencyCard.emergencyContact1.relation": "Beziehung",
  "emergencyCard.name": "Name auf Notfallkarte",
  "janazahWishes.preferredFuneralDirector": "Gewünschter Bestatter",
  "powerOfAttorney.authorizedPerson": "Bevollmächtigte Person",
};

export function labelForField(path: string): string {
  return FIELD_LABELS[path] || path;
}

export function moduleTitle(moduleId: ModuleId): string {
  const titles: Record<ModuleId, string> = {
    notfallkarte: "Notfallkarte",
    krankheit: "Krankheit & Patientenverfügung",
    vollmacht: "Vorsorgevollmacht",
    betreuung: "Betreuungsverfügung",
    janazah: "Janazah-Wünsche",
    "ghusl-kafan": "Ghusl & Kafan",
    bestattung: "Bestattung",
    testament: "Testament & Erbe",
    "schulden-amanah": "Schulden & Amanah",
    "digitaler-nachlass": "Digitaler Nachlass",
    barzakh: "Barzakh-Plan",
    "sadaqa-jariya": "Sadaqa Jariya",
    familie: "Familiengespräch",
  };
  return titles[moduleId] || moduleId;
}
