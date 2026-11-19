import { hasCompleteReview, type ModuleTextReview } from "@/lib/content/module-texts";

/**
 * Short help next to fields that need explaining. Like the module texts, only neutral wording is
 * shown: what a term names, why the family may need it, what to enter, an example and whom to ask.
 * Religious rulings and legal effects are not stated here. Their draft texts wait for review in
 * docs/release/hilfetexte-pruefung-p2.md; a reviewed text returns only with a documented review.
 */
export interface HelpTopic {
  title: string;
  /** What the term names, descriptive only. */
  meaning: string;
  /** Why the information can help the family. */
  why: string;
  /** What to enter here. */
  enter: string;
  example?: string;
  /** Who can clarify religious questions and legal effects. Never a ruling. */
  ask: string;
  /** Reviewed explanation of religious orientation and German law. Empty until reviewed. */
  released?: { text: string; review: ModuleTextReview };
}

const ASK_IMAM = "Religiöse Fragen klärst du mit deinem Imam oder einer Gelehrten bzw. einem Gelehrten deines Vertrauens.";
const ASK_LAWYER = "Ob und wie etwas rechtlich wirkt, klärt ein Anwalt oder Notar.";

export const HELP_TOPICS = {
  ghusl: {
    title: "Ghusl",
    meaning: "Ghusl ist die rituelle Waschung eines verstorbenen Menschen vor der Bestattung.",
    why: "Deine Familie und der Bestatter wissen dann, wen sie ansprechen sollen und was dir wichtig ist.",
    enter: "Wer die Waschung übernehmen soll oder welche Gemeinde bzw. welches Team du dir wünschst.",
    example: "„Die Frauen der Gemeinde X; meine Schwester soll dabei sein.“",
    ask: `${ASK_IMAM} Den Ablauf vor Ort stimmt der Bestatter mit der Gemeinde ab.`,
  },
  kafan: {
    title: "Kafan",
    meaning: "Kafan ist das Leichentuch, in das ein verstorbener Mensch eingehüllt wird.",
    why: "Wenn du Wünsche dazu hast, muss sie niemand erraten.",
    enter: "Persönliche Wünsche zum Leichentuch, falls du welche hast. Wenn nicht, lass das Feld leer.",
    ask: ASK_IMAM,
  },
  "ghusl-personen": {
    title: "Wer wäscht?",
    meaning: "Hier geht es darum, welche Personen die Waschung durchführen oder dabei sein sollen.",
    why: "Im Ernstfall muss die Familie das schnell entscheiden. Dein Wunsch hilft dabei.",
    enter: "Namen, Beziehungen oder Gruppen, zum Beispiel „Frauen aus meiner Familie“.",
    ask: `${ASK_IMAM} Was vor Ort möglich ist, weiß der Bestatter.`,
  },
  schamgrenzen: {
    title: "Würde und Privatsphäre",
    meaning: "Deine persönlichen Grenzen: wer dich sehen oder berühren darf, bei Pflege, im Krankenhaus oder nach dem Tod.",
    why: "Pflegende, Ärzte und Familie können deine Wünsche nur achten, wenn sie sie kennen.",
    enter: "Was dir wichtig ist, in eigenen Worten.",
    example: "„Wenn möglich, pflegen mich Frauen.“",
    ask: "Was im Krankenhaus umsetzbar ist, besprichst du am besten mit Ärzten und Pflege.",
  },
  "janazah-gebet": {
    title: "Janazah-Gebet",
    meaning: "Das Gemeinschaftsgebet für einen verstorbenen Menschen vor der Beisetzung.",
    why: "Die Familie weiß dann, in welcher Moschee oder durch wen das Gebet stattfinden soll.",
    enter: "Wünsche zu Ort, Moschee oder Imam.",
    ask: ASK_IMAM,
  },
  "bestattung-ort": {
    title: "Beisetzung in Deutschland oder Überführung",
    meaning: "Die Entscheidung, ob du in Deutschland beigesetzt oder in ein anderes Land überführt werden möchtest.",
    why: "Eine Überführung braucht Zeit, Papiere und Geld. Wenn deine Familie deinen Wunsch kennt, kann sie früh planen.",
    enter: "Deinen Wunsch und, falls du schon weißt, welchen Friedhof oder welches Land.",
    example: "„Muslimisches Gräberfeld in meiner Stadt; wenn nicht möglich, Überführung nach …“",
    ask: "Fristen, Papiere und Kosten kennt ein Bestatter. Bestattungsregeln unterscheiden sich je nach Bundesland.",
  },
  "moschee-bestatter": {
    title: "Moschee, Imam und Bestatter",
    meaning: "Die Ansprechpartner, die deine Familie im Todesfall anrufen soll.",
    why: "In den ersten Stunden muss vieles schnell gehen. Feste Ansprechpartner sparen Suchen.",
    enter: "Name und, wenn du sie kennst, Telefonnummer der Moschee, des Imams oder des Bestatters.",
    ask: "Ob ein Bestatter islamische Bestattungen begleitet, fragst du am besten vorher bei ihm nach.",
  },
  patientenverfuegung: {
    title: "Patientenverfügung",
    meaning: "Ein eigenes Dokument, in dem du festlegst, welche ärztlichen Behandlungen du wünschst oder ablehnst, wenn du selbst nicht mehr entscheiden kannst.",
    why: "Ärzte und Familie müssen wissen, ob es eine Patientenverfügung gibt und wo sie liegt.",
    enter: "Hier nur, ob es sie gibt und wo das Original liegt, und deine Wünsche in eigenen Worten. Amanah – Mein Wille erstellt keine Patientenverfügung.",
    ask: `Zur medizinischen Seite berät dein Arzt. ${ASK_LAWYER} ${ASK_IMAM}`,
  },
  vorsorgevollmacht: {
    title: "Vorsorgevollmacht",
    meaning: "Ein eigenes Dokument, mit dem du eine Person bevollmächtigst, für dich zu handeln, wenn du es selbst nicht kannst.",
    why: "Deine Familie muss wissen, wen du vorgesehen hast und wo das Dokument liegt.",
    enter: "Wen du vorgesehen hast und wo das Original liegt. Der Eintrag hier ist keine Vollmacht.",
    ask: ASK_LAWYER,
  },
  betreuungsverfuegung: {
    title: "Betreuungsverfügung",
    meaning: "Ein eigenes Dokument mit deinen Wünschen, wer für dich als rechtlicher Betreuer bestellt werden soll und wer nicht.",
    why: "Deine Familie kann deine Wünsche dann weitergeben.",
    enter: "Wen du dir wünschst, wen nicht, und wo das Dokument liegt.",
    ask: ASK_LAWYER,
  },
  erbprofil: {
    title: "Erbprofil",
    meaning: "Eine Sammlung von Fakten zu deiner Familie und deinem Vermögen für das Gespräch mit Fachleuten.",
    why: "Mit diesen Fakten lassen sich Fragen zum Erbe schneller und genauer klären.",
    enter: "Familienstand, Kinder, Eltern, Vermögen grob. Es ist kein Testament und berechnet keine Anteile.",
    ask: `${ASK_LAWYER} ${ASK_IMAM}`,
  },
  wasiyya: {
    title: "Waṣiyya",
    meaning: "Waṣiyya bezeichnet das islamische Vermächtnis bzw. die letztwillige Verfügung.",
    why: "Wenn du Notizen dazu hast, kannst du sie im Gespräch mit Fachleuten verwenden.",
    enter: "Deine Gedanken und Fragen. Eine Notiz hier ist kein Testament.",
    ask: `${ASK_IMAM} ${ASK_LAWYER}`,
  },
  "sadaqa-jariya": {
    title: "Sadaqa Jariya",
    meaning: "Sadaqa Jariya bezeichnet eine fortlaufende Wohltätigkeit, zum Beispiel eine Spende für einen Brunnen oder eine Schule.",
    why: "Deine Familie weiß dann, welche Projekte dir am Herzen liegen.",
    enter: "Projekte, Organisationen oder Ideen, die dir wichtig sind.",
    ask: ASK_IMAM,
  },
  "digitaler-nachlass": {
    title: "Digitaler Nachlass",
    meaning: "Deine Online-Konten, Verträge und Dateien, also E-Mail, Banking, Abos oder Fotos in der Cloud.",
    why: "Ohne Hinweise findet deine Familie Konten und laufende Verträge oft nicht.",
    enter: "Welches Konto es gibt und wo die Zugangsdaten sicher liegen. Niemals das Passwort selbst.",
    example: "„E-Mail-Hauptkonto – Zugangsdaten im Passwort-Manager, Notfallzugang hat meine Schwester.“",
    ask: "Viele Anbieter haben eigene Regeln für Angehörige. Frage bei wichtigen Konten nach.",
  },
  "schulden-amanah": {
    title: "Schulden und Amanah",
    meaning: "Was du anderen schuldest, was andere dir schulden und was dir anvertraut wurde (Amanah).",
    why: "Deine Familie kann Offenes nur regeln, wenn sie davon weiß.",
    enter: "Was, wem bzw. von wem, und wo Belege liegen.",
    example: "„Darlehen von Onkel Ahmad, 500 €, Quittung im Ordner Finanzen.“",
    ask: `${ASK_IMAM} ${ASK_LAWYER}`,
  },
  "dokumente-ablage": {
    title: "Dokumente und Aufbewahrung",
    meaning: "Wichtige Unterlagen wie Ausweis, Versicherungen, Vollmachten und Testament.",
    why: "Im Ernstfall verliert deine Familie sonst viel Zeit mit Suchen.",
    enter: "Ob es das Dokument gibt und wo das Original liegt. Amanah – Mein Wille speichert keine Dateien.",
    example: "„Ordner ‚Vorsorge‘ im Arbeitszimmer, Kopie bei meiner Schwester.“",
    ask: "Wie ein Testament sicher verwahrt werden kann, weiß ein Notar oder das Nachlassgericht.",
  },
} satisfies Record<string, HelpTopic>;

export type HelpTopicId = keyof typeof HELP_TOPICS;

/** The reviewed explanation, or null while no documented review exists. */
export function releasedHelp(id: HelpTopicId): string | null {
  const topic: HelpTopic = HELP_TOPICS[id];
  return topic.released && hasCompleteReview(topic.released.review) ? topic.released.text : null;
}
