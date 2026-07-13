export type CheckCategory =
  | "profil"
  | "vorsorge"
  | "janazah"
  | "erbe"
  | "digital"
  | "barzakh";

export interface CheckQuestion {
  id: string;
  text: string;
  label: string;
  category: CheckCategory;
  modulePath?: string;
  urgent: boolean;
  /** If false, "Nein" is the concerning answer (profile questions) */
  yesIsGood?: boolean;
}

export const CHECK_QUESTIONS: CheckQuestion[] = [
  {
    id: "convert",
    text: "Bist du konvertiert?",
    label: "Konvertit·in",
    category: "profil",
    urgent: false,
    yesIsGood: true,
  },
  {
    id: "family-muslim",
    text: "Ist deine Familie überwiegend muslimisch?",
    label: "Muslimische Familie",
    category: "profil",
    urgent: false,
    yesIsGood: true,
  },
  {
    id: "married",
    text: "Bist du verheiratet?",
    label: "Familienstand",
    category: "profil",
    urgent: false,
    yesIsGood: true,
  },
  {
    id: "trust-muslim",
    text: "Gibt es eine muslimische Vertrauensperson für Notfall und Janazah?",
    label: "Muslimische Vertrauensperson",
    category: "profil",
    modulePath: "/dashboard/notfallkarte",
    urgent: true,
    yesIsGood: true,
  },
  {
    id: "family-knows-islam",
    text: "Weiß deine Familie, was im Todesfall islamisch wichtig ist?",
    label: "Islamisches Wissen in der Familie",
    category: "profil",
    modulePath: "/dashboard/familie",
    urgent: true,
    yesIsGood: true,
  },
  {
    id: "patientenverfuegung",
    text: "Hast du eine Patientenverfügung?",
    label: "Patientenverfügung",
    category: "vorsorge",
    modulePath: "/dashboard/krankheit",
    urgent: true,
  },
  {
    id: "vollmacht",
    text: "Hast du eine Vorsorgevollmacht?",
    label: "Vorsorgevollmacht",
    category: "vorsorge",
    modulePath: "/dashboard/vollmacht",
    urgent: true,
  },
  {
    id: "notfall-contact",
    text: "Weiß deine Familie, wer im Notfall entscheiden darf?",
    label: "Notfallkontakt & Entscheidungsbefugnis",
    category: "vorsorge",
    modulePath: "/dashboard/notfallkarte",
    urgent: true,
  },
  {
    id: "janazah",
    text: "Hast du deine Janazah-Wünsche dokumentiert?",
    label: "Janazah-Wünsche",
    category: "janazah",
    modulePath: "/dashboard/janazah",
    urgent: true,
  },
  {
    id: "burial",
    text: "Ist geklärt: Beisetzung in Deutschland oder Überführung?",
    label: "Bestattung / Überführung",
    category: "janazah",
    modulePath: "/dashboard/bestattung",
    urgent: true,
  },
  {
    id: "bestatter",
    text: "Hast du einen islamischen Bestatter oder Moschee-Kontakt notiert?",
    label: "Bestatter-Kontakt",
    category: "janazah",
    modulePath: "/dashboard/janazah",
    urgent: true,
  },
  {
    id: "schulden",
    text: "Hast du Schulden, geliehene Dinge und Amanah aufgeschrieben?",
    label: "Schulden & Amanah",
    category: "erbe",
    modulePath: "/dashboard/schulden-amanah",
    urgent: true,
  },
  {
    id: "testament",
    text: "Hast du Testament und islamisches Erbe vorbereitet?",
    label: "Testament & Erbe",
    category: "erbe",
    modulePath: "/dashboard/testament",
    urgent: true,
  },
  {
    id: "digital",
    text: "Ist dein digitaler Nachlass dokumentiert?",
    label: "Digitaler Nachlass",
    category: "digital",
    modulePath: "/dashboard/digitaler-nachlass",
    urgent: true,
  },
  {
    id: "sadaqa",
    text: "Hast du Sadaqa Jariya und Barzakh-Vorbereitung geregelt?",
    label: "Sadaqa Jariya & Barzakh",
    category: "barzakh",
    modulePath: "/dashboard/sadaqa-jariya",
    urgent: false,
  },
];

export const CHECK_TOTAL = CHECK_QUESTIONS.length;
