/** @vitest-environment jsdom */
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { defaultAmanahData } from "@/lib/domain/defaults";
import type { AmanahOrdnerData } from "@/lib/domain/types";
import { LETTER_MIN_CHARS, buildFamilienbrief, buildJanazah, buildNotfallkarte, dateForDocument, letterParagraphs } from "@/lib/documents/model";
import { documentUpdatedAt } from "@/lib/vorsorge/folder-tasks";
import { DocumentView, WalletCard } from "@/components/documents/document-view";

afterEach(cleanup);
const empty = (): AmanahOrdnerData => structuredClone(defaultAmanahData);

describe("P2.6 family letter", () => {
  it("is set as a letter: sender, salutation, paragraphs, closing, signature; no numbered sections", () => {
    const d = empty();
    d.emergencyCard = { ...d.emergencyCard, name: "Amina Rahman" };
    d.familyMessage = { ...d.familyMessage, letterGreeting: "Meine Lieben,", familyLetter: "Erster Absatz mit genug Text für einen Brief.\n\nZweiter Absatz.\nmit Zeilenumbruch", letterClosing: "In Liebe", letterSignature: "Eure Mutter", letterPlace: "Köln", letterBismillah: true };
    const model = buildFamilienbrief(d);
    expect(model.hasContent).toBe(true);
    expect(model.missing).toEqual([]);
    expect(model.letter).toMatchObject({ sender: "Amina Rahman", greeting: "Meine Lieben,", closing: "In Liebe", signature: "Eure Mutter", place: "Köln", bismillah: true });
    expect(model.letter!.paragraphs).toEqual(["Erster Absatz mit genug Text für einen Brief.", "Zweiter Absatz.\nmit Zeilenumbruch"]);
    render(<DocumentView model={model} createdAt={new Date("2026-11-18")} dataAsOf={null} />);
    const view = screen.getByTestId("document-view");
    expect(view.classList.contains("amanah-letter")).toBe(true);
    expect(view.querySelectorAll(".letter-body p")).toHaveLength(2);
    expect(view.querySelector(".letter-date")?.textContent).toBe("Köln, 18. November 2026");
    expect(view.querySelector(".letter-basmala")?.getAttribute("dir")).toBe("rtl");
    expect(view.querySelector(".doc-num")).toBeNull();
    expect(screen.getByTestId("doc-status").textContent).toContain("Kein rechtliches Dokument");
  });

  it("is only ready with a real text: empty, very short, without salutation or closing count as missing", () => {
    expect(buildFamilienbrief(empty()).hasContent).toBe(false);
    const d = empty();
    d.familyMessage = { ...d.familyMessage, familyLetter: "Kurz." };
    expect(buildFamilienbrief(d).missing).toEqual(["Der Brieftext ist noch sehr kurz", "Eine Anrede", "Schlussworte"]);
    d.familyMessage.familyLetter = "x".repeat(LETTER_MIN_CHARS);
    expect(buildFamilienbrief(d).missing).not.toContain("Der Brieftext ist noch sehr kurz");
    // The short summary alone is no letter.
    const s = empty();
    s.familyMessage = { ...s.familyMessage, keyWishesSummary: "Schnelle Bestattung." };
    expect(buildFamilienbrief(s).hasContent).toBe(false);
  });

  it("paragraphs: blank lines separate, Windows line ends work, empty ones are dropped", () => {
    expect(letterParagraphs("A\r\n\r\nB\n \n\nC")).toEqual(["A", "B", "C"]);
  });

  it("the printout date of the letter is the letter's own change date", () => {
    const d = empty();
    d.familyMessage = { ...d.familyMessage, letterUpdatedAt: "2026-11-10T10:00:00Z" };
    expect(documentUpdatedAt(d, "familienbrief")).toBe("2026-11-10T10:00:00Z");
  });
});

describe("P2.6 dates on documents", () => {
  it("prints complete dates and reports an unfinished one instead of printing it silently", () => {
    expect(dateForDocument("1962-07-03")).toEqual({ display: "03.07.1962", complete: true });
    expect(dateForDocument("03.07.")).toEqual({ display: "03.07.", complete: false });
    expect(dateForDocument("")).toEqual({ display: null, complete: true });
    const d = empty();
    d.emergencyCard = { ...d.emergencyCard, name: "A", birthDate: "03.07." };
    expect(buildNotfallkarte(d).warnings.join(" ")).toContain("Geburtsdatum ist unvollständig („03.07.“)");
  });

  it("names different birth dates in emergency card and Janazah wishes", () => {
    const d = empty();
    d.emergencyCard = { ...d.emergencyCard, birthDate: "1962-07-03" };
    d.janazahWishes = { ...d.janazahWishes, islamicBurialDesired: true, birthDate: "1962-04-09" };
    expect(buildJanazah(d).warnings.join(" ")).toContain("Notfallkarte 03.07.1962, Janazah-Wünsche 09.04.1962");
  });
});

describe("P2.6 fold card", () => {
  const long = (): AmanahOrdnerData => {
    const d = empty();
    d.emergencyCard = {
      ...d.emergencyCard,
      name: "Amina Fatima Rahman-Abdelrahman (أمينة رحمن)",
      birthDate: "1962-07-03",
      language: "Deutsch, Arabisch, Türkisch, Bosnisch",
      emergencyContact1: { name: "Yusuf Abdullah Rahman-Abdelrahman", phone: "+49 (0) 151 2345 6789", relation: "Sohn" },
      emergencyContact2: { name: "Leyla Öztürk-Yılmaz", phone: "0176 98765432", relation: "Nichte" },
      familyDoctor: "Gemeinschaftspraxis Dr. med. Berger und Dr. Yilmaz, Lindenstraße 4, 50825 Köln · 0221 445566",
      mosqueImam: "Imam Khalid, Al-Nur-Moschee Köln · 0221 778899",
      allergies: "Penicillin, Latex, Nüsse",
      medications: "Ramipril 5 mg morgens; Metformin 1000 mg morgens und abends; Marcumar nach Plan",
      illnesses: "Bluthochdruck; Typ-2-Diabetes; Vorhofflimmern",
    };
    return d;
  };

  it("keeps the full birth date, the name and both phone numbers; what does not fit is named, never cut", () => {
    const card = buildNotfallkarte(long(), { includeHealth: true }).card!;
    const all = [...card.front, ...card.back].map((l) => l.text);
    expect(all).toContain("geb. 03.07.1962");
    expect(all).toContain("+49 (0) 151 2345 6789");
    expect(all).toContain("0176 98765432");
    expect(all[0]).toContain("Amina Fatima Rahman-Abdelrahman");
    if (card.omitted > 0) expect(all).toContain("Weitere Angaben auf dem Notfallblatt (A4)");
  });

  it("renders two copies and no line clamp; the stylesheet keeps every card text at 9 pt or more", () => {
    render(<WalletCard model={buildNotfallkarte(long())} />);
    expect(screen.getByTestId("wallet-card").querySelectorAll(".doc-card")).toHaveLength(2);
    const css = readFileSync("src/app/globals.css", "utf8");
    expect(css).not.toMatch(/doc-card[^{]*\{[^}]*line-clamp/);
    for (const [, body] of css.matchAll(/\.doc-card[^{]*\{([^}]*)\}/g)) for (const m of body.matchAll(/font-size:\s*([\d.]+)pt/g)) expect(Number(m[1])).toBeGreaterThanOrEqual(9);
  });
});

describe("P2.6 print rules", () => {
  it("page 1 has no @page margin (no browser headers), later pages carry page numbers, red only for medicine", () => {
    const css = readFileSync("src/app/globals.css", "utf8");
    expect(css).toMatch(/@page amanah-doc:first\s*\{\s*margin:\s*0;/);
    expect(css).toContain('content: "Seite " counter(page) " von " counter(pages);');
    const redRules = [...css.matchAll(/([^{}]+)\{[^}]*var\(--doc-red\)[^}]*\}/g)].map((m) => m[1].trim());
    for (const selector of redRules) expect(selector, selector).toMatch(/critical|--doc-red:/);
  });
});
