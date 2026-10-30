/**
 * Processing purposes that need explicit consent (Art. 9 Abs. 2 lit. a DSGVO).
 * Each purpose is consented to separately; nothing is pre-ticked.
 *
 * The texts are DRAFTS for the data-protection review — not approved legal wording.
 * A new text version requires fresh consent (stored per version).
 */
export type ConsentPurpose = "sensitive_folder_storage" | "external_ai_processing";

export interface ConsentPurposeDefinition {
  purpose: ConsentPurpose;
  version: string;
  title: string;
  text: string;
  /** What happens when consent is withdrawn. Shown before withdrawal. */
  onWithdraw: string;
  /** Needed before the feature can be used at all. */
  requiredFor: string;
  draftForLegalReview: true;
}

export const CONSENT_PURPOSES: Record<ConsentPurpose, ConsentPurposeDefinition> = {
  sensitive_folder_storage: {
    purpose: "sensitive_folder_storage",
    version: "2026-10-30-entwurf-1",
    title: "Speicherung meines Vorsorgeordners im Konto",
    text:
      "Ich willige ausdrücklich ein, dass meine Angaben im Vorsorgeordner – einschließlich Angaben zu meiner Gesundheit " +
      "und Angaben, aus denen sich meine Religionszugehörigkeit ergibt – verschlüsselt auf dem Server von Mein Wille " +
      "gespeichert werden, damit ich sie geräteübergreifend nutzen und exportieren kann. Die Daten werden nicht an Dritte " +
      "weitergegeben und nicht für Werbung genutzt. Ich kann die Einwilligung jederzeit in den Einstellungen widerrufen.",
    onWithdraw:
      "Nach dem Widerruf werden deine Ordnerdaten vom Server gelöscht. Dein Konto bleibt bestehen. Lade die Daten vorher herunter, wenn du sie behalten möchtest.",
    requiredFor: "Server-Speicherung des Vorsorgeordners",
    draftForLegalReview: true,
  },
  external_ai_processing: {
    purpose: "external_ai_processing",
    version: "2026-10-30-entwurf-1",
    title: "Optionale KI-Unterstützung durch einen externen Anbieter",
    text:
      "Ich willige ein, dass für die von mir ausgelöste KI-Funktion die dafür nötigen Ausschnitte meiner Angaben an einen " +
      "externen KI-Anbieter übermittelt werden. Ohne diese Einwilligung funktioniert Mein Wille vollständig ohne externe KI.",
    onWithdraw: "Nach dem Widerruf werden keine Angaben mehr an den KI-Anbieter übermittelt.",
    requiredFor: "externe KI-Funktionen (derzeit deaktiviert)",
    draftForLegalReview: true,
  },
};

export function isConsentPurpose(value: unknown): value is ConsentPurpose {
  return typeof value === "string" && value in CONSENT_PURPOSES;
}
