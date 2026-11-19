import { compare, div, frac, mul, ONE, sub, sum, ZERO, type Fraction } from "./fraction";
import { SUNNI_NUCLEAR_FAMILY_V1 } from "./rulesets";
import type { CalculationStep, FaraidCaseInput, FaraidResult, HeirKey, HeirShare, RuleSet } from "./types";

const Q_4_11 = "quran-nisa-4-11";
const Q_4_12 = "quran-nisa-4-12";

/** Cases outside the reviewed scope are blocked, never approximated. */
export function getBlockingReasons(input: FaraidCaseInput): string[] {
  const reasons: string[] = [];
  const children = input.sons + input.daughters > 0;
  const spouse = input.deceasedGender === "male" ? input.wives > 0 : input.husband;

  const counts = [input.wives, input.sons, input.daughters, input.siblings];
  if (counts.some((n) => !Number.isInteger(n) || n < 0)) {
    reasons.push("Ungültige Anzahl von Angehörigen.");
  }
  if (input.wives > 1) {
    reasons.push("Mehrere Ehefrauen: Rechtslage in Deutschland ungeklärt — anwaltlich und fachlich klären.");
  }
  if (input.differentReligionHeirs) {
    reasons.push("Angehörige mit anderer Religion: Erbhindernis nach islamischer Lehre und deutscher ordre public — fachlich klären.");
  }
  if (input.nonBiologicalChildren) {
    reasons.push("Stief-, Adoptiv- oder Pflegekinder: Gestaltung über Waṣiyya fachlich klären.");
  }
  if (input.otherSpecialCircumstances) {
    reasons.push("Sonderumstände (z. B. ungeborenes Kind, verschollene Person, gleichzeitiger Tod) werden nicht berechnet.");
  }
  if (input.grandparents && (!input.father || !input.mother)) {
    reasons.push("Großeltern können erbberechtigt sein — außerhalb des geprüften Umfangs.");
  }
  if (input.sonsChildren && input.sons === 0) {
    reasons.push("Enkel über einen verstorbenen Sohn — außerhalb des geprüften Umfangs.");
  }
  if (input.siblings > 0 && !(input.sons > 0 || (input.father && children))) {
    reasons.push("Geschwister können Anteile beeinflussen oder erben — außerhalb des geprüften Umfangs.");
  }
  if (!children && spouse && input.father && input.mother) {
    reasons.push("ʿUmariyyatān (Ehegatte, Vater, Mutter ohne Kinder): Sonderfall mit unterschiedlichen Lehrmeinungen.");
  }
  if (!children && !spouse && !input.father && !input.mother) {
    reasons.push("Keine Erben im erfassten Familienkreis.");
  }
  return reasons;
}

export function calculateFaraid(
  input: FaraidCaseInput,
  ruleSet: RuleSet = SUNNI_NUCLEAR_FAMILY_V1
): FaraidResult {
  const blocked = getBlockingReasons(input);
  if (blocked.length > 0) return { status: "blocked", reasons: blocked, ruleSet };

  const children = input.sons + input.daughters > 0;
  const fixed = new Map<HeirKey, Fraction>();
  const steps: CalculationStep[] = [];
  const counts: Record<HeirKey, number> = {
    husband: input.deceasedGender === "female" && input.husband ? 1 : 0,
    wives: input.deceasedGender === "male" ? input.wives : 0,
    sons: input.sons,
    daughters: input.daughters,
    father: input.father ? 1 : 0,
    mother: input.mother ? 1 : 0,
  };

  if (counts.husband) {
    fixed.set("husband", children ? frac(1, 4) : frac(1, 2));
    steps.push({ heir: "husband", rule: children ? "Ehemann mit Kindern: 1/4" : "Ehemann ohne Kinder: 1/2", sourceIds: [Q_4_12] });
  }
  if (counts.wives) {
    fixed.set("wives", children ? frac(1, 8) : frac(1, 4));
    steps.push({ heir: "wives", rule: children ? "Ehefrau(en) mit Kindern: 1/8 gemeinsam" : "Ehefrau(en) ohne Kinder: 1/4 gemeinsam", sourceIds: [Q_4_12] });
  }
  if (counts.mother) {
    fixed.set("mother", children ? frac(1, 6) : frac(1, 3));
    steps.push({ heir: "mother", rule: children ? "Mutter mit Kindern: 1/6" : "Mutter ohne Kinder und Geschwister: 1/3", sourceIds: [Q_4_11] });
  }
  if (counts.father && children) {
    fixed.set("father", frac(1, 6));
    steps.push({ heir: "father", rule: "Vater mit Kindern: 1/6", sourceIds: [Q_4_11] });
  }
  if (counts.daughters && !counts.sons) {
    fixed.set("daughters", counts.daughters === 1 ? frac(1, 2) : frac(2, 3));
    steps.push({ heir: "daughters", rule: counts.daughters === 1 ? "Eine Tochter ohne Söhne: 1/2" : "Mehrere Töchter ohne Söhne: 2/3 gemeinsam", sourceIds: [Q_4_11] });
  }

  const fixedTotal = sum([...fixed.values()]);
  const awl = compare(fixedTotal, ONE) > 0;
  const shares = new Map<HeirKey, Fraction>();

  if (awl) {
    for (const [heir, share] of fixed) shares.set(heir, div(share, fixedTotal));
    steps.push({ heir: "all", rule: `ʿAwl: Summe der festen Anteile ${fixedTotal.num}/${fixedTotal.den} — anteilige Kürzung`, sourceIds: [] });
  } else {
    for (const [heir, share] of fixed) shares.set(heir, share);
    const residue = sub(ONE, fixedTotal);
    if (counts.sons) {
      const units = 2 * counts.sons + counts.daughters;
      shares.set("sons", mul(residue, frac(2 * counts.sons, units)));
      if (counts.daughters) shares.set("daughters", mul(residue, frac(counts.daughters, units)));
      steps.push({ heir: "sons", rule: "Rest an Kinder, Sohn doppelt so viel wie Tochter", sourceIds: [Q_4_11] });
    } else if (counts.father) {
      shares.set("father", sum([shares.get("father") ?? ZERO, residue]));
      steps.push({ heir: "father", rule: "Rest an den Vater als Resterbe", sourceIds: [Q_4_11] });
    } else if (compare(residue, ZERO) > 0) {
      return {
        status: "blocked",
        reasons: ["Verbleibender Rest ohne Resterben im erfassten Kreis (Radd oder weitere Verwandte) — fachlich klären."],
        ruleSet,
      };
    }
  }

  const result: HeirShare[] = [...shares].map(([heir, groupShare]) => ({
    heir,
    count: counts[heir],
    groupShare,
    perPerson: div(groupShare, frac(counts[heir])),
  }));

  return { status: "calculated", shares: result, steps, awl, ruleSet };
}
