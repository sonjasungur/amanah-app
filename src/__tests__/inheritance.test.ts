import { describe, expect, it } from "vitest";
import {
  add,
  calculateFaraid,
  frac,
  isRuleSetDisplayable,
  sum,
  SUNNI_NUCLEAR_FAMILY_V1,
  toString,
  type FaraidCaseInput,
  type FaraidResult,
} from "@/lib/inheritance";
import { isTestamentPreparationEnabled } from "@/lib/flags/testament-preparation";

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

function shares(result: FaraidResult): Record<string, string> {
  if (result.status !== "calculated") throw new Error(`blocked: ${result.reasons.join("; ")}`);
  return Object.fromEntries(result.shares.map((s) => [s.heir, toString(s.groupShare)]));
}

function total(result: FaraidResult): string {
  if (result.status !== "calculated") return "blocked";
  return toString(sum(result.shares.map((s) => s.groupShare)));
}

describe("Fraction", () => {
  it("normalizes and adds exactly", () => {
    expect(toString(frac(4, 8))).toBe("1/2");
    expect(toString(add(frac(1, 3), frac(1, 6)))).toBe("1/2");
    expect(toString(frac(3, -9))).toBe("-1/3");
  });

  it("throws instead of rounding on overflow", () => {
    expect(() => frac(Number.MAX_SAFE_INTEGER + 1)).toThrow(RangeError);
  });
});

describe("calculateFaraid (unreviewed prototype)", () => {
  it("wife, one son, one daughter", () => {
    const r = calculateFaraid({ ...base, wives: 1, sons: 1, daughters: 1 });
    expect(shares(r)).toEqual({ wives: "1/8", sons: "7/12", daughters: "7/24" });
    expect(total(r)).toBe("1");
  });

  it("applies ʿawl: wife, two daughters, father, mother (27ths)", () => {
    const r = calculateFaraid({ ...base, wives: 1, daughters: 2, father: true, mother: true });
    expect(r.status === "calculated" && r.awl).toBe(true);
    expect(shares(r)).toEqual({ wives: "1/9", mother: "4/27", father: "4/27", daughters: "16/27" });
    expect(total(r)).toBe("1");
  });

  it("applies ʿawl: husband, one daughter, father, mother (13ths)", () => {
    const r = calculateFaraid({ ...base, deceasedGender: "female", husband: true, daughters: 1, father: true, mother: true });
    expect(shares(r)).toEqual({ husband: "3/13", mother: "2/13", father: "2/13", daughters: "6/13" });
  });

  it("father takes 1/6 plus residue next to one daughter", () => {
    const r = calculateFaraid({ ...base, daughters: 1, father: true });
    expect(shares(r)).toEqual({ daughters: "1/2", father: "1/2" });
  });

  it("parents only: mother 1/3, father residue", () => {
    expect(shares(calculateFaraid({ ...base, father: true, mother: true }))).toEqual({ mother: "1/3", father: "2/3" });
  });

  it("splits a group share per person", () => {
    const r = calculateFaraid({ ...base, daughters: 2, father: true });
    if (r.status !== "calculated") throw new Error("blocked");
    const daughters = r.shares.find((s) => s.heir === "daughters")!;
    expect(toString(daughters.perPerson)).toBe("1/3");
  });

  it.each<[string, Partial<FaraidCaseInput>]>([
    ["ʿUmariyyatān", { husband: true, deceasedGender: "female", father: true, mother: true }],
    ["radd / other agnates", { wives: 1, daughters: 1 }],
    ["different religion", { sons: 1, differentReligionHeirs: true }],
    ["siblings without son or father", { daughters: 2, siblings: 1 }],
    ["grandchildren via predeceased son", { daughters: 1, father: true, sonsChildren: true }],
    ["grandparents with a parent missing", { sons: 1, grandparents: true }],
    ["more than one wife", { wives: 2, sons: 1 }],
    ["nobody", {}],
  ])("blocks %s", (_label, override) => {
    expect(calculateFaraid({ ...base, ...override }).status).toBe("blocked");
  });
});

describe("display gate", () => {
  it("never displays an unreviewed rule set, even with the flag on", () => {
    expect(SUNNI_NUCLEAR_FAMILY_V1.reviewStatus).toBe("unreviewed_draft");
    expect(isRuleSetDisplayable(SUNNI_NUCLEAR_FAMILY_V1, true)).toBe(false);
    expect(isRuleSetDisplayable({ ...SUNNI_NUCLEAR_FAMILY_V1, reviewStatus: "scholar_reviewed" }, false)).toBe(false);
  });

  it("testament preparation flag defaults to off", () => {
    expect(isTestamentPreparationEnabled()).toBe(false);
  });
});
