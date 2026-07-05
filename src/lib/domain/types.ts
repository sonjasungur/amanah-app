export type ReviewStatus = "draft" | "needs_scholar_review" | "reviewed";

export interface UserProfile {
  name: string;
  birthDate: string;
  language: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  birthDate?: string;
  phone?: string;
  notes?: string;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relation: string;
}

export interface EmergencyCard {
  name: string;
  birthDate: string;
  emergencyContact1: EmergencyContact;
  emergencyContact2: EmergencyContact;
  familyDoctor: string;
  illnesses: string;
  medications: string;
  allergies: string;
  language: string;
  mosqueImam: string;
  preferredFuneralDirector: string;
  hasPatientenverfuegung: boolean | null;
  hasVorsorgevollmacht: boolean | null;
  hasJanazahWishes: boolean | null;
}

export interface MedicalWishes {
  medicalWishes: string;
  religiousWishes: string;
  imamSeelsorge: string;
  dignityBoundaries: string;
  whoSpeaksToDoctors: string;
  documentLocation: string;
  openQuestionsDoctor: string;
  openQuestionsLawyer: string;
  openQuestionsImam: string;
}

export interface PowerOfAttorney {
  authorizedPerson: string;
  substitutePerson: string;
  medical: string;
  authorities: string;
  bank: string;
  housing: string;
  care: string;
  burial: string;
  documents: string;
  digitalAccounts: string;
  excludedPersons: string;
}

export interface CareDirective {
  preferredGuardian: string;
  excludedGuardian: string;
  religiousWishes: string;
  careHousingWishes: string;
  languageFamilyNotes: string;
}

export interface JanazahWishes {
  islamicBurialDesired: boolean | null;
  noUnnecessaryDelay: boolean | null;
  ghusl: string;
  kafan: string;
  janazahPrayer: string;
  burialGermany: boolean | null;
  repatriation: "yes" | "no" | "unsure" | "";
  preferredCemetery: string;
  preferredMosque: string;
  preferredFuneralDirector: string;
  culturalExclusions: string;
  messageToFamily: string;
}

export interface GhuslKafanWishes {
  whoMayBePresent: string;
  preferredGhuslTeam: string;
  dignityBoundaries: string;
  spouseNote: string;
  familyFarewell: "yes" | "no" | "conditional" | "";
  familyFarewellConditions: string;
  notes: string;
}

export interface BurialPreference {
  burialGermanyPreferred: boolean | null;
  repatriationPreferred: boolean | null;
  decisionCriteria: string;
  cityPlz: string;
  contactPerson: string;
  costDocumentNotes: string;
  familyNote: string;
}

export interface FuneralWish {
  janazah: JanazahWishes;
  ghuslKafan: GhuslKafanWishes;
  burial: BurialPreference;
}

export interface DocumentEntry {
  id: string;
  type: "patientenverfuegung" | "vorsorgevollmacht" | "betreuungsverfuegung" | "testament" | "other";
  title: string;
  location: string;
  notes?: string;
  reviewStatus?: ReviewStatus;
}

export interface AssetEntry {
  id: string;
  type: "real_estate" | "bank" | "investment" | "vehicle" | "business" | "other";
  description: string;
  approximateValue?: string;
  locationHint?: string;
  notes?: string;
}

export interface DebtAmanahItem {
  id: string;
  type: "debt_owed" | "debt_owed_to_me" | "borrowed" | "entrusted" | "zakat" | "kaffara" | "promise" | "forgiveness" | "document";
  description: string;
  person: string;
  priority: "high" | "medium" | "low";
}

export type DebtEntry = DebtAmanahItem;

export interface DigitalLegacyItem {
  id: string;
  type: "email" | "password_manager" | "emergency_access" | "banking" | "paypal" | "subscription" | "social" | "cloud" | "domain" | "file";
  description: string;
  locationHint: string;
}

export type DigitalAccount = DigitalLegacyItem;

export interface DonationWish {
  id: string;
  type: "sadaqa_jariya" | "zakat" | "general" | "wasiyyah";
  description: string;
  amount?: string;
  recipient?: string;
  notes?: string;
}

export interface ImportantInstruction {
  id: string;
  category: "medical" | "legal" | "religious" | "family" | "financial" | "other";
  title: string;
  content: string;
  priority: "high" | "medium" | "low";
}

export interface InheritanceProfile {
  married: boolean | null;
  spouseAlive: boolean | null;
  sons: number;
  daughters: number;
  parentsAlive: boolean | null;
  siblings: boolean | null;
  stepchildren: boolean | null;
  fosterChildren: boolean | null;
  nonMuslimRelatives: boolean | null;
  realEstate: boolean | null;
  companyGmbH: boolean | null;
  foreignProperty: boolean | null;
  approximateWealth: string;
  debts: string;
  desiredWasiyyah: string;
  desiredSadaqaJariya: string;
  openQuestionsImam: string;
  openQuestionsLawyer: string;
}

export interface BarzakhPlan {
  familyFirstCheck: string;
  importantDebtsAmanah: string;
  desiredDuas: string;
  desiredSadaqaJariya: string;
  culturalExclusions: string;
  peopleToContact: string;
  messageToFamily: string;
}

export interface SadaqaJariyaPlan {
  joinFoerderkreis: boolean | null;
  preferredPot: string;
  monthlyAmount: string;
  oneTimeAmount: string;
  personToVerify: string;
  gemeinsam1Link: string;
}

export interface FamilyMessage {
  familyLetter: string;
  whatsappMessage: string;
  conversationGuide: string;
  keyWishesSummary: string;
}

export interface AmanahOrdnerData {
  schemaVersion: number;
  userProfile: UserProfile;
  familyMembers: FamilyMember[];
  emergencyCard: EmergencyCard;
  medicalWishes: MedicalWishes;
  powerOfAttorney: PowerOfAttorney;
  careDirective: CareDirective;
  janazahWishes: JanazahWishes;
  ghuslKafan: GhuslKafanWishes;
  burialPreference: BurialPreference;
  inheritanceProfile: InheritanceProfile;
  documents: DocumentEntry[];
  assets: AssetEntry[];
  debtsAmanah: DebtEntry[];
  digitalLegacy: DigitalAccount[];
  donations: DonationWish[];
  importantInstructions: ImportantInstruction[];
  barzakhPlan: BarzakhPlan;
  sadaqaJariya: SadaqaJariyaPlan;
  familyMessage: FamilyMessage;
  selectedPath: string;
  lastSaved: string | null;
  reviewStatus: ReviewStatus;
}

export type ModuleId =
  | "notfallkarte"
  | "krankheit"
  | "vollmacht"
  | "betreuung"
  | "janazah"
  | "ghusl-kafan"
  | "bestattung"
  | "testament"
  | "schulden-amanah"
  | "digitaler-nachlass"
  | "barzakh"
  | "sadaqa-jariya"
  | "familie";

export interface ModuleConfig {
  id: ModuleId;
  title: string;
  description: string;
  icon: string;
  path: string;
  criticalFields: string[];
  requiredFields?: string[];
  warningFields?: string[];
}

export function getFuneralWish(data: Pick<AmanahOrdnerData, "janazahWishes" | "ghuslKafan" | "burialPreference">): FuneralWish {
  return {
    janazah: data.janazahWishes,
    ghuslKafan: data.ghuslKafan,
    burial: data.burialPreference,
  };
}
