import type { ReviewStatus as DomainReviewStatus } from "@/lib/domain/types";

export type ReviewStatus = DomainReviewStatus;

export type {
  UserProfile,
  FamilyMember,
  EmergencyContact,
  EmergencyCard,
  MedicalWishes,
  PowerOfAttorney,
  CareDirective,
  JanazahWishes,
  GhuslKafanWishes,
  BurialPreference,
  FuneralWish,
  DocumentEntry,
  AssetEntry,
  DebtAmanahItem,
  DebtEntry,
  DigitalLegacyItem,
  DigitalAccount,
  DonationWish,
  ImportantInstruction,
  InheritanceProfile,
  BarzakhPlan,
  SadaqaJariyaPlan,
  FamilyMessage,
  AmanahOrdnerData,
  ModuleId,
  ModuleConfig,
} from "@/lib/domain/types";

export type { InheritanceTrafficLight, InheritanceCheckResult } from "@/lib/domain/validation";

export type { AmanahExportBundle } from "@/lib/domain/schema";

export type IslamicSourceType =
  | "quran"
  | "hadith"
  | "fiqh"
  | "legal"
  | "medical"
  | "official";

/** Content audit category for source governance */
export type SourceAuditCategory =
  | "QURAN_PRIMARY"
  | "SAHIH_PRIMARY"
  | "LEGAL_GERMANY"
  | "GENERAL_GUIDANCE"
  | "FIQH_REVIEW_REQUIRED";

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
  /** Audit category for display grouping */
  auditCategory?: SourceAuditCategory;
  /** Groups duplicate narrations (e.g. Bukhari 1315 + Muslim 944c) */
  sourceGroup?: string;
  /** QuranEnc browse URL — canonical verse reference */
  quranEncUrl?: string;
  /** Licensed translation attribution */
  translator?: string;
  translationVersion?: string;
  /** true when German text is paraphrase, not licensed translation */
  isParaphrase?: boolean;
  /** Hadith collection for Sahih sources */
  collection?: "bukhari" | "muslim";
  hadithNumber?: string;
}

export type WissenFilter =
  | "islam"
  | "recht"
  | "familie"
  | "digital"
  | "finanzen"
  | "konvertierte"
  | "unverheiratete"
  | "erste-schritte";

export interface WissenMeta {
  filters: WissenFilter[];
  urgency: "hoch" | "mittel" | "spaeter";
  audience: string[];
  shortAnswer: string;
}

export interface RichKnowledgeDetails {
  whyImportant: string;
  ifMissing: string;
  prepareItems: string[];
  /** Concrete actions for today — shown in section C */
  todayActions?: string[];
  documents: string[];
  /** German legal notes — section E */
  legalNotes?: string[];
  safeStorage: string;
  tellFamily: string;
  commonMistakes: string[];
  nextStepLabel: string;
  nextStepHref: string;
  /** Optional Janazah checklist items */
  janazahChecklist?: string[];
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
  details?: RichKnowledgeDetails;
  wissenMeta?: WissenMeta;
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
