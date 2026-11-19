/** @vitest-environment jsdom */
/**
 * P2.6, F1: one calendar check for input, saving and documents. An unfinished or impossible birth date
 * is never stored from the field, never printed on card or sheet, and always named for correction.
 */
import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { defaultAmanahData } from "@/lib/domain/defaults";
import type { AmanahOrdnerData } from "@/lib/domain/types";
import { buildGesamt, buildJanazah, buildLeitfaden, buildNotfallinfo, buildNotfallkarte, dateForDocument } from "@/lib/documents/model";
import { checkBirthDate, storableDate, toIsoDate } from "@/lib/utils/date-input";
import { DateInput } from "@/components/ui/input";
import { saveBarState } from "@/components/storage/save-bar";
import { useFieldCorrections, withDateDrafts } from "@/lib/store/field-corrections";
import { buildPackage, defaultSelection } from "@/lib/vorsorge/emergency-package";

afterEach(() => {
  cleanup();
  useFieldCorrections.setState({ open: {}, discarded: {}, focusKey: null });
  sessionStorage.clear();
});
const empty = (): AmanahOrdnerData => structuredClone(defaultAmanahData);
const withBirth = (birthDate: string) => {
  const d = empty();
  d.emergencyCard = { ...d.emergencyCard, name: "Amina Beispiel", birthDate, emergencyContact1: { name: "Yusuf", phone: "0170 0000000", relation: "Sohn" } };
  return d;
};
const printedText = (d: AmanahOrdnerData) => JSON.stringify(buildNotfallkarte(d)) + JSON.stringify(buildNotfallinfo(d)) + JSON.stringify(buildGesamt(d)) + JSON.stringify(buildLeitfaden(d));

describe("F1: one calendar check", () => {
  it.each([
    ["29.02.2024", "2024-02-29"],
    ["29.02.2000", "2000-02-29"],
    ["28.02.1962", "1962-02-28"],
    ["31.12.1962", "1962-12-31"],
    ["3.7.1962", "1962-07-03"],
    ["1962-07-03", "1962-07-03"],
  ])("accepts the real date %s", (text, iso) => {
    expect(toIsoDate(text)).toBe(iso);
    expect(storableDate(text)).toBe(iso);
    expect(checkBirthDate(text, new Date("2026-11-19"))).toBe("ok");
    expect(dateForDocument(text)).toMatchObject({ display: `${iso.slice(8)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`, problem: null });
  });

  it.each([
    ["31.02.1962", "invalid"],
    ["29.02.2023", "invalid"],
    ["29.02.1900", "invalid"],
    ["30.02.2024", "invalid"],
    ["31.04.1962", "invalid"],
    ["00.01.1962", "invalid"],
    ["15.13.1962", "invalid"],
    ["1962-02-31", "invalid"],
    ["03.07.", "incomplete"],
    ["03.07.196", "incomplete"],
    ["ca. 1980", "incomplete"],
  ])("rejects %s (%s) for field, saving and documents alike", (text, kind) => {
    expect(storableDate(text)).toBeNull();
    expect(checkBirthDate(text)).toBe(kind);
    expect(dateForDocument(text)).toMatchObject({ display: null, complete: false, problem: kind });
    expect(dateForDocument(text).entered).toBe(text.includes("-") ? "31.02.1962" : text);
  });

  it("keeps a deliberately empty date empty, without warning", () => {
    expect(storableDate("")).toBe("");
    expect(storableDate("   ")).toBe("");
    const d = withBirth("");
    expect(buildNotfallkarte(d).warnings.join(" ")).not.toMatch(/Geburtsdatum/);
    expect(buildNotfallkarte(d).card!.front.some((l) => l.text.startsWith("geb."))).toBe(false);
  });
});

describe("F1: an impossible stored date never reaches paper unwarned", () => {
  it("is neither on the fold card nor on any sheet, and the document asks for a correction", () => {
    const d = withBirth("31.02.1962");
    const karte = buildNotfallkarte(d);
    expect(karte.card!.front.map((l) => l.text).join(" ")).not.toContain("31.02.1962");
    expect(printedText(d)).not.toMatch(/geb\. 31\.02|geboren am 31\.02|"value":"31\.02\.1962"/);
    expect(karte.warnings.join(" ")).toContain("Geburtsdatum „31.02.1962“ gibt es nicht und wird deshalb nicht als Geburtsdatum gedruckt. Bitte in der Notfallkarte korrigieren.");
    expect(buildNotfallinfo(d).warnings.join(" ")).toContain("gibt es nicht");
  });

  it("is left out of the emergency package, a valid date is kept", () => {
    const rows = (d: AmanahOrdnerData) => JSON.stringify(buildPackage(d, defaultSelection(), new Set()));
    expect(rows(withBirth("31.02.1962"))).not.toContain("31.02.1962");
    expect(rows(withBirth("1962-07-03"))).toContain("03.07.1962");
  });

  it("a valid date is printed in full on card and sheet", () => {
    const d = withBirth("1962-07-03");
    const karte = buildNotfallkarte(d);
    expect(karte.card!.front.map((l) => l.text)).toContain("geb. 03.07.1962");
    expect(JSON.stringify(karte.sections)).toContain("03.07.1962");
    expect(karte.warnings.join(" ")).not.toMatch(/Geburtsdatum/);
  });

  it("names an impossible date in the Janazah wishes as well", () => {
    const d = withBirth("1962-07-03");
    d.janazahWishes = { ...d.janazahWishes, islamicBurialDesired: true, birthDate: "29.02.1963" };
    const j = buildJanazah(d);
    expect(j.warnings.join(" ")).toContain("Geburtsdatum „29.02.1963“ gibt es nicht und wird deshalb nicht als Geburtsdatum gedruckt. Bitte in den Janazah-Wünschen korrigieren.");
    expect(j.identity).toBe("Amina Beispiel, geboren am 03.07.1962");
  });
});

describe("F1: the field stores only real dates and marks errors clearly", () => {
  const setup = (value = "") => {
    const values: string[] = [];
    render(<DateInput id="geb" value={value} onValueChange={(v) => values.push(v)} testId="geb" birth label="Geburtsdatum" />);
    return { values, input: screen.getByRole("textbox") as HTMLInputElement };
  };

  it("hands on a valid date and a leap day, but never 31.02. or an unfinished date", () => {
    const { values, input } = setup();
    fireEvent.change(input, { target: { value: "31021962" } });
    fireEvent.change(input, { target: { value: "0307" } });
    expect(values).toEqual([]);
    fireEvent.change(input, { target: { value: "29022024" } });
    expect(values).toEqual(["2024-02-29"]);
    fireEvent.change(input, { target: { value: "29022023" } });
    expect(values).toEqual(["2024-02-29"]);
  });

  it("a deliberately emptied field is stored as empty", () => {
    const { values, input } = setup("1962-07-03");
    fireEvent.change(input, { target: { value: "" } });
    expect(values).toEqual([""]);
    fireEvent.blur(input);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(useFieldCorrections.getState().open).toEqual({});
  });

  it("an impossible date: the owner's hint, icon, thick border, not stored, reported as open draft", () => {
    const { input } = setup("1962-07-03");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "31.02.1962" } });
    fireEvent.blur(input);
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("Bitte gib ein gültiges Geburtsdatum ein");
    expect(alert.textContent).toContain("Noch nicht gespeichert.");
    // While the draft is open the old date is not shown again.
    expect(alert.textContent).not.toContain("03.07.1962");
    expect(input.value).toBe("31.02.1962");
    expect(alert.querySelector("svg")).not.toBeNull();
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.className).toContain("border-[3px]");
    expect(useFieldCorrections.getState().open.geb).toMatchObject({ text: "31.02.1962", message: "Bitte gib ein gültiges Geburtsdatum ein", label: "Geburtsdatum" });
    // Correcting it clears the draft.
    act(() => {
      fireEvent.change(input, { target: { value: "03.07.1962" } });
    });
    expect(useFieldCorrections.getState().open).toEqual({});
  });

  it("an unfinished date says so", () => {
    const { input } = setup("1962-07-03");
    fireEvent.change(input, { target: { value: "03.07." } });
    fireEvent.blur(input);
    expect(input.value).toBe("03.07.");
    expect(screen.getByRole("alert").textContent).toContain("Geburtsdatum noch unvollständig");
  });

  it("only an explicit discard brings the stored value back", () => {
    const { values, input } = setup("1962-07-03");
    fireEvent.change(input, { target: { value: "03.07." } });
    fireEvent.blur(input);
    act(() => {
      fireEvent.click(screen.getByTestId("geb-discard"));
    });
    expect(input.value).toBe("03.07.1962");
    expect(screen.queryByRole("alert")).toBeNull();
    expect(useFieldCorrections.getState().open).toEqual({});
    expect(values).toEqual([]);
  });

  it("with a stable key the draft survives leaving the page and is shown again on return", () => {
    const { unmount } = render(<DateInput value="1962-07-03" onValueChange={() => undefined} draftKey="emergencyCard.birthDate" path="emergencyCard.birthDate" birth label="Geburtsdatum" testId="k" />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "03.07." } });
    unmount();
    expect(useFieldCorrections.getState().open["emergencyCard.birthDate"]?.text).toBe("03.07.");
    render(<DateInput value="1962-07-03" onValueChange={() => undefined} draftKey="emergencyCard.birthDate" path="emergencyCard.birthDate" birth label="Geburtsdatum" testId="k" />);
    expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe("03.07.");
    expect(screen.getByRole("alert").textContent).toContain("Geburtsdatum noch unvollständig");
    // Discarded from a notice elsewhere: the mounted field shows the stored value again.
    act(() => useFieldCorrections.getState().discard("emergencyCard.birthDate"));
    expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe("03.07.1962");
  });

  it("an open draft keeps the old date out of every document", () => {
    const d = withBirth("1962-07-03");
    const shown = withDateDrafts(d, { "emergencyCard.birthDate": { text: "03.07.", message: "Geburtsdatum noch unvollständig", label: "Geburtsdatum", path: "emergencyCard.birthDate", href: "/dashboard/notfallkarte" } });
    expect(printedText(shown)).not.toContain("03.07.1962");
    expect(buildNotfallkarte(shown).warnings.join(" ")).toContain("unvollständig");
    expect(d.emergencyCard.birthDate).toBe("1962-07-03");
  });

  it("an impossible date already stored is shown for correction at once (no draft: nothing to discard)", () => {
    setup("31.02.1962");
    expect(screen.getByRole("alert").textContent).toContain("Bitte gib ein gültiges Geburtsdatum ein");
    expect(screen.queryByTestId("geb-discard")).toBeNull();
  });

  it("the save bar does not report 'saved' while a date is open", () => {
    expect(saveBarState("saved", "2026-11-19T10:00:00Z", 1)).toBe("korrektur");
    expect(saveBarState("saved", "2026-11-19T10:00:00Z", 0)).toBe("gespeichert");
    expect(saveBarState("error", null, 1)).toBe("fehlgeschlagen");
  });
});
