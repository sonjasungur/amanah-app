/**
 * What the public pages say about packages at the start (owner order 23.11.2026, draft for staging):
 * Basis is free, Vorsorge Plus is in preparation without price and without purchase. The knowledge
 * centre and the history stay closed at the start, so they are not listed as features.
 *
 * Every Basis item names the plan-matrix feature it describes, so a test can check that the page
 * promises only free features that are switched on at the start.
 */
export interface OfferItem {
  title: string;
  text: string;
  /** Plan-matrix feature ids this item stands for. */
  features: readonly string[];
}

export const START_BASIS: readonly OfferItem[] = [
  {
    title: "Vorsorge-Check",
    text: "In wenigen Minuten siehst du, was noch fehlt, und bekommst einen klaren nächsten Schritt. Ohne Konto.",
    features: ["vorsorge_check"],
  },
  {
    title: "Notfallkarte",
    text: "Die wichtigsten Angaben für den Ernstfall, im Konto gespeichert und zum Ausdrucken.",
    features: ["vorsorge_start"],
  },
  {
    title: "Vermögensübersicht",
    text: "Eine Bestandsaufnahme mit einfachem Ausdruck. Sie ist kein Testament.",
    features: ["asset_overview"],
  },
  {
    title: "Familiengespräche festhalten",
    text: "Wann ihr gesprochen habt, worüber und was noch offen ist.",
    features: ["family_conversation_record"],
  },
  {
    title: "„Jemand ist gestorben – was jetzt?“",
    text: "Die ersten Schritte für Angehörige.",
    features: ["inheritance_janazah_info"],
  },
];

export const START_ALWAYS_FREE = "Immer kostenlos: deine Daten exportieren, löschen und die Einwilligung widerrufen.";

/** Planned Plus content in plain words; no price and no purchase until the owner releases them. */
export const START_PLUS_PLANNED: readonly string[] = [
  "Dein vollständiger Vorsorgeordner, verschlüsselt im Konto gespeichert",
  "Deine Wünsche zu Janazah, Ghusl und Kafan, Bestattung oder Überführung",
  "Krankheit und Patientenverfügung, Vollmacht und Betreuung als Notizen (keine rechtlichen Dokumente)",
  "Schulden und Amanah, digitaler Nachlass, Familie und Vertrauenspersonen",
  "Brief an deine Familie und Druckmappe für Angehörige",
];

export const START_PLUS_STATUS =
  "Vorsorge Plus kann man noch nicht kaufen. Preis und Bedingungen nennen wir, bevor es buchbar wird. Bis dahin nutzt du alle Bereiche ohne Einschränkung.";
