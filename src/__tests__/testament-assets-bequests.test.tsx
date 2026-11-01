import { beforeEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { defaultAmanahData } from "@/lib/domain/defaults";
import { migrateRawData } from "@/lib/domain/migration";
import type { AssetEntry, BequestWish } from "@/lib/domain/types";
import { useAmanahStore } from "@/lib/store/use-amanah-store";
import { AssetOverview } from "@/components/testament/asset-overview";
import { AssetPrintEntries, AssetPrintView } from "@/components/print/asset-print-view";
import { BequestEditor, BequestSummary } from "@/components/testament/bequest-editor";
import { buildLawyerQuestions } from "@/lib/testament/lawyer-questions";
import { bequestFromDraft, parseGermanNumber, percentTotal, sanitizeBequests, validateBequestDraft, type BequestDraft } from "@/lib/testament/bequests";
import { PREPARATION_STEPS } from "@/lib/testament/steps";
import { SUNNI_NUCLEAR_FAMILY_V1 } from "@/lib/inheritance";
import PdfPage from "@/app/dashboard/pdf/page";
import { I18nProvider } from "@/lib/i18n/context";

const asset = (over: Partial<AssetEntry> = {}): AssetEntry => ({ id: "a1", type: "bank", description: "Girokonto", locationHint: "Ordner", ...over });

describe("asset overview: editing", () => {
  beforeEach(() => useAmanahStore.setState({ ...structuredClone(defaultAmanahData) }));

  it("changes an entry without duplicating it and keeps values the form does not show", () => {
    useAmanahStore.setState({ assets: [asset({ approximateValue: "1000", notes: "alt" })] });
    render(<AssetOverview />);
    fireEvent.click(screen.getByRole("button", { name: "Girokonto bearbeiten" }));
    fireEvent.change(screen.getByLabelText("Bezeichnung"), { target: { value: "Tagesgeld" } });
    fireEvent.click(screen.getByTestId("asset-add"));
    const { assets } = useAmanahStore.getState();
    expect(assets).toHaveLength(1);
    expect(assets[0]).toMatchObject({ id: "a1", description: "Tagesgeld", approximateValue: "1000", notes: "alt" });
  });

  it("drops property details when an entry stops being real estate", () => {
    useAmanahStore.setState({ assets: [asset({ type: "real_estate", mortgage: "ja", ownership: "allein" })] });
    render(<AssetOverview />);
    fireEvent.click(screen.getByRole("button", { name: "Girokonto bearbeiten" }));
    fireEvent.change(screen.getByLabelText("Art"), { target: { value: "other" } });
    fireEvent.click(screen.getByTestId("asset-add"));
    const [entry] = useAmanahStore.getState().assets;
    expect(entry.mortgage).toBeUndefined();
    expect(entry.ownership).toBeUndefined();
  });

  it("warns against secrets and links to printing only once something is listed", () => {
    render(<AssetOverview />);
    expect(screen.getByTestId("asset-overview").textContent).toContain("keine Kontonummern, PINs oder Passwörter");
    expect(screen.queryByTestId("asset-print-link")).toBeNull();
    fireEvent.change(screen.getByLabelText("Bezeichnung"), { target: { value: "Depot" } });
    fireEvent.click(screen.getByTestId("asset-add"));
    expect(screen.getByTestId("asset-print-link").getAttribute("href")).toBe("/dashboard/pdf#export-vermoegen");
  });
});

describe("asset print: an inventory, not a will", () => {
  beforeEach(() => useAmanahStore.setState({ ...structuredClone(defaultAmanahData) }));

  it("says it is no will and has nothing that reads like one", () => {
    useAmanahStore.setState({ assets: [asset()] });
    render(<AssetPrintView />);
    const text = screen.getByTestId("asset-print-view").textContent!;
    expect(text).toContain("Kein Testament");
    expect(text).toContain("Reine Bestandsaufnahme");
    expect(text).toContain("Girokonto");
    expect(text).toContain("Unterlagen: Ordner");
    for (const forbidden of ["Unterschrift", "vermache", "Mein Wille", "letzter Wille", "rechtsgültig", "wirksam"]) {
      expect(text).not.toContain(forbidden);
    }
  });

  it("never prints amounts or free notes", () => {
    render(<AssetPrintEntries assets={[asset({ approximateValue: "250000", notes: "Geheime Notiz" })]} />);
    expect(document.body.textContent).not.toContain("250000");
    expect(document.body.textContent).not.toContain("Geheime Notiz");
  });

  it("is free, hides the page around it in print and suggests a file name that is no will", () => {
    vi.useFakeTimers();
    useAmanahStore.setState({ assets: [asset()] });
    const titles: string[] = [];
    const print = vi.spyOn(window, "print").mockImplementation(() => void titles.push(document.title));
    document.title = "Seitentitel";
    render(<I18nProvider><PdfPage /></I18nProvider>);
    const card = screen.getByTestId("export-vermoegen");
    expect(card.closest(".no-print")).not.toBeNull();
    fireEvent.click(card.querySelector("button")!);
    expect(screen.getByTestId("asset-print-view").closest(".print-only")).not.toBeNull();
    vi.advanceTimersByTime(200);
    expect(print).toHaveBeenCalledOnce();
    expect(titles[0]).toBe("Vermögensübersicht – kein Testament");
    expect(document.title).toBe("Seitentitel");
    print.mockRestore();
    vi.useRealTimers();
  });
});

const draft = (over: Partial<BequestDraft> = {}): BequestDraft => ({ kind: "amount", value: "1.000", item: "", beneficiary: "Aisha", beneficiaryKind: "person", alsoHeir: "", note: "", ...over });
const wish = (over: Partial<BequestWish> = {}): BequestWish => ({ id: "b1", kind: "percent", value: 10, beneficiary: "Aisha", beneficiaryKind: "person", alsoHeir: "", ...over });

describe("structured bequest wishes", () => {
  it.each([["5.000,50", 5000.5], ["12,5", 12.5], ["12.5", 12.5], ["1.000.000", 1000000], ["10 %", 10], ["5000 €", 5000]])("reads %s", (text, value) => {
    expect(parseGermanNumber(text)).toBe(value);
  });

  it.each(["", "abc", "1,2,3", "-5", "1.00.0"])("rejects %j", (text) => {
    expect(parseGermanNumber(text)).toBeNull();
  });

  it("checks the input by kind", () => {
    expect(validateBequestDraft(draft())).toEqual([]);
    expect(validateBequestDraft(draft({ beneficiary: " " }))).toHaveLength(1);
    expect(validateBequestDraft(draft({ value: "0" }))).toHaveLength(1);
    expect(validateBequestDraft(draft({ kind: "percent", value: "101" }))).toEqual(["Ein Prozentwert kann nicht über 100 liegen."]);
    expect(validateBequestDraft(draft({ kind: "item", value: "", item: "" }))).toEqual(["Bitte beschreibe den Gegenstand."]);
    expect(validateBequestDraft(draft({ kind: "item", value: "", item: "Goldkette" }))).toEqual([]);
  });

  it("never asks an organisation whether it would inherit", () => {
    expect(bequestFromDraft(draft({ beneficiaryKind: "organisation", alsoHeir: "ja" }), "x").alsoHeir).toBe("");
  });

  it("no message about validity, at any step of the flow", () => {
    const texts = [
      ...["", "abc"].flatMap((value) => validateBequestDraft(draft({ value }))),
      PREPARATION_STEPS.find((s) => s.id === "bequests")!.question,
    ].join(" ");
    expect(texts).not.toMatch(/wirksam|gültig|zulässig/i);
    expect(PREPARATION_STEPS.find((s) => s.id === "bequests")!.help).toContain("Damit wird nichts vermacht");
  });

  it("adds through the form, shows errors, sums percent and warns only about the arithmetic", () => {
    function Host() {
      const [items, setItems] = useState<BequestWish[]>([wish({ value: 95 })]);
      return <BequestEditor bequests={items} onChange={setItems} />;
    }
    render(<Host />);
    fireEvent.click(screen.getByTestId("bequest-add"));
    expect(screen.getByTestId("bequest-errors").textContent).toContain("wer etwas erhalten soll");
    fireEvent.change(screen.getByLabelText("Was?"), { target: { value: "percent" } });
    fireEvent.change(screen.getByLabelText("Anteil in Prozent"), { target: { value: "10" } });
    fireEvent.change(screen.getByLabelText("Für wen?"), { target: { value: "Moschee" } });
    fireEvent.change(screen.getByLabelText("Person oder Einrichtung?"), { target: { value: "organisation" } });
    expect(screen.queryByLabelText("Würde die Person auch erben?")).toBeNull();
    fireEvent.click(screen.getByTestId("bequest-add"));
    expect(screen.queryByTestId("bequest-errors")).toBeNull();
    expect(screen.getByTestId("bequest-list").textContent).toContain("Moschee");
    expect(screen.getByTestId("bequest-percent-total").textContent).toContain("105 %");
    expect(screen.getByTestId("bequest-percent-total").textContent).toContain("mehr als 100 %");
    fireEvent.click(screen.getByRole("button", { name: "Wunsch für Moschee entfernen" }));
    expect(screen.getByTestId("bequest-list").textContent).not.toContain("Moschee");
  });

  it("adds lawyer questions, among them whether a share makes someone an heir", () => {
    const base = structuredClone(defaultAmanahData);
    expect(buildLawyerQuestions(base).map((q) => q.id)).not.toContain("bequests");
    base.testamentPreparation.personalWishes.bequests = [wish({ alsoHeir: "unsicher" }), wish({ id: "b2", kind: "amount", value: 500, beneficiaryKind: "organisation" })];
    const byId = Object.fromEntries(buildLawyerQuestions(base).map((q) => [q.id, q]));
    expect(byId.bequests.reference).toContain("§§ 2147 ff.");
    expect(byId["bequest-percent"].reference).toBe("§ 2087 BGB");
    expect(byId["bequest-heir"].reference).toBe("§ 2150 BGB");
    expect(byId.charity).toBeTruthy();
    for (const q of Object.values(byId)) expect(q.question.endsWith("?")).toBe(true);
  });

  it("survives migration, drops malformed entries and tolerates broken stored data", () => {
    const stored = [wish(), wish({ id: "b2", value: 500 }), { id: "b3", kind: "percent", beneficiary: "x", value: "10" }, { kind: "item" }, null];
    expect(migrateRawData({ testamentPreparation: { personalWishes: { bequests: stored } } }).testamentPreparation.personalWishes.bequests).toEqual([wish()]);
    expect(sanitizeBequests("nope")).toEqual([]);
    expect(migrateRawData({}).testamentPreparation.personalWishes.bequests).toEqual([]);
    expect(migrateRawData({ testamentPreparation: null }).testamentPreparation.personalWishes.bequests).toEqual([]);
    expect(migrateRawData({ testamentPreparation: { personalWishes: null } }).testamentPreparation.personalWishes.bequests).toEqual([]);
  });

  it("percent total ignores amounts", () => {
    expect(percentTotal([wish({ value: 20 }), wish({ id: "b2", value: 12.5 }), wish({ id: "b3", kind: "amount", value: 900 })])).toBe(32.5);
  });
});

describe("the one-third question stays behind the scholar gate", () => {
  const over = [wish({ value: 40 })];
  const reviewed = { ...SUNNI_NUCLEAR_FAMILY_V1, reviewStatus: "scholar_reviewed" as const, reviewedBy: "Prüfgremium Test", reviewedAt: "2030-01-01" };

  it("is absent with the shipped rule set, even with the flag on", () => {
    render(<BequestSummary bequests={over} ruleSet={SUNNI_NUCLEAR_FAMILY_V1} featureEnabled />);
    expect(screen.getByTestId("bequest-summary").textContent).toContain("nur als Wunsch");
    expect(screen.getByTestId("bequest-summary").textContent).not.toMatch(/Drittel/);
    expect(screen.queryByTestId("bequest-scholar-questions")).toBeNull();
  });

  it("is absent without a named review", () => {
    render(<BequestSummary bequests={over} ruleSet={{ ...reviewed, reviewedBy: " " }} featureEnabled />);
    expect(screen.queryByTestId("bequest-scholar-questions")).toBeNull();
  });

  it("appears as a question once the gates are open, and only when relevant", () => {
    const { unmount } = render(<BequestSummary bequests={over} ruleSet={reviewed} featureEnabled />);
    expect(screen.getByTestId("bequest-scholar-questions").textContent!.endsWith("?")).toBe(true);
    unmount();
    render(<BequestSummary bequests={[wish({ value: 20 })]} ruleSet={reviewed} featureEnabled />);
    expect(screen.queryByTestId("bequest-scholar-questions")).toBeNull();
  });

  it("renders nothing without wishes", () => {
    const { container } = render(<BequestSummary bequests={[]} ruleSet={reviewed} featureEnabled />);
    expect(container.innerHTML).toBe("");
  });
});
