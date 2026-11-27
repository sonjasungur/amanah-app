import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  RULE_SET_REVIEW_CASES,
  SUNNI_NUCLEAR_FAMILY_V1,
  calculateFaraid,
  isRuleSetDisplayable,
  mul,
  frac,
  ruleSetReviewMarkdown,
  sum,
  toString as fractionText,
  type FaraidCaseInput,
} from "@/lib/inheritance";
import { FaraidModelResult } from "@/components/testament/faraid-model-result";

const base: FaraidCaseInput = {
  deceasedGender: "male",
  wives: 0,
  husband: false,
  sons: 0,
  daughters: 0,
  father: false,
  mother: false,
  siblings: 0,
  grandparents: false,
  sonsChildren: false,
  differentReligionHeirs: false,
  nonBiologicalChildren: false,
  otherSpecialCircumstances: false,
};

const shares = (input: Partial<FaraidCaseInput>) => {
  const r = calculateFaraid({ ...base, ...input });
  if (r.status !== "calculated") throw new Error(r.reasons.join(" "));
  return Object.fromEntries(r.shares.map((s) => [s.heir, fractionText(s.groupShare)]));
};

describe("engine invariants over the whole supported family space", () => {
  const cases: FaraidCaseInput[] = [];
  for (const deceasedGender of ["male", "female"] as const)
    for (const spouse of [false, true])
      for (const sons of [0, 1, 2, 3])
        for (const daughters of [0, 1, 2, 3])
          for (const father of [false, true])
            for (const mother of [false, true])
              for (const siblings of [0, 2])
                cases.push({
                  ...base,
                  deceasedGender,
                  wives: deceasedGender === "male" && spouse ? 1 : 0,
                  husband: deceasedGender === "female" && spouse,
                  sons,
                  daughters,
                  father,
                  mother,
                  siblings,
                });

  it("every calculated result distributes exactly the whole estate", () => {
    let calculated = 0;
    for (const input of cases) {
      const r = calculateFaraid(input);
      if (r.status !== "calculated") continue;
      calculated += 1;
      expect(fractionText(sum(r.shares.map((s) => s.groupShare))), JSON.stringify(input)).toBe("1");
      for (const s of r.shares) {
        expect(s.count, JSON.stringify(input)).toBeGreaterThan(0);
        expect(fractionText(mul(s.perPerson, frac(s.count)))).toBe(fractionText(s.groupShare));
      }
    }
    expect(calculated).toBeGreaterThan(100);
  });

  it("a son always receives twice the share of a daughter", () => {
    for (const input of cases) {
      if (input.sons === 0 || input.daughters === 0) continue;
      const r = calculateFaraid(input);
      if (r.status !== "calculated") continue;
      const son = r.shares.find((s) => s.heir === "sons")!;
      const daughter = r.shares.find((s) => s.heir === "daughters")!;
      expect(fractionText(son.perPerson)).toBe(fractionText(mul(daughter.perPerson, frac(2))));
    }
  });

  it("siblings never receive a calculated share", () => {
    for (const input of cases) {
      const r = calculateFaraid(input);
      if (r.status === "calculated") expect(r.shares.map((s) => s.heir)).not.toContain("siblings");
    }
  });
});

describe("hand-checked results, also shown to the reviewers", () => {
  it.each<[string, Partial<FaraidCaseInput>, Record<string, string>]>([
    ["wife, son, daughter", { wives: 1, sons: 1, daughters: 1 }, { wives: "1/8", sons: "7/12", daughters: "7/24" }],
    ["husband, two sons", { deceasedGender: "female", husband: true, sons: 2 }, { husband: "1/4", sons: "3/4" }],
    ["father and mother", { father: true, mother: true }, { mother: "1/3", father: "2/3" }],
    ["daughter and father", { daughters: 1, father: true }, { daughters: "1/2", father: "1/2" }],
    ["two daughters, parents", { daughters: 2, father: true, mother: true }, { daughters: "2/3", father: "1/6", mother: "1/6" }],
    ["ʿawl: husband, two daughters, parents", { deceasedGender: "female", husband: true, daughters: 2, father: true, mother: true }, { husband: "1/5", daughters: "8/15", father: "2/15", mother: "2/15" }],
  ])("%s", (_label, input, expected) => {
    expect(shares(input)).toEqual(expected);
  });
});

describe("review paper for the rule set", () => {
  const md = ruleSetReviewMarkdown("2026-11-01");

  it("contains every case with its result or reason, in the section it belongs to", () => {
    const [calculatedPart, rest] = md.split("## 2. Fälle, die das Programm sperrt");
    for (const c of RULE_SET_REVIEW_CASES) {
      const r = calculateFaraid(c.input);
      expect(c.label.startsWith("Gesperrt:"), c.label).toBe(r.status === "blocked");
      if (r.status === "calculated") expect(calculatedPart).toContain(c.label);
      else expect(rest).toContain(c.label.replace("Gesperrt: ", ""));
    }
    expect(calculatedPart).toContain("mit ʿAwl gekürzt");
  });

  it("pre-approves nothing and says it is not for publication", () => {
    expect(md).toContain("nicht zur Veröffentlichung");
    expect(md).toContain(`Status: ${SUNNI_NUCLEAR_FAMILY_V1.reviewStatus}`);
    expect(md).toContain("Name und Qualifikation: ______");
    expect(md).not.toMatch(/☒|\[x\]/i);
  });
});

describe("the display gate needs a named review", () => {
  const reviewed = { ...SUNNI_NUCLEAR_FAMILY_V1, reviewStatus: "scholar_reviewed" as const, reviewedBy: "Prüfgremium Test", reviewedAt: "2030-01-01" };

  it.each([
    ["no reviewer", { ...reviewed, reviewedBy: undefined }],
    ["blank reviewer", { ...reviewed, reviewedBy: "  " }],
    ["no date", { ...reviewed, reviewedAt: undefined }],
    ["withdrawn", { ...reviewed, reviewStatus: "withdrawn" as const }],
  ])("stays closed with %s", (_label, ruleSet) => {
    expect(isRuleSetDisplayable(ruleSet, true)).toBe(false);
  });

  it("the shipped rule set is still unreviewed", () => {
    expect(SUNNI_NUCLEAR_FAMILY_V1.reviewStatus).toBe("unreviewed_draft");
    expect(SUNNI_NUCLEAR_FAMILY_V1.reviewedBy).toBeUndefined();
  });

  it("shows per-person shares and the calculation steps once open", () => {
    const r = calculateFaraid({ ...base, wives: 1, sons: 2 });
    if (r.status !== "calculated") throw new Error("expected calculated");
    render(<FaraidModelResult model={{ ...r, ruleSet: reviewed }} featureEnabled />);
    const text = screen.getByTestId("faraid-model-result").textContent!;
    expect(text).toContain("7/8 (je 7/16)");
    expect(screen.getByTestId("faraid-model-steps").textContent).toContain("Rest an Kinder");
    expect(text).toContain("nach Bestattungskosten, Schulden und Vermächtnissen");
  });
});
