import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { defaultAmanahData } from "@/lib/domain/defaults";
import type { AmanahOrdnerData } from "@/lib/domain/types";
import { PREPARATION_STEPS, isStepRelevant, writeStepValue } from "@/lib/testament/steps";
import { buildLawyerQuestions } from "@/lib/testament/lawyer-questions";
import { toFaraidInput } from "@/lib/testament/faraid-mapping";
import { calculateFaraid, isRuleSetDisplayable } from "@/lib/inheritance";
import { useAmanahStore } from "@/lib/store/use-amanah-store";
import TestamentVorbereitungPage from "@/app/dashboard/testament/vorbereitung/page";
import { I18nProvider } from "@/lib/i18n/context";

const renderPage = () => render(<I18nProvider><TestamentVorbereitungPage /></I18nProvider>);

function data(overrides: Partial<AmanahOrdnerData["testamentPreparation"]["legalFacts"]> = {}, islamic = {}, profile = {}): AmanahOrdnerData {
  const base = structuredClone(defaultAmanahData);
  base.testamentPreparation.legalFacts = { ...base.testamentPreparation.legalFacts, ...overrides };
  base.testamentPreparation.islamicModel = { ...base.testamentPreparation.islamicModel, ...islamic };
  base.inheritanceProfile = { ...base.inheritanceProfile, ...profile };
  return base;
}

describe("questionnaire logic", () => {
  it("skips steps that do not apply", () => {
    const single = data({ maritalStatus: "ledig" }).testamentPreparation;
    const ids = PREPARATION_STEPS.filter((s) => isStepRelevant(single, s)).map((s) => s.id);
    expect(ids).not.toContain("regime");
    expect(ids).not.toContain("abroadCountries");
    const married = writeStepValue(single, PREPARATION_STEPS.find((s) => s.id === "marital")!, "verheiratet");
    expect(PREPARATION_STEPS.filter((s) => isStepRelevant(married, s)).map((s) => s.id)).toContain("regime");
  });

  it("derives lawyer questions from the answers — questions, not answers", () => {
    const q = buildLawyerQuestions(
      data({ maritalStatus: "verheiratet", assetsAbroad: "ja", assetsAbroadCountries: "Türkei", citizenships: "deutsch, türkisch" }, { wantsIslamicDistribution: "ja" })
    ).map((x) => x.id);
    expect(q).toEqual(expect.arrayContaining(["form", "islamic", "pflichtteil", "regime", "joint", "international", "abroad", "storage"]));
    expect(buildLawyerQuestions(data({ maritalStatus: "ledig", existingWill: "nein", citizenships: "deutsch" })).map((x) => x.id)).toEqual(["form", "storage"]);
  });

  it("reports missing answers instead of guessing", () => {
    const res = toFaraidInput(data());
    expect("missing" in res && res.missing).toEqual(expect.arrayContaining(["Eigenes Geschlecht", "Lebt der Vater?", "Leben Großeltern?"]));
  });

  it("maps complete answers; the result is never displayable while the rule set is unreviewed", () => {
    const res = toFaraidInput(
      data(
        { maritalStatus: "verheiratet", differentReligionRelatives: "nein" },
        { ownGender: "male", fatherAlive: "nein", motherAlive: "nein", grandparentsAlive: "nein", grandchildrenViaDeceasedSon: "nein", halfSiblings: "nein", adoptedChildren: "nein", moreThanOneSpouse: "nein" },
        { sons: 1, daughters: 1, siblings: false, spouseAlive: true }
      )
    );
    if (!("input" in res)) throw new Error("expected input");
    const result = calculateFaraid(res.input);
    expect(result.status).toBe("calculated");
    expect(isRuleSetDisplayable(result.ruleSet, true)).toBe(false);
  });
});

describe("preparation page", () => {
  beforeEach(() => useAmanahStore.setState({ ...structuredClone(defaultAmanahData) }));
  afterEach(() => vi.unstubAllEnvs());

  it("is locked without the feature flag", () => {
    renderPage();
    expect(screen.getByTestId("testament-preparation-locked")).toBeTruthy();
  });

  it("walks one question per step to a separated summary with a locked model", () => {
    vi.stubEnv("NEXT_PUBLIC_AMANAH_TESTAMENT_PREPARATION", "true");
    useAmanahStore.setState({ inheritanceProfile: { ...defaultAmanahData.inheritanceProfile, sons: 1, daughters: 1, siblings: false } });
    renderPage();
    const answer = (label: string) => fireEvent.click(screen.getAllByRole("button", { name: label })[0]);
    answer("Verheiratet");
    answer("Zugewinngemeinschaft (kein Ehevertrag)");
    fireEvent.click(screen.getByTestId("preparation-next")); // citizenship (text)
    answer("In Deutschland");
    answer("Nein"); // existing will
    answer("Nein"); // joint will
    answer("Ja"); // real estate
    answer("Nein"); // abroad
    answer("Nein"); // business
    answer("Nein"); // other religion
    answer("Nein"); // minor children
    answer("Ja"); // islamic wish
    answer("Hanafitisch");
    answer("ein Mann");
    answer("Nein"); // father
    answer("Nein"); // mother
    answer("Nein"); // grandparents
    answer("Nein"); // grandchildren
    answer("Nein"); // half siblings
    answer("Nein"); // adopted children
    answer("Nein"); // more than one marriage
    answer("Nein"); // other relatives
    fireEvent.click(screen.getByTestId("preparation-next"));
    fireEvent.click(screen.getByTestId("preparation-next"));
    answer("Nein"); // executor wish
    expect(screen.getByTestId("preparation-summary")).toBeTruthy();
    expect(screen.getByTestId("faraid-locked").textContent).toContain("gesperrt");
    expect(screen.getByTestId("preparation-lawyer-questions").textContent).toContain("§§ 2303 ff. BGB");
    expect(screen.getByText(/Gesprächsunterlage – kein Testament/)).toBeTruthy();
  });
});
