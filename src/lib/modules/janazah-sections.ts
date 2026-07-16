import type { FieldConfig } from "@/components/modules/module-form";

export interface JanazahSection {
  id: string;
  title: string;
  description: string;
  fields: FieldConfig[];
}

export const janazahSections: JanazahSection[] = [
  {
    id: "grunddaten",
    title: "Grunddaten",
    description: "Damit deine Wünsche eindeutig zugeordnet werden können.",
    fields: [
      { key: "fullName", label: "Gewünschter vollständiger Name", type: "text", testId: "janazah-fullName" },
      {
        key: "birthDate",
        label: "Geburtsdatum",
        type: "text",
        placeholder: "TT.MM.JJJJ",
        showWhenProfileBirthDateEmpty: true,
        testId: "janazah-birthDate",
      },
      { key: "locationRegion", label: "Ort oder Region", type: "text", testId: "janazah-locationRegion" },
      { key: "trustedContact", label: "Ansprechpartner oder Vertrauensperson", type: "text", testId: "janazah-trustedContact" },
    ],
  },
  {
    id: "benachrichtigung",
    title: "Benachrichtigung und Kontakt",
    description: "Wer soll im Todesfall informiert werden und wer koordiniert?",
    fields: [
      { key: "peopleToNotify", label: "Personen, die informiert werden sollen", type: "textarea", testId: "janazah-peopleToNotify" },
      { key: "mosqueCommunity", label: "Zuständige Moschee oder muslimische Gemeinde", type: "text", testId: "janazah-mosqueCommunity" },
      { key: "preferredFuneralDirector", label: "Bestattungsunternehmen (falls bekannt)", type: "text", testId: "janazah-preferredFuneralDirector" },
      { key: "additionalContacts", label: "Weitere Kontaktinformationen", type: "textarea", testId: "janazah-additionalContacts" },
    ],
  },
  {
    id: "ghusl-janazah",
    title: "Ghusl und Janazah",
    description: "Rituelle Waschung, Kafan und Janazah-Gebet — nach deinen Wünschen.",
    fields: [
      { key: "islamicBurialDesired", label: "Islamische Bestattung gewünscht?", type: "boolean", testId: "janazah-islamicBurialDesired" },
      { key: "noUnnecessaryDelay", label: "Keine unnötige Verzögerung?", type: "boolean", testId: "janazah-noUnnecessaryDelay" },
      { key: "ghusl", label: "Wünsche zur rituellen Waschung (Ghusl)", type: "textarea", testId: "janazah-ghusl" },
      { key: "preferredGhuslPersons", label: "Bevorzugte Personen oder Organisation für Ghusl", type: "text", testId: "janazah-preferredGhuslPersons" },
      { key: "genderSpecificWishes", label: "Geschlechtsspezifische Wünsche", type: "textarea", testId: "janazah-genderSpecificWishes" },
      { key: "kafan", label: "Wünsche zum Kafan (Leichentuch)", type: "textarea", testId: "janazah-kafan" },
      { key: "janazahPrayer", label: "Wünsche zum Janazah-Gebet", type: "textarea", testId: "janazah-janazahPrayer" },
      { key: "preferredMosque", label: "Gewünschte Moschee oder Gebetsort", type: "text", testId: "janazah-preferredMosque" },
    ],
  },
  {
    id: "beisetzung",
    title: "Beisetzung",
    description: "Friedhof, Grabfeld und Überführung — in Deutschland oder im Ausland.",
    fields: [
      { key: "burialGermany", label: "Beisetzung in Deutschland?", type: "boolean", testId: "janazah-burialGermany" },
      {
        key: "repatriation",
        label: "Überführung ins Ausland",
        type: "select",
        options: [
          { value: "yes", label: "Ja" },
          { value: "no", label: "Nein" },
          { value: "unsure", label: "Unsicher" },
        ],
        testId: "janazah-repatriation",
      },
      { key: "preferredCemetery", label: "Gewünschter Friedhof", type: "text", testId: "janazah-preferredCemetery" },
      { key: "muslimGraveyard", label: "Wunsch nach muslimischem Grabfeld?", type: "boolean", testId: "janazah-muslimGraveyard" },
      { key: "familyGrave", label: "Bekannte Grabstätte oder Familiengrab", type: "text", testId: "janazah-familyGrave" },
      { key: "burialCountryNotes", label: "Bestattung in Deutschland oder anderem Land — Hinweise", type: "textarea", testId: "janazah-burialCountryNotes" },
      { key: "repatriationNotes", label: "Hinweise zur Überführung ins Ausland", type: "textarea", testId: "janazah-repatriationNotes" },
      { key: "documentNotes", label: "Hinweise zu benötigten Dokumenten", type: "textarea", testId: "janazah-documentNotes" },
    ],
  },
  {
    id: "persoenlich",
    title: "Persönliche Wünsche",
    description: "Nachrichten, Verpflichtungen und Spendenwünsche im zulässigen Rahmen.",
    fields: [
      { key: "peopleToInclude", label: "Personen, die ausdrücklich einbezogen werden sollen", type: "textarea", testId: "janazah-peopleToInclude" },
      { key: "messageToFamily", label: "Persönliche Nachricht an Angehörige", type: "textarea", testId: "janazah-messageToFamily" },
      { key: "obligationsNotes", label: "Hinweise zu offenen Verpflichtungen", type: "textarea", testId: "janazah-obligationsNotes" },
      { key: "debtsAmanahNotes", label: "Hinweise zu Schulden, Amanah oder geliehenen Gegenständen", type: "textarea", testId: "janazah-debtsAmanahNotes" },
      { key: "donationWishes", label: "Gewünschte Spenden oder Sadaqah (im zulässigen Rahmen)", type: "textarea", testId: "janazah-donationWishes" },
      { key: "culturalExclusions", label: "Kulturelle Dinge, die ich NICHT möchte", type: "textarea", testId: "janazah-culturalExclusions" },
      { key: "additionalWishes", label: "Weitere freie Wünsche", type: "textarea", testId: "janazah-additionalWishes" },
    ],
  },
];

export const janazahFields: FieldConfig[] = janazahSections.flatMap((section) => section.fields);
