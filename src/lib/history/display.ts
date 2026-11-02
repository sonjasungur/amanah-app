import { CHECK_QUESTIONS } from "@/lib/check/questions";
import { ASSET_TYPES, MORTGAGE, OWNERSHIP } from "@/lib/testament/asset-labels";

const SECTION_LABELS: Record<string, string> = {
  userProfile: "Profil",
  familyMembers: "Familie und Vertrauenspersonen",
  emergencyCard: "Notfallkarte",
  medicalWishes: "Medizinische Wünsche",
  powerOfAttorney: "Angaben zur Vollmacht",
  careDirective: "Wünsche zur Betreuung",
  janazahWishes: "Janazah-Wünsche",
  ghuslKafan: "Ghusl und Kafan",
  burialPreference: "Bestattung und Überführung",
  inheritanceProfile: "Erbprofil und Notizen",
  testamentPreparation: "Vorbereitung für das Gespräch",
  documents: "Dokumente",
  assets: "Vermögensübersicht",
  debtsAmanah: "Schulden und Amanah",
  digitalLegacy: "Digitaler Nachlass",
  donations: "Spendenwünsche",
  importantInstructions: "Wichtige Hinweise",
  barzakhPlan: "Barzakh",
  sadaqaJariya: "Sadaqa Jariya",
  familyMessage: "Familienbrief",
  checkProgress: "Vorsorge-Check",
  knowledgeBookmarks: "Lesezeichen im Wissensbereich",
};

/** Bookkeeping, no use to a reader. */
const HIDDEN_FIELDS = new Set(["id", "schemaVersion", "reviewStatus", "currentStep", "index", "phase", "completedAt"]);

const FIELD_LABELS: Record<string, string> = {
  additionalContacts: "Weitere Kontakte", additionalWishes: "Weitere Wünsche", adoptedChildren: "Adoptierte Kinder", allergies: "Allergien",
  alsoHeir: "Würde auch erben", amount: "Betrag", approximateValue: "Ungefährer Wert", approximateWealth: "Vermögen grob", assetsAbroad: "Vermögen im Ausland",
  assetsAbroadCountries: "Länder", authorities: "Befugnisse", authorizedPerson: "Vorgesehene Person", bank: "Bank", beneficiary: "Für wen", beneficiaryKind: "Art der Empfänger",
  bequests: "Wünsche an Personen und Einrichtungen", birthDate: "Geburtsdatum", burial: "Bestattung", burialCountryNotes: "Notizen zum Bestattungsland", burialGermany: "Bestattung in Deutschland",
  burialGermanyPreferred: "Deutschland bevorzugt", businessInterests: "Unternehmensbeteiligung", care: "Pflege", careHousingWishes: "Wünsche zu Pflege und Wohnen", category: "Kategorie",
  charitableWishes: "Wohltätige Wünsche", citizenships: "Staatsangehörigkeiten", cityPlz: "Stadt oder PLZ", companyGmbH: "Firma oder GmbH", contactPerson: "Ansprechperson", content: "Inhalt",
  conversationGuide: "Gesprächsleitfaden", costDocumentNotes: "Notizen zu Kosten und Unterlagen", culturalExclusions: "Kulturelle Praktiken, die nicht gewünscht sind", daughters: "Töchter", debts: "Schulden",
  debtsAmanahNotes: "Notizen zu Schulden und Amanah", decisionCriteria: "Entscheidungskriterien", description: "Bezeichnung", desiredDuas: "Gewünschte Duas", desiredSadaqaJariya: "Notizen zur Sadaqa Jariya",
  desiredWasiyyah: "Notizen zur Waṣiyya", differentReligionRelatives: "Angehörige mit anderer Religion", digitalAccounts: "Digitale Konten", dignityBoundaries: "Schamgrenzen", documentLocation: "Ablageort der Dokumente",
  documentNotes: "Notizen zu Dokumenten", documents: "Dokumente", donationWishes: "Spendenwünsche", emergencyContact1: "Notfallkontakt 1", emergencyContact2: "Notfallkontakt 2", excludedGuardian: "Nicht als Betreuer gewünscht",
  excludedPersons: "Ausgeschlossene Personen", executorPerson: "Person für die Abwicklung", executorWish: "Wunsch zur Abwicklung", existingWill: "Vorhandenes Testament", familyDoctor: "Hausarzt", familyFarewell: "Abschied der Familie",
  familyFarewellConditions: "Bedingungen für den Abschied", familyFirstCheck: "Was die Familie zuerst prüfen soll", familyGrave: "Familiengrab", familyLetter: "Brief an die Familie", familyNote: "Hinweis an die Familie",
  fatherAlive: "Vater lebt", foreignProperty: "Auslandseigentum", fosterChildren: "Pflegekinder", fullName: "Vollständiger Name", gemeinsam1Link: "Verknüpfung", genderSpecificWishes: "Wünsche nach Geschlecht", ghusl: "Ghusl",
  grandchildrenViaDeceasedSon: "Enkel von einem verstorbenen Sohn", grandparentsAlive: "Großeltern leben", guardianExcluded: "Nicht als Vormund", guardianPerson: "Wunsch für den Vormund", habitualResidence: "Lebensmittelpunkt",
  halfSiblings: "Halbgeschwister", hasJanazahWishes: "Janazah-Wünsche vorhanden", hasPatientenverfuegung: "Patientenverfügung vorhanden", hasVorsorgevollmacht: "Vorsorgevollmacht vorhanden", housing: "Wohnen", illnesses: "Krankheiten",
  imamSeelsorge: "Imam oder Seelsorge", importantDebtsAmanah: "Wichtige Schulden und Amanah", islamicBurialDesired: "Islamische Bestattung gewünscht", islamicModel: "Islamische Erbwünsche", item: "Gegenstand", janazah: "Janazah",
  janazahPrayer: "Janazah-Gebet", joinFoerderkreis: "Förderkreis", jointWillWithSpouse: "Gemeinsames Testament", kafan: "Kafan", keyWishesSummary: "Wichtigste Wünsche", kind: "Art", language: "Sprache", languageFamilyNotes: "Notizen zu Sprache und Familie",
  legalFacts: "Angaben für das deutsche Recht", location: "Ablageort", locationHint: "Ort der Unterlagen", locationRegion: "Ort oder Region", maritalStatus: "Familienstand", married: "Verheiratet", medical: "Medizinisches", medicalWishes: "Medizinische Wünsche",
  medications: "Medikamente", messageToFamily: "Nachricht an die Familie", minorChildren: "Minderjährige Kinder", monthlyAmount: "Monatlicher Betrag", moreThanOneSpouse: "Mehr als eine Ehe", mortgage: "Hypothek oder Kredit", mosqueCommunity: "Moscheegemeinde",
  mosqueImam: "Moschee oder Imam", motherAlive: "Mutter lebt", muslimGraveyard: "Muslimisches Gräberfeld", name: "Name", nonMuslimRelatives: "Nicht-muslimische Angehörige", note: "Anmerkung", notes: "Notizen", noUnnecessaryDelay: "Keine unnötige Verzögerung",
  obligationsNotes: "Notizen zu Verpflichtungen", oneTimeAmount: "Einmaliger Betrag", openQuestionsDoctor: "Offene Fragen an den Arzt", openQuestionsImam: "Offene Fragen an den Imam", openQuestionsLawyer: "Offene Fragen an Anwalt oder Notar", otherRelatives: "Weitere Verwandte",
  ownership: "Eigentum", ownGender: "Eigenes Geschlecht", parentsAlive: "Eltern leben", peopleToContact: "Kontaktpersonen", peopleToInclude: "Einzubeziehende Personen", peopleToNotify: "Zu benachrichtigende Personen", person: "Person", personalWishes: "Persönliche Wünsche",
  personToVerify: "Vertrauensperson", phone: "Telefon", preferredCemetery: "Gewünschter Friedhof", preferredFuneralDirector: "Gewünschter Bestatter", preferredGhuslPersons: "Gewünschte Personen für den Ghusl", preferredGhuslTeam: "Gewünschtes Ghusl-Team", preferredGuardian: "Gewünschter Betreuer",
  preferredMosque: "Gewünschte Moschee", preferredPot: "Bevorzugter Topf", preferredSchool: "Rechtsschule", priority: "Priorität", propertyRegime: "Güterstand", realEstate: "Immobilien", realEstateGermany: "Immobilien in Deutschland", recipient: "Empfänger", relation: "Beziehung",
  religiousWishes: "Religiöse Wünsche", repatriation: "Überführung", repatriationNotes: "Notizen zur Überführung", repatriationPreferred: "Überführung bevorzugt", siblings: "Geschwister", sons: "Söhne", spouseAlive: "Ehepartner lebt", spouseNote: "Hinweis zum Ehepartner", status: "Status",
  stepchildren: "Stiefkinder", substitutePerson: "Ersatzperson", title: "Titel", trustedContact: "Vertrauensperson", type: "Art", value: "Wert", wantsIslamicDistribution: "Wunsch nach islamischer Verteilung", whatsappMessage: "WhatsApp-Nachricht", whoMayBePresent: "Wer dabei sein darf",
  whoSpeaksToDoctors: "Wer mit Ärzten spricht", wishes: "Wünsche",
};

const VALUE_LABELS: Record<string, string> = { ...ASSET_TYPES, ...OWNERSHIP, ...MORTGAGE };

export function sectionLabel(section: string): string {
  return SECTION_LABELS[section] ?? "Weitere Angaben";
}

export function fieldLabel(key: string): string {
  return FIELD_LABELS[key] ?? "Weitere Angabe";
}

export function isHiddenField(key: string): boolean {
  return HIDDEN_FIELDS.has(key);
}

function join(path: string, label: string): string {
  return path ? `${path} / ${label}` : label;
}

function textOf(value: unknown): string {
  if (typeof value === "boolean") return value ? "Ja" : "Nein";
  const text = String(value);
  return VALUE_LABELS[text] ?? text;
}

/** Plain text rows for display, rendered by React as text. Empty fields and bookkeeping are left out. */
export function flattenForDisplay(value: unknown, path = ""): { path: string; text: string }[] {
  if (value === null || value === undefined || value === "") return [];
  if (Array.isArray(value)) return value.flatMap((item, i) => flattenForDisplay(item, join(path, `Eintrag ${i + 1}`)));
  if (typeof value === "object") {
    return Object.entries(value).flatMap(([key, v]) => (isHiddenField(key) ? [] : flattenForDisplay(v, join(path, fieldLabel(key)))));
  }
  return [{ path: path || "Wert", text: textOf(value) }];
}

/** The check stores answers under question ids: show the question itself. */
function checkRows(value: unknown): { path: string; text: string }[] {
  const answers = (value as { answers?: Record<string, unknown> } | null)?.answers ?? {};
  return Object.entries(answers).map(([id, answer]) => ({
    path: CHECK_QUESTIONS.find((q) => q.id === id)?.text ?? "Frage",
    text: textOf(answer),
  }));
}

export function sectionRows(section: string, value: unknown): { path: string; text: string }[] {
  if (section === "checkProgress") return checkRows(value);
  if (section === "knowledgeBookmarks") return (Array.isArray(value) ? value : []).map((slug, i) => ({ path: `Lesezeichen ${i + 1}`, text: String(slug) }));
  return flattenForDisplay(value);
}
