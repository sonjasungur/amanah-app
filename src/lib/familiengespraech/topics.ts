export interface ConversationQuestion {
  id: string;
  text: string;
  example?: string;
}

export interface ConversationTopic {
  id: string;
  title: string;
  intro: string;
  questions: ConversationQuestion[];
  warningSignals?: string[];
}

export const FAMILIEN_GESPRAECH_TOPICS: ConversationTopic[] = [
  {
    id: "eheverstaendnis",
    title: "Eheverständnis",
    intro: "Klare Erwartungen an Ehe und Partnerschaft verhindern spätere Enttäuschungen.",
    questions: [
      { id: "ehe-1", text: "Was bedeutet Ehe für dich?", example: "Gemeinsame Verantwortung, Nähe, Teamwork im Alltag?" },
      { id: "ehe-2", text: "Welche Erwartungen hast du an deinen Ehepartner?" },
      { id: "ehe-3", text: "Wie stellst du dir den Alltag in der Ehe vor?" },
      { id: "ehe-4", text: "Welche Verantwortung möchtest du übernehmen?" },
    ],
  },
  {
    id: "religion",
    title: "Religion und Werte",
    intro: "Religiöse Praxis und Werte prägen den Familienalltag — offen sprechen hilft.",
    questions: [
      { id: "rel-1", text: "Wie wichtig ist dir die tägliche religiöse Praxis?" },
      { id: "rel-2", text: "Wie möchtest du islamische Werte im Familienalltag leben?" },
      { id: "rel-3", text: "Wie gehst du mit unterschiedlichen religiösen Auffassungen um?" },
      { id: "rel-4", text: "Welche Werte sollen Kindern vermittelt werden?" },
    ],
  },
  {
    id: "familie-grenzen",
    title: "Familie und Grenzen",
    intro: "Rollen von Eltern, Geschwistern und Paar brauchen klare Absprachen.",
    questions: [
      { id: "fam-1", text: "Welche Rolle sollen Eltern und Geschwister in der Ehe spielen?" },
      { id: "fam-2", text: "Wie werden Entscheidungen getroffen?" },
      { id: "fam-3", text: "Wie gehen wir mit Einmischung von außen um?" },
      { id: "fam-4", text: "Welche Grenzen brauchen beide Ehepartner?" },
    ],
  },
  {
    id: "wohnsituation",
    title: "Wohnsituation",
    intro: "Wohnort und Zusammenleben mit der Familie sind häufige Konfliktthemen.",
    questions: [
      { id: "wohn-1", text: "Wo soll das Ehepaar wohnen?" },
      { id: "wohn-2", text: "Ist das Zusammenleben mit Eltern geplant?" },
      { id: "wohn-3", text: "Ist ein späterer Umzug möglich?" },
      { id: "wohn-4", text: "Wie wichtig ist Nähe zur Familie?" },
    ],
  },
  {
    id: "finanzen",
    title: "Finanzen",
    intro: "Ehrliche Gespräche über Geld schaffen Vertrauen und Planbarkeit.",
    questions: [
      { id: "fin-1", text: "Wie wird mit Einkommen und Ausgaben umgegangen?" },
      { id: "fin-2", text: "Gibt es Schulden oder finanzielle Verpflichtungen?" },
      { id: "fin-3", text: "Wie wird gespart?" },
      { id: "fin-4", text: "Wie werden größere Anschaffungen entschieden?" },
      { id: "fin-5", text: "Welche Erwartungen bestehen bezüglich Beruf und Einkommen?" },
    ],
  },
  {
    id: "beruf-alltag",
    title: "Beruf und Alltag",
    intro: "Arbeit, Haushalt und Belastung sollten vor der Ehe besprochen werden.",
    questions: [
      { id: "ber-1", text: "Sollen beide arbeiten?" },
      { id: "ber-2", text: "Wie werden Haushalt und Organisation aufgeteilt?" },
      { id: "ber-3", text: "Was passiert bei beruflicher Belastung?" },
      { id: "ber-4", text: "Wie sieht ein normaler Tagesablauf aus?" },
    ],
  },
  {
    id: "kinder",
    title: "Kinder",
    intro: "Kinderwunsch, Timing und Erziehung sind sensible, wichtige Themen.",
    questions: [
      { id: "kin-1", text: "Besteht Kinderwunsch?" },
      { id: "kin-2", text: "Wann sollen Kinder kommen?" },
      { id: "kin-3", text: "Wie viele Kinder sind ungefähr gewünscht?" },
      { id: "kin-4", text: "Wie soll die Betreuung organisiert werden?" },
      { id: "kin-5", text: "Welche Vorstellungen bestehen zur Erziehung?" },
      { id: "kin-6", text: "Wie wird mit bestehenden Kindern aus früheren Beziehungen umgegangen?" },
    ],
  },
  {
    id: "kommunikation",
    title: "Kommunikation und Konflikte",
    intro: "Wie ihr streitet und euch versöhnt, entscheidet über die Qualität der Ehe.",
    questions: [
      { id: "kom-1", text: "Wie reagierst du bei Streit?" },
      { id: "kom-2", text: "Brauchst du Rückzug oder ein direktes Gespräch?" },
      { id: "kom-3", text: "Wie gehst du mit Kritik um?" },
      { id: "kom-4", text: "Was ist für dich respektlos?" },
      { id: "kom-5", text: "Wie entschuldigt man sich?" },
      { id: "kom-6", text: "Wann sollte externe Hilfe einbezogen werden?" },
    ],
  },
  {
    id: "gesundheit",
    title: "Gesundheit und Belastungen",
    intro: "Respektvoll über Belastungen sprechen — ohne Diagnosen oder Druck.",
    questions: [
      { id: "ges-1", text: "Gibt es gesundheitliche Themen, die den gemeinsamen Alltag wesentlich beeinflussen?" },
      { id: "ges-2", text: "Wie wird mit Stress umgegangen?" },
      { id: "ges-3", text: "Welche Unterstützung wird in schwierigen Zeiten erwartet?" },
      { id: "ges-4", text: "Welche Themen sollten vor der Ehe offen angesprochen werden?" },
    ],
  },
  {
    id: "warnsignale",
    title: "Warnsignale",
    intro: "Einzelne Punkte sind kein endgültiges Urteil — im Zusammenhang ernst nehmen und bei Gefahr Hilfe suchen.",
    questions: [],
    warningSignals: [
      "Druck zu schnellen Entscheidungen",
      "Widersprüchliche Aussagen",
      "Kontrolle und Isolation",
      "Herabwürdigung",
      "Aggressives Verhalten",
      "Fehlender Respekt gegenüber Grenzen",
      "Verschweigen wichtiger Tatsachen",
      "Finanzielle Manipulation",
      "Religiöse Aussagen als Druckmittel",
      "Verweigerung vernünftiger Gespräche",
    ],
  },
];
