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
    id: "notfall-informieren",
    title: "Wer im Notfall informiert werden soll",
    intro: "Klärt, wer zuerst benachrichtigt wird und wer die Familie zusammenhält.",
    questions: [
      { id: "nf-1", text: "Wer soll im Notfall als Erstes informiert werden?" },
      { id: "nf-2", text: "Wer kennt die aktuellen Telefonnummern der wichtigsten Angehörigen?" },
      { id: "nf-3", text: "Gibt es Personen, die bewusst nicht zuerst angerufen werden sollen?" },
      { id: "nf-4", text: "Wer informiert Moschee, Imam oder Gemeinde, falls das gewünscht ist?" },
    ],
  },
  {
    id: "vertrauensperson",
    title: "Vertrauensperson",
    intro: "Eine benannte Vertrauensperson entlastet die Familie, wenn Entscheidungen anstehen.",
    questions: [
      { id: "vp-1", text: "Wer soll als Vertrauensperson für medizinische und organisatorische Entscheidungen gelten?" },
      { id: "vp-2", text: "Kennt diese Person den Aufbewahrungsort wichtiger Unterlagen?" },
      { id: "vp-3", text: "Gibt es eine Ersatzperson, falls die erste nicht erreichbar ist?" },
      { id: "vp-4", text: "Welche Entscheidungen darf die Vertrauensperson treffen — und welche nicht?" },
    ],
  },
  {
    id: "unterlagen",
    title: "Wo wichtige Unterlagen liegen",
    intro: "Im Ernstfall zählt, dass jemand die richtigen Dokumente findet.",
    questions: [
      { id: "ul-1", text: "Wo liegen Ausweise, Vollmacht und Patientenverfügung?" },
      { id: "ul-2", text: "Wer hat Zugang zu diesem Ort?" },
      { id: "ul-3", text: "Gibt es eine digitale Kopie — und wer kennt den Speicherort, ohne Passwörter im Klartext?" },
      { id: "ul-4", text: "Welche Unterlagen sollen im Notfall sofort greifbar sein?" },
    ],
  },
  {
    id: "janazah-wuensche",
    title: "Janazah-Wünsche",
    intro: "Persönliche Bestattungswünsche gehören in ein ruhiges Gespräch, bevor Zeitdruck entsteht.",
    questions: [
      { id: "jz-1", text: "Welche Janazah-Wünsche sollen die Angehörigen kennen?" },
      { id: "jz-2", text: "Ist Beisetzung in Deutschland oder eine Überführung gewünscht?" },
      { id: "jz-3", text: "Wer soll Moschee, Imam oder Bestattungskontakt benachrichtigen?" },
      { id: "jz-4", text: "Gibt es Wünsche zu Ghusl, Kafan oder Anwesenden?" },
    ],
  },
  {
    id: "schulden-pflichten",
    title: "Schulden und offene Verpflichtungen",
    intro: "Offene Rechte und Amanah sollen nicht erst im Nachlass überraschend auftauchen.",
    questions: [
      { id: "sc-1", text: "Wer kennt bestehende Schulden, geliehene Dinge oder offene Verpflichtungen?" },
      { id: "sc-2", text: "Gibt es Amanah, die zurückgegeben werden muss?" },
      { id: "sc-3", text: "Wo ist das schriftlich festgehalten?" },
      { id: "sc-4", text: "Wen soll die Familie dazu fragen, falls etwas unklar bleibt?" },
    ],
  },
  {
    id: "ernstfall-wissen",
    title: "Was die Familie im Ernstfall wissen soll",
    intro: "Haltet fest, was Angehörige entlastet — ohne alles auf einmal klären zu müssen.",
    questions: [
      { id: "er-1", text: "Was soll die Familie im Ernstfall zuerst tun?" },
      { id: "er-2", text: "Welche medizinischen oder religiösen Wünsche sind bereits dokumentiert?" },
      { id: "er-3", text: "Welche Kontakte (Arzt, Moschee, Vertrauensperson) sollen bekannt sein?" },
      { id: "er-4", text: "Gibt es einen Familienbrief, den jemand vorlesen oder weitergeben soll?" },
    ],
  },
  {
    id: "nicht-weitergeben",
    title: "Was bewusst nicht weitergegeben werden soll",
    intro: "Nicht jede Angabe gehört an jede Person. Grenzen schützen Würde und Privatsphäre.",
    questions: [
      { id: "nw-1", text: "Welche Angaben sollen nur die Vertrauensperson kennen?" },
      { id: "nw-2", text: "Welche Informationen sollen nicht in Gruppenchats oder öffentlich geteilt werden?" },
      { id: "nw-3", text: "Gibt es Zugänge oder Dokumente, die nicht an Dritte gehen dürfen?" },
      { id: "nw-4", text: "Wen soll die Familie nicht um Entscheidungen bitten?" },
    ],
  },
];
