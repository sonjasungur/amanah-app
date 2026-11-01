export type ReviewStatus = "draft" | "needs_scholar_review" | "reviewed";

export interface UserProfile {
  name: string;
  birthDate: string;
  language: string;
}

export type FamilyRelationType = "ehepartner" | "kind" | "elternteil" | "geschwister" | "sonstige";
export type FamilyRole = "notfallkontakt" | "vertrauensperson" | "vormund_wunsch";

export interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  /** Structured relation, reused by the testament questionnaire. */
  relationType?: FamilyRelationType;
  roles?: FamilyRole[];
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
  fullName: string;
  birthDate: string;
  locationRegion: string;
  trustedContact: string;
  peopleToNotify: string;
  mosqueCommunity: string;
  additionalContacts: string;
  islamicBurialDesired: boolean | null;
  noUnnecessaryDelay: boolean | null;
  ghusl: string;
  preferredGhuslPersons: string;
  genderSpecificWishes: string;
  kafan: string;
  janazahPrayer: string;
  burialGermany: boolean | null;
  repatriation: "yes" | "no" | "unsure" | "";
  preferredCemetery: string;
  muslimGraveyard: boolean | null;
  familyGrave: string;
  burialCountryNotes: string;
  repatriationNotes: string;
  documentNotes: string;
  preferredMosque: string;
  preferredFuneralDirector: string;
  culturalExclusions: string;
  peopleToInclude: string;
  messageToFamily: string;
  obligationsNotes: string;
  debtsAmanahNotes: string;
  donationWishes: string;
  additionalWishes: string;
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

export type DocumentType =
  | "patientenverfuegung"
  | "vorsorgevollmacht"
  | "betreuungsverfuegung"
  | "testament"
  | "ausweis"
  | "versicherung"
  | "bank"
  | "grundbuch"
  | "bestattungsvorsorge"
  | "organspende"
  | "other";

/** Whether the document exists — the app stores no files, only where they are. */
export type DocumentStatus = "vorhanden" | "fehlt" | "pruefen";

export interface DocumentEntry {
  id: string;
  type: DocumentType;
  title: string;
  location: string;
  status?: DocumentStatus;
  notes?: string;
  reviewStatus?: ReviewStatus;
}

export interface AssetEntry {
  id: string;
  type: "real_estate" | "bank" | "investment" | "pension" | "life_insurance" | "gold_silver" | "vehicle" | "business" | "other";
  description: string;
  approximateValue?: string;
  locationHint?: string;
  notes?: string;
  /** Real estate only. */
  mortgage?: "ja" | "nein" | "unsicher";
  ownership?: "allein" | "gemeinsam" | "unsicher";
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

export type YesNoUnsure = "ja" | "nein" | "unsicher" | "";

/**
 * Testament preparation — facts and wishes for a conversation with a lawyer or notary.
 * Never a will, never legal advice. Kept strictly in separate parts.
 */
export interface TestamentPreparation {
  personalWishes: {
    wishes: string;
    charitableWishes: string;
    /** Wishes for the conversation with a lawyer or notary; they appoint nobody by themselves. */
    executorWish: YesNoUnsure;
    executorPerson: string;
    guardianPerson: string;
    guardianExcluded: string;
  };
  islamicModel: {
    wantsIslamicDistribution: YesNoUnsure;
    preferredSchool: "hanafi" | "maliki" | "shafii" | "hanbali" | "unsicher" | "";
    /** Only for the (locked) model calculation. */
    ownGender: "male" | "female" | "";
    fatherAlive: YesNoUnsure;
    motherAlive: YesNoUnsure;
    grandparentsAlive: YesNoUnsure;
    grandchildrenViaDeceasedSon: YesNoUnsure;
    halfSiblings: YesNoUnsure;
    adoptedChildren: YesNoUnsure;
    moreThanOneSpouse: YesNoUnsure;
    otherRelatives: YesNoUnsure;
  };
  legalFacts: {
    maritalStatus: "ledig" | "verheiratet" | "geschieden" | "verwitwet" | "";
    propertyRegime: "zugewinn" | "guetertrennung" | "guetergemeinschaft" | "unbekannt" | "";
    citizenships: string;
    habitualResidence: "deutschland" | "ausland" | "";
    existingWill: YesNoUnsure;
    jointWillWithSpouse: YesNoUnsure;
    realEstateGermany: YesNoUnsure;
    assetsAbroad: YesNoUnsure;
    assetsAbroadCountries: string;
    businessInterests: YesNoUnsure;
    differentReligionRelatives: YesNoUnsure;
    minorChildren: YesNoUnsure;
  };
  currentStep: number;
}

/** Versioned Amanah-Check progress stored in the same folder state. */
export interface CheckProgress {
  schemaVersion: number;
  index: number;
  answers: Record<string, boolean>;
  phase: "intro" | "questions" | "result";
  completedAt?: string;
}

export interface AmanahOrdnerData {
  schemaVersion: number;
  userProfile: UserProfile;
  checkProgress: CheckProgress;
  familyMembers: FamilyMember[];
  emergencyCard: EmergencyCard;
  medicalWishes: MedicalWishes;
  powerOfAttorney: PowerOfAttorney;
  careDirective: CareDirective;
  janazahWishes: JanazahWishes;
  ghuslKafan: GhuslKafanWishes;
  burialPreference: BurialPreference;
  inheritanceProfile: InheritanceProfile;
  testamentPreparation: TestamentPreparation;
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
  /** Slugs of saved knowledge articles (free knowledge centre). */
  knowledgeBookmarks: string[];
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
