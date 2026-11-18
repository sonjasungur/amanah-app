/** @vitest-environment jsdom */
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { defaultAmanahData } from "@/lib/domain/defaults";
import { demoAmanahData } from "@/lib/domain/demo-data";
import type { AmanahOrdnerData } from "@/lib/domain/types";
import { DOCUMENTS, buildGesamt, buildJanazah, buildLeitfaden, buildNotfallinfo, buildNotfallkarte } from "@/lib/documents/model";
import { readFileSync } from "node:fs";
import { DEFAULT_DOC_VARIANT, DOCUMENT_VARIANTS, DocumentView, WalletCard } from "@/components/documents/document-view";

afterEach(cleanup);
const empty = (): AmanahOrdnerData => structuredClone(defaultAmanahData);
const demo = (): AmanahOrdnerData => {
  const d = structuredClone(demoAmanahData);
  d.documents = d.documents.map((x) => ({ ...x, status: "vorhanden" as const }));
  return d;
};

describe("P2.5-B document structure", () => {
  it("Janazah wishes read as guidance: contacts, next steps and open questions, in this order", () => {
    const titles = buildJanazah(demo()).sections.map((s) => s.title);
    expect(titles).toEqual([
      "Das Wichtigste zuerst",
      "Wen die Familie ansprechen soll",
      "Ghusl und Kafan",
      "Janazah-Gebet",
      "Bestattung oder Überführung",
      "Persönliche Wünsche und Nachricht",
      "Nächste Schritte für die Familie",
      "Offen und zu klären",
    ]);
    const contacts = buildJanazah(demo()).sections[1].blocks.find((b) => b.kind === "contacts");
    expect(contacts && contacts.kind === "contacts" && contacts.items.map((c) => c.role)).toContain("Bestatter");
  });

  it("derived parts (steps, open questions, key message) never make an empty document printable", () => {
    for (const doc of DOCUMENTS) {
      const model = doc.build(empty());
      expect(model.hasContent, doc.id).toBe(false);
      expect(model.keyMessage, doc.id).toBeUndefined();
      expect(model.sections.map((s) => s.title), doc.id).not.toContain("Nächste Schritte für die Familie");
      expect(model.sections.map((s) => s.title), doc.id).not.toContain("Aufgaben für die Familie");
    }
  });

  it("the complete overview has a cover with contents and ten parts, legal labels kept", () => {
    const model = buildGesamt(demo());
    expect(model.cover).toBe(true);
    expect(model.sections.map((s) => s.title)).toEqual([
      "Persönliche Übersicht",
      "Notfallkontakte",
      "Medizinische Informationen",
      "Dokumente und Aufbewahrungsorte",
      "Vollmacht und Betreuung: meine Angaben",
      "Janazah-Wünsche",
      "Vermögen, Schulden und digitaler Nachlass",
      "Persönliche Worte an die Familie",
      "Rechtlich noch zu klären",
      "Aufgaben für die Familie",
    ]);
    const text = JSON.stringify(model.sections);
    for (const label of ["(keine Patientenverfügung)", "(keine Vollmacht)", "(kein Testament)", "Formfragen klärt ein Anwalt oder Notar."]) expect(text).toContain(label);
    expect(model.status).toContain("keine Betreuungsverfügung");
    // Health details only after the explicit choice; otherwise the overview says they are left out.
    expect(text).not.toContain("Metformin");
    expect(text).toContain("bewusst nicht enthalten");
    expect(JSON.stringify(buildGesamt(demo(), { includeHealth: true }).sections)).toContain("Metformin");
  });

  it("names every person once in the emergency information", () => {
    const d = demo();
    d.familyMembers = [{ id: "1", name: "Fatima Demo", relation: "Ehepartnerin", roles: ["notfallkontakt"] }, { id: "2", name: "Yusuf Demo", relation: "Sohn" }];
    const text = JSON.stringify(buildNotfallinfo(d).sections);
    expect(text.match(/Fatima Demo/g)?.length).toBe(1);
    expect(text).toContain("Yusuf Demo");
  });

  it("the guide is ordered by time and keeps 112 first", () => {
    const model = buildLeitfaden(demo());
    expect(model.sections[0].title).toBe("Sofort: anrufen");
    expect(model.keyMessage).toContain("Notruf 112");
    expect(model.sections.map((s) => s.title)).toContain("In den Wochen danach");
  });
});

describe("P2.5-B wallet card", () => {
  it("is a fold card in two copies; documents only as 'Vorhanden', health only on request", () => {
    const d = demo();
    d.documents = [{ id: "1", type: "patientenverfuegung", title: "Patientenverfügung", location: "Schrank links, Ordner Vorsorge", status: "vorhanden" }];
    const card = buildNotfallkarte(d).card!;
    const text = (c: typeof card) => JSON.stringify([...c.front, ...c.back]);
    expect(text(card)).toContain("Patientenverfügung: Vorhanden · Vorsorgevollmacht: Vorhanden");
    expect(text(card)).not.toContain("Medikamente");
    expect(text(buildNotfallkarte(d, { includeHealth: true }).card!)).toContain("Medikamente");
    render(<WalletCard model={buildNotfallkarte(d)} />);
    const view = screen.getByTestId("wallet-card");
    expect(view.querySelectorAll(".doc-card")).toHaveLength(2);
    expect(view.textContent).toContain("Notruf 112");
    expect(view.textContent).not.toContain("Schrank links");
    expect(view.textContent).toContain("Medizinische Angaben: siehe Notfallblatt");
  });

  it("only the emergency card has a card", () => {
    for (const doc of DOCUMENTS) expect(Boolean(doc.build(demo()).card), doc.id).toBe(doc.id === "notfallkarte");
  });
});

describe("P2.5-B view", () => {
  it("numbers sections, shows the key message once and repeats the identity in the page head", () => {
    render(<DocumentView model={buildNotfallinfo(demo())} createdAt={new Date("2026-11-18")} dataAsOf={null} />);
    const view = screen.getByTestId("document-view");
    expect(view.getAttribute("data-doc-variant")).toBe(DEFAULT_DOC_VARIANT);
    expect(screen.getAllByTestId("doc-key-message")).toHaveLength(1);
    expect(view.querySelector("thead")?.textContent).toContain("Ahmed Demo");
    expect([...view.querySelectorAll(".doc-num")].map((n) => n.textContent)).toEqual(["1", "2", "3", "4", "5"].slice(0, view.querySelectorAll(".doc-section").length));
    expect(view.querySelectorAll("input, select, textarea, button, a").length).toBe(0);
  });

  it("an overview without document places leaves that part out instead of printing it empty", () => {
    const d = demo();
    d.documents = [];
    expect(buildGesamt(d).sections.map((s) => s.title)).not.toContain("Dokumente und Aufbewahrungsorte");
  });

  it("the overview shows its contents on the cover, without links", () => {
    render(<DocumentView model={buildGesamt(demo())} createdAt={new Date("2026-11-18")} dataAsOf={null} />);
    const toc = screen.getByRole("navigation", { name: "Inhalt" });
    expect(toc.querySelectorAll("li")).toHaveLength(10);
    expect(toc.querySelectorAll("a")).toHaveLength(0);
  });
});

describe("P2.5 owner decision: design per document and card type size", () => {
  it("A for quick emergency documents, B for Janazah, letter and the complete overview", () => {
    expect(DOCUMENT_VARIANTS).toMatchObject({ notfallkarte: "klinisch", notfallinfo: "klinisch", leitfaden: "klinisch", janazah: "editorial", familienbrief: "editorial", gesamt: "editorial" });
    for (const doc of DOCUMENTS) expect(DOCUMENT_VARIANTS[doc.id], doc.id).toMatch(/^(klinisch|editorial)$/);
    render(<DocumentView model={buildGesamt(demo())} createdAt={new Date("2026-11-18")} dataAsOf={null} />);
    expect(screen.getByTestId("document-view").getAttribute("data-doc-variant")).toBe("editorial");
    cleanup();
    render(<WalletCard model={buildNotfallkarte(demo())} />);
    expect(screen.getByTestId("wallet-card").getAttribute("data-doc-variant")).toBe("klinisch");
  });

  it("no text on the fold card is set below 9 pt", () => {
    const css = readFileSync("src/app/globals.css", "utf8");
    const cardRules = [...css.matchAll(/([^{}]*\.doc-card[^{}]*)\{([^}]*)\}/g)];
    expect(cardRules.length).toBeGreaterThan(5);
    for (const [, selector, body] of cardRules) {
      for (const m of body.matchAll(/font-size:\s*([\d.]+)pt/g)) expect(Number(m[1]), selector.trim()).toBeGreaterThanOrEqual(9);
    }
  });
});
