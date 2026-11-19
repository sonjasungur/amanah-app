/**
 * Central lock for module texts with legal, medical or religious statements.
 *
 * Only neutral wording lives here. The original statements are kept outside the source tree, in
 * docs/release/gesperrte-modultexte.md, so they cannot reach pages, APIs or browser code. A reviewed
 * text returns only together with a documented review: see `released` below.
 */
export interface ModuleTextReview {
  reviewer: string;
  reviewedAt: string;
  document: string;
}

interface ModuleText {
  de: string;
  en?: string;
  /** Text after a documented review. Empty until a review exists. */
  released?: { de: string; en?: string; review: ModuleTextReview };
}

export const MODULE_TEXTS = {
  "testament-form-pdf": { de: "Formfragen klärt ein Anwalt oder Notar." },
  "testament-form-print": { de: "Formfragen klärt ein Anwalt oder Notar." },
  "vorsorge-documents-print": { de: "Zu Vollmacht und Patientenverfügung berät ein Anwalt, Notar oder Arzt." },
  "doc-vollmacht": { de: "Wo liegt das Original, und wer hat eine Kopie?" },
  "doc-testament": { de: "Wo liegt es, und wer weiß davon?" },
  "doc-ausweis": { de: "Wo liegt der Ausweis?" },
  "schulden-intro": { de: "Ordne offene Punkte: Schulden, anvertraute Dinge, Zakat und Versprechen." },
  "letter-vollmacht": { de: "benannte Person. Ob ein Dokument vorliegt und wo, bitte selbst ergänzen." },
  "letter-janazah": { de: "- Mir ist wichtig: [bitte in eigenen Worten ergänzen]" },
  "letter-schulden": { de: "Einzelheiten stehen im Ordner." },
  "janazah-donation-desc": { de: "Nachrichten, Verpflichtungen und Spendenwünsche.", en: "Messages, obligations and donation wishes." },
  "janazah-donation-field": { de: "Gewünschte Spenden oder Sadaqah", en: "Desired donations or Sadaqah" },
  "vollmacht-intro": { de: "Notiere, wen du dafür vorgesehen hast und wo das Dokument liegt." },
  "betreuung-intro": { de: "Notiere deine Wünsche und wo das Dokument liegt." },
  "sadaqa-intro": { de: "Halte deine Wünsche zu Spenden, Waqf und Projekten fest." },
  "sadaqa-tile": { de: "Deine Wünsche zu Spenden und Projekten." },
  "janazah-wish-help": { de: "Freitext — dein Wunsch in deinen eigenen Worten." },
  "amanah-return-question": { de: "Gibt es anvertraute Dinge, die noch bei dir liegen?" },
} satisfies Record<string, ModuleText>;

export type ModuleTextId = keyof typeof MODULE_TEXTS;

export function hasCompleteReview(review?: ModuleTextReview): boolean {
  return Boolean(review?.reviewer.trim() && review.reviewedAt.trim() && review.document.trim());
}

export function resolveModuleText(entry: ModuleText, language: "de" | "en" = "de"): string {
  const released = entry.released;
  if (released && hasCompleteReview(released.review)) return (language === "en" && released.en) || released.de;
  return (language === "en" && entry.en) || entry.de;
}

export function moduleText(id: ModuleTextId, language: "de" | "en" = "de"): string {
  return resolveModuleText(MODULE_TEXTS[id], language);
}
