import type { Fraction } from "./fraction";

/**
 * Review state of a rule set. Only "scholar_reviewed" may ever be shown to users,
 * and only behind the testament-preparation flag.
 */
export type RuleSetReviewStatus = "unreviewed_draft" | "scholar_reviewed" | "withdrawn";

export interface RuleSet {
  id: string;
  version: string;
  /** Scope of schools whose positions agree for every supported case of this rule set. */
  schools: string[];
  reviewStatus: RuleSetReviewStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  /** IDs from src/lib/knowledge/quran-verses.ts / sources.ts. */
  sourceIds: string[];
  notes: string;
}

/**
 * Islamic-law input only. German law (Pflichtteil, form, EuErbVO) is checked separately
 * and never derived from this structure.
 */
export interface FaraidCaseInput {
  deceasedGender: "male" | "female";
  /** Number of wives (deceased male). More than one is blocked. Ignored for a deceased female. */
  wives: number;
  /** Husband alive (deceased female). Ignored for a deceased male. */
  husband: boolean;
  sons: number;
  daughters: number;
  father: boolean;
  mother: boolean;
  /** Full, consanguine or uterine siblings alive. */
  siblings: number;
  /** Any grandparent alive. */
  grandparents: boolean;
  /** Children of a predeceased son alive. */
  sonsChildren: boolean;
  /** Any potential heir of a different religion than the deceased. */
  differentReligionHeirs: boolean;
  /** Stepchildren, adopted or foster children the user wants to consider. */
  nonBiologicalChildren: boolean;
  /** Unborn child, missing person, simultaneous death, homicide or li'ān. */
  otherSpecialCircumstances: boolean;
}

export type HeirKey = "husband" | "wives" | "sons" | "daughters" | "father" | "mother";

export interface CalculationStep {
  heir: HeirKey | "all";
  rule: string;
  sourceIds: string[];
}

export interface HeirShare {
  heir: HeirKey;
  count: number;
  /** Share of the distributable estate for the whole group. */
  groupShare: Fraction;
  /** Share per person in the group. */
  perPerson: Fraction;
}

export type FaraidResult =
  | { status: "blocked"; reasons: string[]; ruleSet: RuleSet }
  | {
      status: "calculated";
      shares: HeirShare[];
      steps: CalculationStep[];
      awl: boolean;
      ruleSet: RuleSet;
    };
