/** @vitest-environment jsdom */
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { defaultAmanahData } from "@/lib/domain/defaults";
import { demoAmanahData } from "@/lib/domain/demo-data";
import type { AmanahOrdnerData } from "@/lib/domain/types";
import { DOCUMENTS, buildErbprofil, buildJanazah, buildNotfallkarte, buildSchulden, docValue, documentFileTitle } from "@/lib/documents/model";
import { DocumentView } from "@/components/documents/document-view";

afterEach(cleanup);
const empty = (): AmanahOrdnerData => structuredClone(defaultAmanahData);
const text = (model: ReturnType<typeof buildNotfallkarte>) => JSON.stringify(model.sections);

describe("P2.2 document values", () => {
  it("keeps 'Nein', '0' and 'nicht angegeben' apart", () => {
    expect(docValue(false)).toBe("Nein");
    expect(docValue(true)).toBe("Ja");
    expect(docValue(0)).toBe("0");
    expect(docValue(null)).toBeNull();
    expect(docValue("   ")).toBeNull();
  });

  it("never prints English enum values such as 'no'", () => {
    const d = empty();
    d.janazahWishes = { ...d.janazahWishes, islamicBurialDesired: true, repatriation: "no", burialGermany: false };
    d.ghuslKafan = { ...d.ghuslKafan, familyFarewell: "conditional" };
    const t = text(buildJanazah(d));
    expect(t).toContain('"Überführung","value":"Nein"');
    expect(t).toContain('"Beisetzung in Deutschland","value":"Nein"');
    expect(t).toContain("Unter Bedingungen");
    expect(t).not.toMatch(/"value":"(no|yes|unsure|conditional)"/);
  });
});

describe("P2.2 empty and contradictory entries", () => {
  it("an empty folder offers no document as finished, and each one says what is missing", () => {
    for (const doc of DOCUMENTS) {
      const model = doc.build(empty());
      expect(model.hasContent, doc.id).toBe(false);
      expect(model.sections.every((s) => s.blocks.length > 0), doc.id).toBe(true);
    }
    expect(buildNotfallkarte(empty()).missing).toEqual(["Name", "Erster Notfallkontakt", "Telefonnummer des ersten Notfallkontakts"]);
    expect(buildSchulden(empty()).missing).toEqual(["Noch keine Einträge"]);
  });

  it("prints no empty rows: only what was entered", () => {
    const d = empty();
    d.emergencyCard = { ...d.emergencyCard, name: "Amina Beispiel" };
    const model = buildNotfallkarte(d);
    expect(model.hasContent).toBe(true);
    const t = text(model);
    expect(t).toContain("Amina Beispiel");
    expect(t).not.toContain("Kontakt 2");
    expect(t).not.toContain("—");
  });

  it("marks contradictions between emergency card and document list", () => {
    const d = empty();
    d.emergencyCard = { ...d.emergencyCard, name: "A", hasPatientenverfuegung: true };
    d.documents = [{ id: "x", type: "patientenverfuegung", title: "Patientenverfügung", location: "", status: "fehlt" }];
    expect(buildNotfallkarte(d).warnings[0]).toContain("Patientenverfügung");
  });

  it("shows 0 children only once the family part was filled in", () => {
    const d = empty();
    expect(text(buildErbprofil(d))).not.toContain("Söhne");
    d.inheritanceProfile = { ...d.inheritanceProfile, married: false };
    const t = text(buildErbprofil(d));
    expect(t).toContain('"Söhne","value":"0"');
    expect(t).toContain('"Verheiratet","value":"Nein"');
  });
});

describe("P2.2 health details and file names", () => {
  it("health details only with an explicit choice for this printout", () => {
    const d = empty();
    d.emergencyCard = { ...d.emergencyCard, name: "A", allergies: "Penicillin (Beispiel)" };
    expect(text(buildNotfallkarte(d))).not.toContain("Penicillin");
    expect(text(buildNotfallkarte(d, { includeHealth: true }))).toContain("Penicillin");
  });

  it("file names say what and when, never who", () => {
    const d = structuredClone(demoAmanahData);
    const name = documentFileTitle(buildNotfallkarte(d), new Date("2026-11-18T10:00:00Z"));
    expect(name).toBe("Amanah-Notfallkarte-2026-11-18");
    expect(name).not.toContain(d.emergencyCard.name.split(" ")[0]);
    expect(documentFileTitle(DOCUMENTS.find((x) => x.id === "erbprofil")!.build(d))).toMatch(/^Amanah-Erbprofil-fur-das-Gesprach-\d{4}-\d{2}-\d{2}$/);
  });
});

describe("P2.2 document view", () => {
  it("shows title, legal status, dates, missing details and no form controls", () => {
    const d = empty();
    d.emergencyCard = { ...d.emergencyCard, name: "Amina Beispiel" };
    render(<DocumentView model={buildNotfallkarte(d)} createdAt={new Date("2026-11-18")} dataAsOf="2026-11-17T10:00:00Z" />);
    const view = screen.getByTestId("document-view");
    expect(view.textContent).toContain("Notfallkarte");
    expect(view.textContent).toContain("Kein rechtliches Dokument");
    expect(view.textContent).toContain("Erstellt am 18.11.2026");
    expect(view.textContent).toContain("Stand der Angaben: 17.11.2026");
    expect(screen.getByTestId("doc-missing").textContent).toContain("Erster Notfallkontakt");
    expect(view.querySelectorAll("input, select, textarea, button, a").length).toBe(0);
    expect(view.textContent).not.toContain("Mein Wille");
  });
});
