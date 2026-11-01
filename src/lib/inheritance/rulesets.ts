import type { RuleSet } from "./types";

/**
 * Narrow nuclear-family scope where the four Sunni schools agree.
 * Unreviewed: results must not be shown to users until a scholar review is recorded here.
 */
export const SUNNI_NUCLEAR_FAMILY_V1: RuleSet = {
  id: "sunni-nuclear-family",
  version: "0.1.0",
  schools: ["hanafi", "maliki", "shafii", "hanbali"],
  reviewStatus: "unreviewed_draft",
  sourceIds: ["quran-nisa-4-11", "quran-nisa-4-12"],
  notes:
    "Ehegatte(n), Kinder, Vater, Mutter. ʿAwl enthalten. Radd, Geschwister, Großeltern, Enkel, " +
    "ʿUmariyyatān, Mehrehe und alle Erbhindernisse werden gesperrt statt berechnet.",
};

export const RULE_SETS: Record<string, RuleSet> = {
  [`${SUNNI_NUCLEAR_FAMILY_V1.id}@${SUNNI_NUCLEAR_FAMILY_V1.version}`]: SUNNI_NUCLEAR_FAMILY_V1,
};

/** A result may only reach the UI when a named review is recorded and the product flag is on. */
export function isRuleSetDisplayable(ruleSet: RuleSet, featureEnabled: boolean): boolean {
  return featureEnabled && ruleSet.reviewStatus === "scholar_reviewed" && Boolean(ruleSet.reviewedBy?.trim()) && Boolean(ruleSet.reviewedAt?.trim());
}
