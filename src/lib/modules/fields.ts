import type { FieldConfig } from "@/components/modules/module-form";

export const emergencyCardFields: FieldConfig[] = [
  { key: "name", label: "Name", type: "text" },
  { key: "birthDate", label: "Geburtsdatum", type: "text", placeholder: "TT.MM.JJJJ" },
  { key: "emergencyContact1.name", label: "Notfallkontakt 1 — Name", type: "text" },
  { key: "emergencyContact1.phone", label: "Notfallkontakt 1 — Telefon", type: "text" },
  { key: "emergencyContact1.relation", label: "Notfallkontakt 1 — Beziehung", type: "text" },
  { key: "emergencyContact2.name", label: "Notfallkontakt 2 — Name", type: "text" },
  { key: "emergencyContact2.phone", label: "Notfallkontakt 2 — Telefon", type: "text" },
  { key: "familyDoctor", label: "Hausarzt", type: "text" },
  { key: "illnesses", label: "Krankheiten", type: "textarea" },
  { key: "medications", label: "Medikamente", type: "textarea" },
  { key: "allergies", label: "Allergien", type: "textarea" },
  { key: "language", label: "Sprache", type: "text" },
  { key: "mosqueImam", label: "Moschee / Imam", type: "text" },
  { key: "preferredFuneralDirector", label: "Gewünschter Bestatter", type: "text" },
  { key: "hasPatientenverfuegung", label: "Patientenverfügung vorhanden?", type: "boolean" },
  { key: "hasVorsorgevollmacht", label: "Vorsorgevollmacht vorhanden?", type: "boolean" },
  { key: "hasJanazahWishes", label: "Janazah-Wünsche vorhanden?", type: "boolean" },
];

export const medicalFields: FieldConfig[] = [
  { key: "medicalWishes", label: "Medizinische Wünsche", type: "textarea" },
  { key: "religiousWishes", label: "Religiöse Wünsche", type: "textarea" },
  { key: "imamSeelsorge", label: "Imam / Seelsorge", type: "text" },
  { key: "dignityBoundaries", label: "Schamgrenzen / Pflege", type: "textarea" },
  { key: "whoSpeaksToDoctors", label: "Wer darf mit Ärzten sprechen?", type: "text" },
  { key: "documentLocation", label: "Wo liegt die offizielle Patientenverfügung?", type: "text" },
  { key: "openQuestionsDoctor", label: "Offene Fragen an Arzt", type: "textarea" },
  { key: "openQuestionsLawyer", label: "Offene Fragen an Anwalt", type: "textarea" },
  { key: "openQuestionsImam", label: "Offene Fragen an Imam", type: "textarea" },
];

export const powerOfAttorneyFields: FieldConfig[] = [
  { key: "authorizedPerson", label: "Bevollmächtigte Person", type: "text" },
  { key: "substitutePerson", label: "Ersatzperson", type: "text" },
  { key: "medical", label: "Medizinisch", type: "textarea" },
  { key: "authorities", label: "Behörden", type: "textarea" },
  { key: "bank", label: "Bank", type: "textarea" },
  { key: "housing", label: "Wohnung", type: "textarea" },
  { key: "care", label: "Pflege", type: "textarea" },
  { key: "burial", label: "Bestattung", type: "textarea" },
  { key: "documents", label: "Dokumente", type: "textarea" },
  { key: "digitalAccounts", label: "Digitale Konten", type: "textarea" },
  { key: "excludedPersons", label: "Wer soll NICHT entscheiden?", type: "textarea" },
];

export const careDirectiveFields: FieldConfig[] = [
  { key: "preferredGuardian", label: "Gewünschter Betreuer", type: "text" },
  { key: "excludedGuardian", label: "Nicht gewünschter Betreuer", type: "text" },
  { key: "religiousWishes", label: "Religiöse Wünsche", type: "textarea" },
  { key: "careHousingWishes", label: "Pflege- / Wohnwünsche", type: "textarea" },
  { key: "languageFamilyNotes", label: "Sprach- / Familienhinweise", type: "textarea" },
];

export const janazahFields: FieldConfig[] = [
  { key: "islamicBurialDesired", label: "Islamische Bestattung gewünscht?", type: "boolean" },
  { key: "noUnnecessaryDelay", label: "Keine unnötige Verzögerung?", type: "boolean" },
  { key: "ghusl", label: "Ghusl-Wünsche", type: "textarea" },
  { key: "kafan", label: "Kafan-Wünsche", type: "textarea" },
  { key: "janazahPrayer", label: "Janazah-Gebet", type: "textarea" },
  { key: "burialGermany", label: "Beisetzung in Deutschland?", type: "boolean" },
  { key: "repatriation", label: "Überführung", type: "select", options: [
    { value: "yes", label: "Ja" }, { value: "no", label: "Nein" }, { value: "unsure", label: "Unsicher" },
  ]},
  { key: "preferredCemetery", label: "Gewünschter Friedhof", type: "text" },
  { key: "preferredMosque", label: "Gewünschte Moschee", type: "text" },
  { key: "preferredFuneralDirector", label: "Gewünschter Bestatter", type: "text" },
  { key: "culturalExclusions", label: "Kulturelle Dinge, die ich NICHT möchte", type: "textarea" },
  { key: "messageToFamily", label: "Nachricht an Familie", type: "textarea" },
];

export const ghuslKafanFields: FieldConfig[] = [
  { key: "whoMayBePresent", label: "Wer darf anwesend sein?", type: "textarea" },
  { key: "preferredGhuslTeam", label: "Bevorzugtes Ghusl-Team", type: "text" },
  { key: "dignityBoundaries", label: "Würde / Schamgrenzen", type: "textarea" },
  { key: "spouseNote", label: "Ehepartner-Hinweis", type: "textarea" },
  { key: "familyFarewell", label: "Familie darf Abschied nehmen?", type: "select", options: [
    { value: "yes", label: "Ja" }, { value: "no", label: "Nein" }, { value: "conditional", label: "Unter Bedingungen" },
  ]},
  { key: "familyFarewellConditions", label: "Bedingungen", type: "textarea" },
  { key: "notes", label: "Notizen", type: "textarea" },
];

export const burialFields: FieldConfig[] = [
  { key: "burialGermanyPreferred", label: "Beisetzung Deutschland bevorzugt?", type: "boolean" },
  { key: "repatriationPreferred", label: "Überführung bevorzugt?", type: "boolean" },
  { key: "decisionCriteria", label: "Entscheidungskriterien", type: "textarea" },
  { key: "cityPlz", label: "Stadt / PLZ", type: "text" },
  { key: "contactPerson", label: "Ansprechpartner", type: "text" },
  { key: "costDocumentNotes", label: "Kosten- / Dokumente-Hinweise", type: "textarea" },
  { key: "familyNote", label: "Familienhinweis", type: "textarea" },
];

export const inheritanceFields: FieldConfig[] = [
  { key: "married", label: "Verheiratet?", type: "boolean" },
  { key: "spouseAlive", label: "Ehepartner lebt?", type: "boolean" },
  { key: "sons", label: "Anzahl Söhne", type: "number" },
  { key: "daughters", label: "Anzahl Töchter", type: "number" },
  { key: "parentsAlive", label: "Eltern leben?", type: "boolean" },
  { key: "siblings", label: "Geschwister?", type: "boolean" },
  { key: "stepchildren", label: "Stiefkinder?", type: "boolean" },
  { key: "fosterChildren", label: "Pflegekinder?", type: "boolean" },
  { key: "nonMuslimRelatives", label: "Nicht-muslimische Angehörige?", type: "boolean" },
  { key: "realEstate", label: "Immobilien?", type: "boolean" },
  { key: "companyGmbH", label: "Firma / GmbH?", type: "boolean" },
  { key: "foreignProperty", label: "Auslandseigentum?", type: "boolean" },
  { key: "approximateWealth", label: "Vermögen grob", type: "text" },
  { key: "debts", label: "Schulden", type: "textarea" },
  { key: "desiredWasiyyah", label: "Gewünschte Waṣiyya (max. 1/3)", type: "textarea" },
  { key: "desiredSadaqaJariya", label: "Gewünschte Sadaqa Jariya", type: "textarea" },
  { key: "openQuestionsImam", label: "Offene Fragen an Imam", type: "textarea" },
  { key: "openQuestionsLawyer", label: "Offene Fragen an Anwalt/Notar", type: "textarea" },
];

export const barzakhFields: FieldConfig[] = [
  { key: "familyFirstCheck", label: "Was Familie zuerst prüfen soll", type: "textarea" },
  { key: "importantDebtsAmanah", label: "Wichtige Schulden / Amanah", type: "textarea" },
  { key: "desiredDuas", label: "Gewünschte Duas", type: "textarea" },
  { key: "desiredSadaqaJariya", label: "Gewünschte Sadaqa Jariya", type: "textarea" },
  { key: "culturalExclusions", label: "Kulturelle Praktiken, die ich nicht möchte", type: "textarea" },
  { key: "peopleToContact", label: "Kontaktpersonen", type: "textarea" },
  { key: "messageToFamily", label: "Nachricht an Familie", type: "textarea" },
];

export const sadaqaFields: FieldConfig[] = [
  { key: "joinFoerderkreis", label: "Förderkreis beitreten?", type: "boolean" },
  { key: "preferredPot", label: "Bevorzugter Topf", type: "select", options: [
    { value: "allgemein", label: "Sadaqa Jariya allgemein" },
    { value: "wasser", label: "Wasser & Infrastruktur" },
    { value: "bildung", label: "Bildung & Wissen" },
    { value: "medizin", label: "Medizinische Sadaqa Jariya" },
    { value: "gemeinde", label: "Gemeindeprojekte" },
    { value: "waisen", label: "Waisen / Familienhilfe" },
  ]},
  { key: "monthlyAmount", label: "Monatlicher Wunschbetrag", type: "text" },
  { key: "oneTimeAmount", label: "Einmaliger Wunschbetrag", type: "text" },
  { key: "personToVerify", label: "Person, die nach Tod prüfen soll", type: "text" },
  { key: "gemeinsam1Link", label: "Link zu Gemeinsam1-Projekt", type: "text" },
];

export const familyFields: FieldConfig[] = [
  { key: "familyLetter", label: "Familienbrief", type: "textarea" },
  { key: "whatsappMessage", label: "WhatsApp-Nachricht", type: "textarea" },
  { key: "conversationGuide", label: "Gesprächsleitfaden", type: "textarea" },
  { key: "keyWishesSummary", label: "Meine wichtigsten Wünsche — Zusammenfassung", type: "textarea" },
];
