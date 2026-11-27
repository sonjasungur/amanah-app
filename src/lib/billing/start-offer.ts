/**
 * What the public pages say about packages at the start (owner order 23.11.2026, draft for staging):
 * Basis is free, the paid packages are in preparation without price and without purchase. The knowledge
 * centre and the history stay closed at the start, so they are not listed as features.
 *
 * Always free for private customers (owner decision 27.11.2026): emergency card, simple asset overview,
 * family conversation, Islamic knowledge centre, Vorsorge-Check and later directories. None of them may
 * appear as content of a paid package.
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
    text: "In wenigen Minuten siehst du, was noch fehlt. Ohne Konto.",
    features: ["vorsorge_check"],
  },
  {
    title: "Erste Orientierung",
    text: "Dein Ergebnis mit klaren Prioritäten und dem nächsten Schritt.",
    features: ["vorsorge_check"],
  },
  {
    title: "Notfallkarte",
    text: "Wer im Notfall angerufen werden soll und was Helfer wissen müssen. Kostenlos, auch im Konto gespeichert.",
    features: ["vorsorge_start"],
  },
  {
    title: "Einfache Vermögensübersicht",
    text: "Konten, Versicherungen und Werte auf einen Blick, mit einfachem Ausdruck. Keine Erbberechnung.",
    features: ["asset_overview"],
  },
  {
    title: "Familiengespräch",
    text: "Festhalten, worüber ihr gesprochen habt, wer was übernimmt und was noch offen ist.",
    features: ["family_conversation_record"],
  },
  {
    title: "Hilfe im Todesfall",
    text: "„Jemand ist gestorben – was jetzt?“: die ersten Schritte für Angehörige.",
    features: ["inheritance_janazah_info"],
  },
  {
    title: "Islamisches Wissen",
    text: "Themenseiten zu Janazah, Erbe und Akhira. Das Wissenszentrum folgt nach fachlicher Prüfung – immer kostenlos.",
    features: ["inheritance_janazah_info"],
  },
];

export const START_ALWAYS_FREE = "Immer kostenlos: deine Daten exportieren, löschen und die Einwilligung widerrufen.";

/**
 * Planned paid packages (owner decision 26.11.2026): Wasiyya Vorsorge, Wasiyya Komplett, Premium – each paid
 * once, no subscription, upgrade by paying the difference. Shown without price and without purchase until the
 * owner releases price, terms and payment. START_PLUS_PLANNED is the content of "Wasiyya Vorsorge".
 */
export const START_PLUS_PLANNED: readonly string[] = [
  "Dein vollständiger Vorsorgeordner, verschlüsselt im Konto gespeichert",
  "Dokumente, Schulden, Amanah und digitaler Nachlass",
  "Janazah, Ghusl und Kafan, Bestattung oder Überführung",
  "Krankheit, Vollmacht und Betreuung als Notizen (keine rechtlichen Dokumente)",
  "Familienbrief, Vertrauenspersonen und professionelle Druckmappe für Angehörige",
];

export const START_KOMPLETT_PLANNED: readonly string[] = [
  "Alles aus Wasiyya Vorsorge",
  "Islamische Nachlassplanung: Familie, Vermögen, Wünsche und das Wasiyya-Drittel",
  "Testament vorbereiten – Gesprächsunterlage für Notar oder Kanzlei",
  "Später: Gegenüberstellung islamischer und deutscher Erbquoten zur Orientierung, nach fachlicher Prüfung – nicht rechtsverbindlich",
];

export const START_PREMIUM_PLANNED: readonly string[] = [
  "Alles aus Wasiyya Komplett",
  "Später: organisatorische Vorbereitung bis zum Termin bei Notar oder Anwalt – Umfang nach rechtlicher Prüfung",
  "Persönliche Rechtshandlungen nimmst du selbst vor",
];

/** Short line for the Premium card (pricing page and homepage). No legal service, no appointments, no costs taken over. */
export const START_PREMIUM_SUMMARY =
  "Organisatorische Vorbereitung bis zum Termin bei Notar oder Anwalt – Umfang nach rechtlicher Prüfung. Persönliche Rechtshandlungen nimmst du selbst vor.";

export const START_PLUS_STATUS =
  "Die Pakete kann man noch nicht kaufen. Preise und Bedingungen nennen wir, bevor sie buchbar sind. Bis dahin nutzt du alle Bereiche ohne Einschränkung.";
