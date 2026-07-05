export const GUIDED_FLOW_STORAGE_KEY = "amanah-guided-flow-state";

export const ALLOWED_FIELD_PATHS = new Set([
  "userProfile.name",
  "emergencyCard.name",
  "emergencyCard.emergencyContact1.name",
  "emergencyCard.emergencyContact1.phone",
  "emergencyCard.emergencyContact1.relation",
  "emergencyCard.emergencyContact2.name",
  "emergencyCard.emergencyContact2.phone",
  "emergencyCard.emergencyContact2.relation",
  "emergencyCard.familyDoctor",
  "emergencyCard.allergies",
  "emergencyCard.medications",
  "emergencyCard.mosqueImam",
  "emergencyCard.preferredFuneralDirector",
  "emergencyCard.hasPatientenverfuegung",
  "emergencyCard.hasVorsorgevollmacht",
  "medicalWishes.medicalWishes",
  "medicalWishes.documentLocation",
  "medicalWishes.whoSpeaksToDoctors",
  "medicalWishes.religiousWishes",
  "powerOfAttorney.authorizedPerson",
  "powerOfAttorney.substitutePerson",
  "powerOfAttorney.digitalAccounts",
  "powerOfAttorney.documents",
  "janazahWishes.preferredFuneralDirector",
  "janazahWishes.preferredMosque",
  "janazahWishes.messageToFamily",
  "janazahWishes.islamicBurialDesired",
  "janazahWishes.culturalExclusions",
  "burialPreference.contactPerson",
  "burialPreference.familyNote",
  "barzakhPlan.importantDebtsAmanah",
  "barzakhPlan.messageToFamily",
  "familyMessage.familyLetter",
  "familyMessage.keyWishesSummary",
  "familyMessage.whatsappMessage",
]);

export function isAllowedFieldPath(path: string): boolean {
  return ALLOWED_FIELD_PATHS.has(path);
}

export const FLOW_DISCLAIMER =
  "Der Assistent hilft beim Strukturieren. Er ersetzt keine rechtliche, medizinische oder religiöse Beratung.";
