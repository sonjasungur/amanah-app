import type { SafetyResult, UserIntent } from "./types";

export const DOMAIN_DISCLAIMER =
  "Orientierung und Vorbereitung — keine Garantie auf Vollständigkeit oder rechtliche/medizinische/religiöse Wirksamkeit. Fachliche Prüfung empfohlen.";

export const BLOCKED_REDIRECT =
  "Bitte prüfe diese Frage mit einer qualifizierten Fachperson — Anwalt, Notar, Arzt oder Imam/Gelehrten.";

const LEGAL_PATTERNS = [
  /rechtsberatung/i, /anwalt/i, /notar/i, /gültig/i, /gueltig/i, /wirksam/i, /verbindlich/i,
  /erbrecht/i, /testament.*gültig/i, /patientenverfügung.*gültig/i,
];

const MEDICAL_PATTERNS = [
  /diagnose/i, /behandlung/i, /medikament/i, /therapie/i, /krankheit.*habe/i, /symptom/i,
  /ärztlich.*empfehl/i, /medizinisch.*entscheid/i,
];

const FATWA_PATTERNS = [
  /fatwa/i, /halal.*haram/i, /ist es erlaubt/i, /darf ich islamisch/i, /schär/i, /fiqh.*urteil/i,
  /gib mir eine fatwa/i, /fatwa.*erb/i,
];

const INHERITANCE_CALC_PATTERNS = [
  /erbanteil.*berechn/i, /wie viel erbt/i, /prozent.*tochter/i, /fara/i, /fard/i, /erbschaft.*quote/i,
  /alles vererben/i, /100\s*%/i,
];

const VALIDITY_PATTERNS = [
  /ist mein testament/i, /dokument.*gültig/i, /rechtlich anerkannt/i,
];

const DIAGNOSIS_PATTERNS = [/was habe ich/i, /habe ich krebs/i, /diagnose/i];

const TREATMENT_PATTERNS = [/soll ich.*nehmen/i, /welche behandlung/i, /operieren/i, /behandlung.*ablehn/i, /soll ich.*ablehnen/i];

const AUTO_NOTIFY_PATTERNS = [
  /informiere.*angehörig/i,
  /informiere.*familie/i,
  /benachrichtige.*automatisch/i,
  /automatisch.*verschick/i,
  /automatisch.*senden/i,
  /angehörige.*automatisch/i,
];

const ISLAMIC_INHERITANCE_PATTERNS = [
  /erbe.*islamisch/i,
  /islamisch.*erbe/i,
  /islamisch.*korrekt.*verteil/i,
  /wie verteile ich mein erbe/i,
];

export function classifyUserIntent(text: string): UserIntent {
  const t = text.toLowerCase();
  if (AUTO_NOTIFY_PATTERNS.some((p) => p.test(t))) return "blocked";
  if (FATWA_PATTERNS.some((p) => p.test(t))) return "fatwa";
  if (ISLAMIC_INHERITANCE_PATTERNS.some((p) => p.test(t))) return "inheritance_calculation";
  if (INHERITANCE_CALC_PATTERNS.some((p) => p.test(t))) return "inheritance_calculation";
  if (VALIDITY_PATTERNS.some((p) => p.test(t))) return "validity";
  if (DIAGNOSIS_PATTERNS.some((p) => p.test(t))) return "diagnosis";
  if (TREATMENT_PATTERNS.some((p) => p.test(t))) return "treatment";
  if (MEDICAL_PATTERNS.some((p) => p.test(t))) return "medical";
  if (LEGAL_PATTERNS.some((p) => p.test(t))) return "legal";
  if (/zusammenfass/i.test(t)) return "summarize";
  if (/formulier/i.test(t)) return "formulate";
  if (/ordn/i.test(t) || /struktur/i.test(t)) return "organize";
  return "general";
}

const BLOCKED_INTENTS: UserIntent[] = [
  "legal", "medical", "fatwa", "inheritance_calculation", "validity", "diagnosis", "treatment", "blocked",
];

export function enforceAiSafety(text: string, feature?: string): SafetyResult {
  const intent = classifyUserIntent(text);
  if (BLOCKED_INTENTS.includes(intent)) {
    return {
      allowed: false,
      intent: "blocked",
      redirectMessage: safeResponseTemplate(intent),
      disclaimer: DOMAIN_DISCLAIMER,
    };
  }
  if (feature === "knowledge" && intent !== "general" && intent !== "organize" && intent !== "formulate" && intent !== "summarize") {
    return {
      allowed: false,
      intent: "blocked",
      redirectMessage: safeResponseTemplate(intent),
      disclaimer: DOMAIN_DISCLAIMER,
    };
  }
  return { allowed: true, intent, disclaimer: DOMAIN_DISCLAIMER };
}

export function safeResponseTemplate(intent: UserIntent): string {
  switch (intent) {
    case "legal":
    case "validity":
      return `${BLOCKED_REDIRECT}\n\nDer Amanah-Assistent kann bei rechtlichen Fragen nur beim Ordnen und Formulieren helfen — keine Rechtsberatung.`;
    case "medical":
    case "diagnosis":
    case "treatment":
      return `${BLOCKED_REDIRECT}\n\nBei medizinischen Fragen kann der Assistent nur beim Dokumentieren deiner Wünsche helfen — keine medizinische Beratung.`;
    case "fatwa":
      return `${BLOCKED_REDIRECT}\n\nBei religiösen Urteilsfragen verweise ich auf qualifizierte Imam/Gelehrte — keine Fatwa.`;
    case "inheritance_calculation":
      return `${BLOCKED_REDIRECT}\n\nErbanteile können hier nicht verbindlich berechnet werden. Nutze den Orientierungs-Check im Testament-Modul und konsultiere Imam/Gelehrte und Anwalt/Notar.`;
    case "blocked":
      return `${BLOCKED_REDIRECT}\n\nAmanah sendet nichts automatisch an Angehörige. Exportiere und teile Dokumente nur bewusst und sicher.`;
    default:
      return `${BLOCKED_REDIRECT}\n\n${DOMAIN_DISCLAIMER}`;
  }
}
