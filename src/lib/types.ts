export type ReviewStatus = "draft" | "needs_scholar_review" | "reviewed";

export type IslamicSourceType =
  | "quran"
  | "hadith"
  | "fiqh"
  | "legal"
  | "medical"
  | "official";

export interface IslamicSource {
  id: string;
  type: IslamicSourceType;
  title: string;
  reference: string;
  url?: string;
  arabicText?: string;
  translationDe?: string;
  translationEn?: string;
  note?: string;
}

export interface KnowledgeArticle {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  sourceIds: string[];
  reviewStatus: ReviewStatus;
  category: string;
}

export interface CultureFilterCard {
  id: string;
  question: string;
  islamicBasis: string;
  culturalPractice: string;
  whatToCheck: string;
  opinionDifferences?: string;
  sourceIds: string[];
  reviewStatus: ReviewStatus;
}

export interface UserProfile {
  name: string;
  birthDate: string;
  language: string;
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

export type InheritanceTrafficLight = "green" | "yellow" | "red";

export interface InheritanceCheckResult {
  status: InheritanceTrafficLight;
  warnings: string[];
  recommendations: string[];
}

export interface DebtAmanahItem {
  id: string;
  type: "debt_owed" | "debt_owed_to_me" | "borrowed" | "entrusted" | "zakat" | "kaffara" | "promise" | "forgiveness" | "document";
  description: string;
  person: string;
  priority: "high" | "medium" | "low";
}

export interface DigitalLegacyItem {
  id: string;
  type: "email" | "password_manager" | "emergency_access" | "banking" | "paypal" | "subscription" | "social" | "cloud" | "domain" | "file";
  description: string;
  locationHint: string;
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

export interface FuneralPartner {
  id: string;
  name: string;
  city: string;
  plzRange: string;
  available24_7: boolean;
  ghusl: boolean;
  kafan: boolean;
  janazah: boolean;
  burialGermany: boolean;
  repatriation: boolean;
  languages: string[];
  verified: boolean;
  partner: boolean;
  priceRange: string;
  phone: string;
  website: string;
}

export interface SadaqaProject {
  id: string;
  title: string;
  category: string;
  sadaqaJariyaType: string;
  description: string;
  targetAmount: number;
  raisedAmount: number;
  link: string;
  badge: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  price: string;
  period?: string;
  features: string[];
  category: "free" | "one_time" | "subscription" | "b2b";
}

export interface AIMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AmanahOrdnerData {
  userProfile: UserProfile;
  emergencyCard: EmergencyCard;
  medicalWishes: MedicalWishes;
  powerOfAttorney: PowerOfAttorney;
  careDirective: CareDirective;
  janazahWishes: JanazahWishes;
  ghuslKafan: GhuslKafanWishes;
  burialPreference: BurialPreference;
  inheritanceProfile: InheritanceProfile;
  debtsAmanah: DebtAmanahItem[];
  digitalLegacy: DigitalLegacyItem[];
  barzakhPlan: BarzakhPlan;
  sadaqaJariya: SadaqaJariyaPlan;
  familyMessage: FamilyMessage;
  selectedPath: string;
  lastSaved: string | null;
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
}
