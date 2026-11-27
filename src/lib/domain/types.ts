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

/** Areas a power of attorney can cover (AP22 EA-07.1). Burial is not one of them: it belongs to Janazah. */
export type PoaAreaId = "health" | "authorities" | "finance" | "housing" | "care" | "mail";

/** Who should act in one area: the preferred person, the substitute, another contact, nobody, or not decided. */
export type PoaHolder = "authorized" | "substitute" | "other" | "none" | "undecided";

export interface PoaAreaChoice {
  holder: PoaHolder;
  /** Only for "other": a person from "Familie & Kontakte", with the name kept as fallback text. */
  personId?: string;
  personName?: string;
}

/**
 * The person's wishes for a power of attorney, structured (AP22 EA-07). These are wishes for the
 * conversation with a notary or lawyer, never an effective power of attorney.
 */
export interface PowerOfAttorneyWishes {
  version: 1;
  /** "all": the preferred person for all matters (default); "split": a choice per area. */
  scope: "all" | "split";
  areas: Record<PoaAreaId, PoaAreaChoice>;
  /** Also for online accounts and digital data. Details live in the digital legacy. */
  onlineAccounts: "ja" | "nein" | "offen" | "";
  /** Should it also apply after death? Only noted; a lawyer or notary clarifies the form. */
  beyondDeath: "ja" | "nein" | "offen" | "";
  /** The only free text: additional notes. */
  additionalNotes: string;
}

export interface PowerOfAttorney {
  authorizedPerson: string;
  substitutePerson: string;
  /** @deprecated AP22 EA-07: free text of the first version. Kept and shown as "Früher eingetragen", never overwritten. */
  medical: string;
  /** @deprecated see medical */
  authorities: string;
  /** @deprecated see medical */
  bank: string;
  /** @deprecated see medical */
  housing: string;
  /** @deprecated see medical */
  care: string;
  /** @deprecated see medical. Burial and the care of the dead belong to the Janazah area. */
  burial: string;
  /** @deprecated see medical. Places of documents belong to "Wichtige Dokumente". */
  documents: string;
  /** @deprecated see medical. Digital accounts belong to the digital legacy (D-26). */
  digitalAccounts: string;
  /** @deprecated see medical */
  excludedPersons: string;
  /** Structured wishes (AP22 EA-07). Missing in folders from before; read through powerOfAttorneyWishes(). */
  wishes?: PowerOfAttorneyWishes;
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

/** Kinds of the first version of the digital legacy. Kept on older entries; new entries use `category`. */
export type LegacyDigitalType = "email" | "password_manager" | "emergency_access" | "banking" | "paypal" | "subscription" | "social" | "cloud" | "domain" | "file";

/** AP22 EA-18.1 categories (recherche/DIGITALER-NACHLASS.md §3). */
export type DigitalCategory = "email" | "social" | "cloud_photos" | "subscription" | "telecom" | "insurance" | "bank_payment" | "other";

/** What should happen with an account (several may apply). */
export type DigitalTreatment = "delete" | "cancel" | "backup_data" | "keep_memories" | "transfer" | "memorialize" | "undecided";

/** How the family can get access safely. Never the password itself. */
export type DigitalSecureAccess = "pw_manager_emergency" | "provider_legacy_contact" | "sealed_envelope" | "notary_lawyer" | "trusted_person_knows" | "not_arranged";

export interface DigitalProvider {
  /** Known provider, e.g. "google", "gmx". Never guessed from old text. */
  knownId?: string;
  name: string;
}

export interface DigitalLegacyItem {
  id: string;
  /** @deprecated kind of the first version; kept, read through digitalCategoryOf(). */
  type?: LegacyDigitalType;
  /** @deprecated first version: account description. Kept word for word; shown as "Früher eingetragen". */
  description: string;
  /** @deprecated first version: "Wo liegen die Zugangsdaten?". Kept; taken over into secureAccessNote only after the secret check. */
  locationHint: string;
  category?: DigitalCategory;
  /** Finer kind, e.g. "domain", "password_manager", "file". */
  contractType?: string;
  provider?: DigitalProvider;
  /** Short account or contract name. Checked: no more than 4 digits in a row, no IBAN, no password or PIN. */
  reference?: string;
  treatments?: DigitalTreatment[];
  /** Short note to the wish, checked like reference. */
  treatmentNote?: string;
  /** Person from "Familie & Kontakte"; the name is kept as fallback text. */
  trustedPersonId?: string;
  trustedPersonName?: string;
  secureAccess?: DigitalSecureAccess;
  /** E.g. "Notfallzugang bei Person X". Checked, never a password. */
  secureAccessNote?: string;
  /** Placeholder for later letters (EA-18.3, recherche/schreibvorlagen-digital.json); not used yet. */
  templateId?: string;
  /** ISO time of the last change in the new form. */
  updatedAt?: string;
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
  /** The letter body. Paragraphs are separated by blank lines. */
  familyLetter: string;
  /** P2.6 letter layout: salutation ("Meine Lieben,"), closing ("In Liebe"), printed name, place. */
  letterGreeting: string;
  letterClosing: string;
  letterSignature: string;
  letterPlace: string;
  /** Print the Basmala above the salutation. Off unless the person chooses it. */
  letterBismillah: boolean;
  /** ISO time of the last change to the letter (greeting, body, closing, signature, place). */
  letterUpdatedAt: string | null;
  whatsappMessage: string;
  conversationGuide: string;
  keyWishesSummary: string;
}

export type YesNoUnsure = "ja" | "nein" | "unsicher" | "";

/**
 * Testament preparation — facts and wishes for a conversation with a lawyer or notary.
 * Never a will, never legal advice. Kept strictly in separate parts.
 */
/**
 * A wish for the conversation with a lawyer or notary. It bequeaths nothing by itself, and nothing
 * in the product says whether it could be legally effective.
 */
export interface BequestWish {
  id: string;
  kind: "amount" | "percent" | "item";
  /** Euro for "amount", percent for "percent". */
  value?: number;
  /** Description for "item". */
  item?: string;
  beneficiary: string;
  beneficiaryKind: "person" | "organisation";
  /** Whether the beneficiary would also inherit. Persons only. */
  alsoHeir: YesNoUnsure;
  note?: string;
}

export interface TestamentPreparation {
  personalWishes: {
    wishes: string;
    charitableWishes: string;
    bequests: BequestWish[];
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
    /** Explicit answer, so an untouched child count (default 0) is never read as "no children". */
    hasChildren: YesNoUnsure;
    /** Special circumstances outside the rule set: any "ja" blocks, "unsicher"/empty is missing. */
    expectedChild: YesNoUnsure;
    unclearParentage: YesNoUnsure;
    missingRelative: YesNoUnsure;
    otherSpecialCircumstances: YesNoUnsure;
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

/** Versioned Vorsorge-Check progress stored in the same folder state. */
export interface CheckProgress {
  schemaVersion: number;
  index: number;
  answers: Record<string, boolean>;
  phase: "intro" | "questions" | "result";
  completedAt?: string;
}

/** The six areas of the guided Vorsorge (dashboard, flow, completion). */
export type VorsorgeAreaId = "notfall" | "familie" | "gesundheit" | "janazah" | "dokumente" | "vermoegen";

/** Fields that can point at a person from "Familie & Kontakte" instead of holding a second copy. */
export type PersonLinkField =
  | "emergencyContact1"
  | "emergencyContact2"
  | "authorizedPerson"
  | "substitutePerson"
  | "preferredGuardian"
  | "janazahTrustedContact";

/** Bookkeeping for the guided Vorsorge. Lives in the same encrypted folder; no own database column. */
export interface VorsorgeMeta {
  /** ISO time of the last change the person made in an area. */
  areaUpdatedAt: Partial<Record<VorsorgeAreaId, string>>;
  /** Step id where the person chose "Später fortsetzen", null when nothing is paused. */
  flowStep: string | null;
  flowPausedAt: string | null;
  /** Field → person id. The field keeps its own text, so removing the link never loses it. */
  personLinks: Partial<Record<PersonLinkField, string>>;
  /** ISO time the person last confirmed "my details are still correct". */
  reviewedAt?: string | null;
}

/** Progress through the conversation guide; kept in the folder so it survives sign-out (P2.5-D). */
export interface ConversationTopicProgress {
  checkedQuestionIds: string[];
  starredQuestionIds: string[];
  notes: string;
}

export interface FamilyTalkTask {
  id: string;
  who: string;
  what: string;
  done: boolean;
}

/**
 * One conversation the person had with relatives. A record of what was said and agreed;
 * it gives nobody access to anything and is no power of attorney.
 */
export interface FamilyTalk {
  id: string;
  /** ISO date (YYYY-MM-DD) or "" when not known. */
  date: string;
  /** Ids from familyMembers who took part. */
  personIds: string[];
  /** Others who took part (free text). */
  otherPeople: string;
  topicIds: string[];
  tasks: FamilyTalkTask[];
  /** Document types the relatives should know about. */
  documentsToKnow: DocumentType[];
  /** Whether the place of the originals was explained: "ja", "teilweise", "nein" or "" (not stated). */
  storageExplained: "ja" | "teilweise" | "nein" | "";
  openPoints: string;
}

export interface FamilyConversation {
  topics: Record<string, ConversationTopicProgress>;
  talks: FamilyTalk[];
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
  familyConversation: FamilyConversation;
  selectedPath: string;
  /** Slugs of saved knowledge articles (free knowledge centre). */
  knowledgeBookmarks: string[];
  vorsorgeMeta: VorsorgeMeta;
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
