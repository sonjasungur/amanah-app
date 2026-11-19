import { readFileSync } from "fs";
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
import { bequestFromDraft, bequestToDraft, parseGermanNumber, percentTotal, sanitizeBequests, validateBequestDraft, type BequestDraft } from "@/lib/testament/bequests";
import { PREPARATION_STEPS } from "@/lib/testament/steps";
import { SUNNI_NUCLEAR_FAMILY_V1 } from "@/lib/inheritance";
import PdfPage from "@/app/dashboard/pdf/page";
import VermoegenPage from "@/app/dashboard/vermoegen/page";
import { featureForRoute } from "@/lib/billing/plan-matrix";
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

  it("warns against secrets and offers printing only once something is listed", () => {
    render(<AssetOverview />);
    expect(screen.getByTestId("asset-overview").textContent).toContain("keine Kontonummern, PINs oder Passwörter");
    expect(screen.queryByTestId("asset-print")).toBeNull();
    fireEvent.change(screen.getByLabelText("Bezeichnung"), { target: { value: "Depot" } });
    fireEvent.click(screen.getByTestId("asset-add"));
    expect(screen.getByTestId("asset-print")).not.toBeNull();
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

  it("hides the page around it in print and suggests a file name that is no will", () => {
    useAmanahStore.setState({ assets: [asset()] });
    const titles: string[] = [];
    const print = vi.spyOn(window, "print").mockImplementation(() => void titles.push(document.title));
    document.title = "Seitentitel";
    render(<I18nProvider><VermoegenPage /></I18nProvider>);
    expect(screen.getByTestId("asset-overview").closest(".no-print")).not.toBeNull();
    expect(screen.getByTestId("asset-print-view").closest(".print-only")).not.toBeNull();
    fireEvent.click(screen.getByTestId("asset-print"));
    expect(print).toHaveBeenCalledOnce();
    expect(titles[0]).toBe("Vermögensübersicht – kein Testament");
    expect(document.title).toBe("Seitentitel");
    print.mockRestore();
  });

  it("is free in the plan matrix and only linked from the PDF page, which may carry a Plus hint", () => {
    const feature = featureForRoute("/dashboard/vermoegen");
    expect(feature?.id).toBe("asset_overview");
    expect(feature?.tier).toBe("free");
    expect(readFileSync("src/app/dashboard/vermoegen/page.tsx", "utf8")).not.toContain("PlusGate");
    render(<I18nProvider><PdfPage /></I18nProvider>);
    const card = screen.getByTestId("export-vermoegen");
    expect(card.querySelector("a")!.getAttribute("href")).toBe("/dashboard/vermoegen");
    expect(card.textContent).toContain("gehört nicht zu Vorsorge Plus");
    expect(screen.queryByTestId("asset-print-view")).toBeNull();
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

describe("editing a wish", () => {
  function Host({ initial }: { initial: BequestWish[] }) {
    const [items, setItems] = useState(initial);
    return (
      <>
        <BequestEditor bequests={items} onChange={setItems} />
        <output data-testid="stored">{JSON.stringify(items)}</output>
      </>
    );
  }
  const stored = (): BequestWish[] => JSON.parse(screen.getByTestId("stored").textContent!);

  it("loads a wish into the form and replaces it under the same id", () => {
    render(<Host initial={[wish({ value: 12.5, note: "Notiz" }), wish({ id: "b2", beneficiary: "Yusuf" })]} />);
    fireEvent.click(screen.getByRole("button", { name: "Wunsch für Aisha bearbeiten" }));
    expect((screen.getByLabelText("Anteil in Prozent") as HTMLInputElement).value).toBe("12,5");
    expect((screen.getByLabelText("Anmerkung (freiwillig)") as HTMLInputElement).value).toBe("Notiz");
    fireEvent.change(screen.getByLabelText("Für wen?"), { target: { value: "Fatima" } });
    fireEvent.click(screen.getByTestId("bequest-add"));
    expect(stored().map((b) => [b.id, b.beneficiary, b.value])).toEqual([["b1", "Fatima", 12.5], ["b2", "Yusuf", 10]]);
    expect(screen.queryByTestId("bequest-edit-cancel")).toBeNull();
  });

  it("keeps the wish on invalid input and on cancel", () => {
    render(<Host initial={[wish()]} />);
    fireEvent.click(screen.getByRole("button", { name: "Wunsch für Aisha bearbeiten" }));
    fireEvent.change(screen.getByLabelText("Anteil in Prozent"), { target: { value: "150" } });
    fireEvent.click(screen.getByTestId("bequest-add"));
    expect(screen.getByTestId("bequest-errors").textContent).toContain("über 100");
    expect(stored()[0].value).toBe(10);
    fireEvent.click(screen.getByTestId("bequest-edit-cancel"));
    expect(screen.queryByTestId("bequest-errors")).toBeNull();
    expect((screen.getByLabelText("Betrag in Euro") as HTMLInputElement).value).toBe("");
    expect(stored()).toEqual([wish()]);
  });

  it("removing the wish being edited ends the editing", () => {
    render(<Host initial={[wish()]} />);
    fireEvent.click(screen.getByRole("button", { name: "Wunsch für Aisha bearbeiten" }));
    fireEvent.click(screen.getByRole("button", { name: "Wunsch für Aisha entfernen" }));
    expect(stored()).toEqual([]);
    expect(screen.queryByTestId("bequest-edit-cancel")).toBeNull();
  });

  it("round-trips every kind through the form", () => {
    for (const b of [wish({ value: 33.3 }), wish({ kind: "amount", value: 1234567.5 }), wish({ kind: "item", value: undefined, item: "Goldkette" })]) {
      expect(validateBequestDraft(bequestToDraft(b))).toEqual([]);
      const back = bequestFromDraft(bequestToDraft(b), b.id);
      expect(back.value).toBe(b.value);
      expect(back.item).toBe(b.item);
    }
  });
});

describe("wording of the wishes", () => {
  it("says they are non-binding and promises no validity", () => {
    render(<BequestEditor bequests={[]} onChange={() => {}} />);
    const text = screen.getByTestId("bequest-non-binding").textContent!;
    expect(text).toContain("Unverbindliche Wünsche zur fachlichen Prüfung");
    expect(text).toContain("Damit wird nichts vermacht");
    expect(screen.getByTestId("bequest-editor").textContent).not.toMatch(/wirksam (ist|sind)|rechtsgültig|rechtssicher/i);
  });

  it("explains § 2087 BGB as soon as a percentage is involved, also in the summary", () => {
    render(<BequestEditor bequests={[]} onChange={() => {}} />);
    expect(screen.queryByTestId("bequest-percent-note")).toBeNull();
    fireEvent.change(screen.getByLabelText("Was?"), { target: { value: "percent" } });
    expect(screen.getByTestId("bequest-percent-note").textContent).toContain("§ 2087 BGB");
    render(<BequestSummary bequests={[wish()]} ruleSet={SUNNI_NUCLEAR_FAMILY_V1} featureEnabled />);
    expect(screen.getByTestId("bequest-summary").textContent).toContain("§ 2087 BGB");
  });

  it("gives no percentage hint for amounts or items", () => {
    render(<BequestSummary bequests={[wish({ kind: "amount", value: 100 })]} ruleSet={SUNNI_NUCLEAR_FAMILY_V1} featureEnabled />);
    expect(screen.queryByTestId("bequest-percent-note")).toBeNull();
  });
});

describe("the one-third question stays behind the scholar gate", () => {
  const over = [wish({ value: 40 })];
  const reviewed = { ...SUNNI_NUCLEAR_FAMILY_V1, reviewStatus: "scholar_reviewed" as const, reviewedBy: "Prüfgremium Test", reviewedAt: "2030-01-01" };

  it("is absent with the shipped rule set, even with the flag on", () => {
    render(<BequestSummary bequests={over} ruleSet={SUNNI_NUCLEAR_FAMILY_V1} featureEnabled />);
    expect(screen.getByTestId("bequest-summary").textContent).toContain("Unverbindliche Wünsche zur fachlichen Prüfung");
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
