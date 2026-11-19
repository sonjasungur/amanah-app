import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { defaultAmanahData } from "@/lib/domain/defaults";
import { migrateRawData } from "@/lib/domain/migration";
import type { TestamentPreparation } from "@/lib/domain/types";
import { PREPARATION_STEPS, isStepRelevant } from "@/lib/testament/steps";
import { toFaraidInput } from "@/lib/testament/faraid-mapping";
import { buildLawyerQuestions } from "@/lib/testament/lawyer-questions";
import { SUNNI_NUCLEAR_FAMILY_V1, calculateFaraid } from "@/lib/inheritance";
import { FaraidModelResult } from "@/components/testament/faraid-model-result";
import { AssetOverview } from "@/components/testament/asset-overview";
import { useAmanahStore } from "@/lib/store/use-amanah-store";

function data(islamic: Partial<TestamentPreparation["islamicModel"]> = {}, facts: Partial<TestamentPreparation["legalFacts"]> = {}, wishes: Partial<TestamentPreparation["personalWishes"]> = {}, profile = {}) {
  const base = structuredClone(defaultAmanahData);
  base.testamentPreparation.islamicModel = {
    ...base.testamentPreparation.islamicModel,
    ownGender: "male",
    fatherAlive: "nein",
    motherAlive: "nein",
    grandparentsAlive: "nein",
    grandchildrenViaDeceasedSon: "nein",
    halfSiblings: "nein",
    adoptedChildren: "nein",
    moreThanOneSpouse: "nein",
    otherRelatives: "nein",
    ...islamic,
  };
  base.testamentPreparation.legalFacts = { ...base.testamentPreparation.legalFacts, maritalStatus: "verheiratet", differentReligionRelatives: "nein", ...facts };
  base.testamentPreparation.personalWishes = { ...base.testamentPreparation.personalWishes, ...wishes };
  base.inheritanceProfile = { ...base.inheritanceProfile, sons: 1, daughters: 1, siblings: false, spouseAlive: true, ...profile };
  return base;
}

function result(d: ReturnType<typeof data>) {
  const mapped = toFaraidInput(d);
  if (!("input" in mapped)) throw new Error(`missing: ${mapped.missing.join(", ")}`);
  return calculateFaraid(mapped.input);
}

describe("extended heir model stays conservative", () => {
  it("reports unanswered new questions as missing instead of guessing", () => {
    const res = toFaraidInput(data({ halfSiblings: "unsicher", adoptedChildren: "", moreThanOneSpouse: "unsicher" }));
    expect("missing" in res && res.missing).toEqual(["Halbgeschwister?", "Adoptierte Kinder?", "Mehr als eine Ehe?"]);
    const noSon = toFaraidInput(data({ otherRelatives: "unsicher" }, {}, {}, { sons: 0 }));
    expect("missing" in noSon && noSon.missing).toEqual(["Weitere männliche Verwandte?"]);
  });

  it("treats old stored answers without the new fields as missing", () => {
    const old = data();
    const i = old.testamentPreparation.islamicModel as unknown as Record<string, unknown>;
    delete i.halfSiblings;
    delete i.adoptedChildren;
    delete i.moreThanOneSpouse;
    expect("missing" in toFaraidInput(old)).toBe(true);
  });

  it.each([
    ["adopted child", data({ adoptedChildren: "ja" })],
    ["more than one wife", data({ moreThanOneSpouse: "ja" })],
    ["several spouses reported by a woman", data({ ownGender: "female", moreThanOneSpouse: "ja" })],
    ["other agnates without a son", data({ otherRelatives: "ja" }, {}, {}, { sons: 0 })],
    ["half siblings without a son", data({ halfSiblings: "ja" }, {}, {}, { sons: 0 })],
  ])("blocks %s instead of calculating", (_label, d) => {
    expect(result(d).status).toBe("blocked");
  });

  it("does not ask to resolve what cannot apply", () => {
    const single = data({}, { maritalStatus: "ledig", minorChildren: "nein" }).testamentPreparation;
    const ids = PREPARATION_STEPS.filter((s) => isStepRelevant(single, s)).map((s) => s.id);
    for (const id of ["moreThanOneSpouse", "executorPerson", "guardianPerson", "guardianExcluded"]) expect(ids).not.toContain(id);
    const parent = data({}, { minorChildren: "ja" }, { executorWish: "ja" }).testamentPreparation;
    const parentIds = PREPARATION_STEPS.filter((s) => isStepRelevant(parent, s)).map((s) => s.id);
    for (const id of ["executorPerson", "guardianPerson", "guardianExcluded"]) expect(parentIds).toContain(id);
  });
});

describe("executor and guardian remain questions, not appointments", () => {
  it("adds questions for the lawyer without a statement about the result", () => {
    const q = buildLawyerQuestions(data({ adoptedChildren: "ja", moreThanOneSpouse: "ja" }, { minorChildren: "ja" }, { executorWish: "unsicher" }));
    const byId = Object.fromEntries(q.map((x) => [x.id, x]));
    expect(byId.guardian.reference).toBe("§§ 1782, 1783 BGB");
    expect(byId.executor.reference).toBe("§§ 2197 ff. BGB");
    expect(byId.adopted).toBeTruthy();
    expect(byId.spouses).toBeTruthy();
    for (const x of q) expect(x.question.endsWith("?")).toBe(true);
  });

  it("guardian help names one person or a married couple and says it appoints nobody", () => {
    const help = PREPARATION_STEPS.find((s) => s.id === "guardianPerson")!.help!;
    expect(help).toContain("Eine Person oder ein Ehepaar");
    expect(help).toContain("formgültigen letztwilligen Verfügung");
  });
});

describe("model shares are gated twice", () => {
  const calculated = () => {
    const r = result(data());
    if (r.status !== "calculated") throw new Error("expected calculated");
    return r;
  };

  it("never renders with the shipped, unreviewed rule set, even with the flag on", () => {
    expect(SUNNI_NUCLEAR_FAMILY_V1.reviewStatus).toBe("unreviewed_draft");
    const { container } = render(<FaraidModelResult model={calculated()} featureEnabled />);
    expect(container.innerHTML).toBe("");
  });

  it("does not render for a reviewed rule set while the flag is off", () => {
    const model = { ...calculated(), ruleSet: { ...SUNNI_NUCLEAR_FAMILY_V1, reviewStatus: "scholar_reviewed" as const } };
    const { container } = render(<FaraidModelResult model={model} featureEnabled={false} />);
    expect(container.innerHTML).toBe("");
  });

  it("shows exact fractions, the reviewer and the limits once both gates are open", () => {
    const model = { ...calculated(), ruleSet: { ...SUNNI_NUCLEAR_FAMILY_V1, reviewStatus: "scholar_reviewed" as const, reviewedBy: "Prüfgremium Test", reviewedAt: "2030-01-01" } };
    render(<FaraidModelResult model={model} featureEnabled />);
    const box = screen.getByTestId("faraid-model-result").textContent!;
    expect(box).toContain("1/8");
    expect(box).toContain("Prüfgremium Test");
    expect(box).toContain("Kein Testament");
  });
});

describe("asset overview", () => {
  beforeEach(() => useAmanahStore.setState({ ...structuredClone(defaultAmanahData) }));

  it("adds and removes entries without requiring amounts; property details only for real estate", () => {
    render(<AssetOverview />);
    expect((screen.getByTestId("asset-add") as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByLabelText("Eigentum")).toBeNull();
    fireEvent.change(screen.getByLabelText("Art"), { target: { value: "real_estate" } });
    fireEvent.change(screen.getByLabelText("Adresse oder Bezeichnung"), { target: { value: "Testweg 1" } });
    fireEvent.change(screen.getByLabelText("Eigentum"), { target: { value: "gemeinsam" } });
    fireEvent.change(screen.getByLabelText("Hypothek oder Kredit?"), { target: { value: "ja" } });
    fireEvent.click(screen.getByTestId("asset-add"));
    const [entry] = useAmanahStore.getState().assets;
    expect(entry).toMatchObject({ type: "real_estate", description: "Testweg 1", ownership: "gemeinsam", mortgage: "ja" });
    expect(entry.approximateValue).toBeUndefined();
    expect(screen.getByTestId("asset-list").textContent).toContain("Testweg 1");
    fireEvent.click(screen.getByRole("button", { name: "Testweg 1 entfernen" }));
    expect(useAmanahStore.getState().assets).toEqual([]);
  });

  it("survives the stored-data migration", () => {
    const migrated = migrateRawData({ assets: [{ id: "a", type: "gold_silver", description: "Schmuck" }] });
    expect(migrated.assets[0].type).toBe("gold_silver");
  });
});
