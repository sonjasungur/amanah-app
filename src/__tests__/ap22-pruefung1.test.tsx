/**
 * Fixes from the independent review 1 (AP22 Endabnahme, 27.11.2026, PRUEFUNG-UNABHAENGIG-1.md):
 * B2-1 unknown child count / spouse, B2-2 special circumstances, B2-3 joint will when widowed or divorced,
 * B2-4 citizenship parsing and treaties, B3-2 production guard, B3-4 malformed hash, B3-5 law texts,
 * B1-2 count limit, B3-1 query kept on the way to the login.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { defaultAmanahData } from "@/lib/domain/defaults";
import { migrateRawData } from "@/lib/domain/migration";
import type { AmanahOrdnerData, FamilyMember, TestamentPreparation } from "@/lib/domain/types";
import { toFaraidInput } from "@/lib/testament/faraid-mapping";
import { buildLawyerQuestions, parseCitizenships } from "@/lib/testament/lawyer-questions";
import { PREPARATION_STEPS, isStepRelevant } from "@/lib/testament/steps";
import { calculateFaraid, getBlockingReasons } from "@/lib/inheritance";
import { validateProductionEnv } from "@/lib/server/production-config";
import { explainLaw } from "@/lib/knowledge/law-explanations";
import { OpenDetailsOnHash } from "@/components/knowledge/zentrum/open-details-on-hash";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ usePathname: () => "/dashboard/janazah", useRouter: () => ({ replace }) }));
vi.mock("@/lib/auth/context", () => ({ useAuth: () => ({ session: null, isLoading: false }) }));
vi.mock("@/lib/auth/config", () => ({ getAuthMode: () => "api", getStorageMode: () => "api" }));

function data(
  islamic: Partial<TestamentPreparation["islamicModel"]> = {},
  facts: Partial<TestamentPreparation["legalFacts"]> = {},
  profile: Partial<AmanahOrdnerData["inheritanceProfile"]> = {},
  familyMembers: FamilyMember[] = []
): AmanahOrdnerData {
  const base = structuredClone(defaultAmanahData);
  base.testamentPreparation.islamicModel = {
    ...base.testamentPreparation.islamicModel,
    ownGender: "female",
    hasChildren: "ja",
    fatherAlive: "ja",
    motherAlive: "nein",
    grandparentsAlive: "nein",
    grandchildrenViaDeceasedSon: "nein",
    halfSiblings: "nein",
    adoptedChildren: "nein",
    moreThanOneSpouse: "nein",
    otherRelatives: "nein",
    expectedChild: "nein",
    unclearParentage: "nein",
    missingRelative: "nein",
    otherSpecialCircumstances: "nein",
    ...islamic,
  };
  base.testamentPreparation.legalFacts = { ...base.testamentPreparation.legalFacts, maritalStatus: "verheiratet", differentReligionRelatives: "nein", ...facts };
  base.inheritanceProfile = { ...base.inheritanceProfile, sons: 2, daughters: 0, siblings: false, spouseAlive: true, stepchildren: false, fosterChildren: false, ...profile };
  base.familyMembers = familyMembers;
  return base;
}

const missingOf = (d: AmanahOrdnerData) => {
  const res = toFaraidInput(d);
  return "missing" in res ? res.missing : [];
};
const kid = (id: string): FamilyMember => ({ id, name: `Kind ${id}`, relation: "Sohn", relationType: "kind" });

describe("B2-1: child count and spouse are never guessed", () => {
  it("the review scenario (sons only in Familie & Kontakte, counts untouched) is missing, not 'no children'", () => {
    const d = data({ hasChildren: "" }, {}, { sons: 0, daughters: 0 }, [kid("a"), kid("b")]);
    const missing = missingOf(d);
    expect(missing).toContain("Hast du lebende Kinder?");
    expect(missing.join(" ")).toContain("in „Familie & Kontakte“ sind 2 Kinder eingetragen, im Erbprofil keine");
  });

  it("'yes, children' with counts left at 0 asks for the counts", () => {
    expect(missingOf(data({ hasChildren: "ja" }, {}, { sons: 0, daughters: 0 }))).toContain("Anzahl der Söhne und Töchter (im Erbprofil)");
  });

  it("'no children' against counts in the profile is a contradiction", () => {
    expect(missingOf(data({ hasChildren: "nein" })).join(" ")).toContain("Widerspruch: im Erbprofil sind Kinder eingetragen");
  });

  it("'no children' against children in Familie & Kontakte is a contradiction", () => {
    expect(missingOf(data({ hasChildren: "nein" }, {}, { sons: 0 }, [kid("a")])).join(" ")).toContain("ist 1 Kind eingetragen");
  });

  it("an unanswered 'spouse alive' is missing for married people, a dead spouse contradicts 'verheiratet'", () => {
    expect(missingOf(data({}, {}, { spouseAlive: null }))).toContain("Lebt dein Ehepartner? (im Erbprofil)");
    expect(missingOf(data({}, {}, { spouseAlive: false })).join(" ")).toContain("Widerspruch: Familienstand „verheiratet“");
    expect(missingOf(data({}, { maritalStatus: "verwitwet" }, { spouseAlive: null }))).not.toContain("Lebt dein Ehepartner? (im Erbprofil)");
  });

  it("unanswered step- or foster children are missing instead of read as 'no'", () => {
    expect(missingOf(data({}, {}, { stepchildren: null }))).toContain("Stief- oder Pflegekinder (im Erbprofil)");
  });

  it("with everything answered the review scenario is calculated correctly (husband 1/4, father 1/6, sons 7/12)", () => {
    const res = toFaraidInput(data({}, {}, {}, [kid("a"), kid("b")]));
    if (!("input" in res)) throw new Error(`missing: ${res.missing.join(", ")}`);
    const result = calculateFaraid(res.input);
    if (result.status !== "calculated") throw new Error(result.reasons.join(" "));
    const share = (heir: string) => result.shares.find((s) => s.heir === heir)?.groupShare;
    expect(share("husband")).toMatchObject({ num: 1, den: 4 });
    expect(share("father")).toMatchObject({ num: 1, den: 6 });
    expect(share("sons")).toMatchObject({ num: 7, den: 12 });
  });

  it("old stored data without the new answers counts as missing after migration", () => {
    const old = migrateRawData({ testamentPreparation: { islamicModel: { ownGender: "male" }, legalFacts: { maritalStatus: "ledig" } } });
    expect(old.testamentPreparation.islamicModel.hasChildren).toBe("");
    expect(missingOf(old)).toEqual(expect.arrayContaining(["Hast du lebende Kinder?", "Wird ein Kind erwartet?"]));
  });
});

describe("B2-2: special circumstances are asked and block the model", () => {
  const ids = ["expectedChild", "unclearParentage", "missingRelative", "otherSpecialCircumstances"] as const;

  it("asks each question with yes / no / don't know", () => {
    for (const id of ids) {
      const step = PREPARATION_STEPS.find((s) => s.id === id)!;
      expect(step.part).toBe("islamicModel");
      expect(step.options?.map((o) => o.value)).toEqual(["ja", "nein", "unsicher"]);
      expect(isStepRelevant(data().testamentPreparation, step)).toBe(true);
    }
    const other = PREPARATION_STEPS.find((s) => s.id === "otherSpecialCircumstances")!;
    expect(other.help).toContain("gleichzeitiger Tod");
    expect(other.help).toContain("Geschlecht nicht eindeutig");
  });

  it.each(ids)("'ja' for %s blocks as special circumstances", (id) => {
    const res = toFaraidInput(data({ [id]: "ja" }));
    if (!("input" in res)) throw new Error("expected input");
    expect(res.input.otherSpecialCircumstances).toBe(true);
    const result = calculateFaraid(res.input);
    expect(result.status).toBe("blocked");
    if (result.status === "blocked") expect(result.reasons.join(" ")).toContain("Sonderumstände");
  });

  it.each(ids)("'weiß nicht' or no answer for %s is missing", (id) => {
    expect(missingOf(data({ [id]: "unsicher" })).length).toBe(1);
    expect(missingOf(data({ [id]: "" })).length).toBe(1);
  });
});

describe("B1-2: absurd counts are blocked, never computed", () => {
  it("blocks more than 50 sons instead of overflowing", () => {
    const res = toFaraidInput(data({}, {}, { sons: 1e16 }));
    if (!("input" in res)) throw new Error("expected input");
    expect(getBlockingReasons(res.input)).toContain("Ungültige Anzahl von Angehörigen.");
    expect(calculateFaraid(res.input).status).toBe("blocked");
  });
});

describe("B2-3: joint will for widowed and divorced people", () => {
  const joint = PREPARATION_STEPS.find((s) => s.id === "jointWill")!;

  it("asks the joint-will question when married, widowed or divorced, not when single", () => {
    for (const status of ["verheiratet", "verwitwet", "geschieden"] as const) expect(isStepRelevant(data({}, { maritalStatus: status }).testamentPreparation, joint)).toBe(true);
    expect(isStepRelevant(data({}, { maritalStatus: "ledig" }).testamentPreparation, joint)).toBe(false);
  });

  it("widowed: asks about the binding effect (§ 2271 Abs. 2 BGB) instead of only 'how do I revoke it'", () => {
    const q = buildLawyerQuestions(data({}, { maritalStatus: "verwitwet", jointWillWithSpouse: "ja", existingWill: "ja" }));
    const byId = Object.fromEntries(q.map((x) => [x.id, x]));
    expect(byId["joint-widowed"].reference).toContain("§ 2271 Abs. 2 BGB");
    expect(byId.existing.question).not.toContain("wie widerrufe ich");
    expect(byId.existing.reference).toContain("2271 Abs. 2");
  });

  it("divorced: asks whether the joint will still applies (§ 2268 BGB)", () => {
    const q = buildLawyerQuestions(data({}, { maritalStatus: "geschieden", jointWillWithSpouse: "unsicher" }));
    expect(q.find((x) => x.id === "joint-divorced")?.reference).toContain("§§ 2268");
  });

  it("no joint will: no binding question", () => {
    const ids = buildLawyerQuestions(data({}, { maritalStatus: "verwitwet", jointWillWithSpouse: "nein", existingWill: "ja" })).map((x) => x.id);
    expect(ids).not.toContain("joint-widowed");
    expect(buildLawyerQuestions(data({}, { maritalStatus: "verwitwet", jointWillWithSpouse: "nein", existingWill: "ja" })).find((x) => x.id === "existing")?.question).toContain("widerrufe");
  });
});

describe("B2-4: citizenships are read robustly; Turkey and Iran get the treaty question", () => {
  it.each([
    ["deutsch-türkisch", true, ["der Türkei"]],
    ["Deutsch - Türkisch", true, ["der Türkei"]],
    ["DEUTSCH, IRANISCH", true, ["dem Iran"]],
    ["deutsch und tuerkisch", true, ["der Türkei"]],
    ["türkisch", false, ["der Türkei"]],
    ["iranisch", false, ["dem Iran"]],
    ["deutsch/marokkanisch", true, []],
  ])("%s", (raw, multiple, treaty) => {
    const parsed = parseCitizenships(raw);
    expect(parsed.multiple).toBe(multiple);
    expect(parsed.foreign).toBe(true);
    expect(parsed.treaty).toEqual(treaty);
  });

  it("German only stays national", () => {
    for (const raw of ["deutsch", "Deutsch", "deutsche Staatsangehörigkeit", "Deutschland"]) {
      const parsed = parseCitizenships(raw);
      expect(parsed.multiple || parsed.foreign).toBe(false);
    }
    expect(parseCitizenships("doppelte Staatsangehörigkeit").multiple).toBe(true);
  });

  it("'deutsch-türkisch' raises the international question and the Art. 75 EuErbVO treaty question", () => {
    const q = buildLawyerQuestions(data({}, { citizenships: "deutsch-türkisch", habitualResidence: "deutschland" }));
    const ids = q.map((x) => x.id);
    expect(ids).toEqual(expect.arrayContaining(["international", "treaty"]));
    const treaty = q.find((x) => x.id === "treaty")!;
    expect(treaty.reference).toContain("Art. 75 EuErbVO");
    expect(treaty.question).toContain("der Türkei");
  });

  it("property in Iran also raises the treaty question", () => {
    const q = buildLawyerQuestions(data({}, { citizenships: "deutsch", assetsAbroad: "ja", assetsAbroadCountries: "Iran" }));
    expect(q.find((x) => x.id === "treaty")?.question).toContain("dem Iran");
  });

  it("plain German citizenship raises neither", () => {
    const ids = buildLawyerQuestions(data({}, { citizenships: "deutsch", habitualResidence: "deutschland" })).map((x) => x.id);
    expect(ids).not.toContain("international");
    expect(ids).not.toContain("treaty");
  });
});

describe("B3-2: the deploy check refuses the preview switches in production", () => {
  const base = { NODE_ENV: "production" };
  it("scripts/validate-production-env.mjs and production-config.ts both refuse AMANAH_KNOWLEDGE_PREVIEW and AMANAH_INTERNAL_TOOLS", async () => {
    const { validateProductionEnv: validateScript } = (await import("../../scripts/validate-production-env.mjs")) as unknown as {
      validateProductionEnv: (e: Record<string, string>) => { errors: string[] };
    };
    for (const validate of [validateScript, (e: Record<string, string>) => validateProductionEnv(e as NodeJS.ProcessEnv)]) {
      expect(validate({ ...base, AMANAH_KNOWLEDGE_PREVIEW: "true" }).errors.join(" ")).toContain("AMANAH_KNOWLEDGE_PREVIEW must not be enabled in production");
      expect(validate({ ...base, AMANAH_INTERNAL_TOOLS: "true" }).errors.join(" ")).toContain("AMANAH_INTERNAL_TOOLS must not be enabled in production");
      expect(validate({ ...base, AMANAH_KNOWLEDGE_PREVIEW: "false" }).errors.join(" ")).not.toContain("AMANAH_KNOWLEDGE_PREVIEW");
    }
  });
});

describe("B3-4 / B3-5: knowledge centre details", () => {
  afterEach(() => {
    window.location.hash = "";
  });

  it("a malformed hash does not throw", () => {
    window.location.hash = "%E0";
    expect(() => render(<OpenDetailsOnHash />)).not.toThrow();
  });

  it("law explanations are precise", () => {
    expect(explainLaw("§ 125 BGB")).toContain("eigenhändiges Testament, das nicht vollständig von Hand geschrieben ist");
    expect(explainLaw("§ 1931 BGB")).not.toContain("Zugewinn-Ausgleich");
    expect(explainLaw("§ 1931 BGB")).toContain("§ 1371");
    expect(explainLaw("§ 2265 BGB")).toContain("Lebenspartner");
  });
});

describe("B3-1: the way to the login keeps the query", () => {
  it("passes path and query as return target", async () => {
    window.history.replaceState(null, "", "/dashboard/janazah?step=3");
    const { DashboardAuthGate } = await import("@/components/dashboard/dashboard-auth-gate");
    render(<DashboardAuthGate>x</DashboardAuthGate>);
    expect(replace).toHaveBeenCalledWith(`/login?returnUrl=${encodeURIComponent("/dashboard/janazah?step=3")}`);
    window.history.replaceState(null, "", "/");
  });
});
