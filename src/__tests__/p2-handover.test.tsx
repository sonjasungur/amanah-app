/** @vitest-environment jsdom */
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { defaultAmanahData } from "@/lib/domain/defaults";
import type { AmanahOrdnerData } from "@/lib/domain/types";
import { HANDOVER_LABELS, handoverSummary, legalDocumentStates } from "@/lib/vorsorge/handover";
import { buildLeitfaden } from "@/lib/documents/model";
import { useAmanahStore } from "@/lib/store/use-amanah-store";
import AbschlussPage from "@/app/dashboard/vorsorge/abschluss/page";

afterEach(cleanup);
const empty = (): AmanahOrdnerData => structuredClone(defaultAmanahData);

describe("P2.4 handover status", () => {
  it("open areas are 'Noch offen'; complete ones add 'Fachliche Prüfung empfohlen' with whom to ask", () => {
    const d = empty();
    d.medicalWishes = { ...d.medicalWishes, medicalWishes: "Wünsche (Beispiel)" };
    d.powerOfAttorney = { ...d.powerOfAttorney, authorizedPerson: "Yusuf" };
    d.emergencyCard = { ...d.emergencyCard, hasPatientenverfuegung: true, hasVorsorgevollmacht: false };
    const s = handoverSummary(d);
    const health = s.areas.find((a) => a.state.area.id === "gesundheit")!;
    expect(health.statuses).toEqual(["angaben_vollstaendig", "fachpruefung_empfohlen"]);
    expect(health.expert).toContain("Anwalt oder Notar");
    expect(s.areas.find((a) => a.state.area.id === "vermoegen")!.statuses).toEqual(["offen"]);
  });

  it("never claims a release to a person while that does not exist", () => {
    const s = handoverSummary(empty());
    expect(s.areas.flatMap((a) => a.statuses)).not.toContain("freigegeben");
    expect(HANDOVER_LABELS.freigegeben).toBe("Für benannte Person freigegeben");
  });

  it("a legal document counts as 'vorhanden und hinterlegt' only with its place", () => {
    const d = empty();
    d.documents = [
      { id: "1", type: "testament", title: "Testament", location: "Amtsgericht (Beispiel)", status: "vorhanden" },
      { id: "2", type: "vorsorgevollmacht", title: "Vorsorgevollmacht", location: "", status: "vorhanden" },
    ];
    const states = legalDocumentStates(d);
    expect(states.find((x) => x.title === "Testament")!.label).toBe("Dokument vorhanden und Aufbewahrungsort hinterlegt");
    expect(states.find((x) => x.title === "Vorsorgevollmacht")!.label).toContain("Aufbewahrungsort fehlt");
    expect(states.find((x) => x.title === "Patientenverfügung")!.label).toBe("Nicht angegeben");
  });
});

describe("P2.4 family guide", () => {
  it("is not offered empty, and with contacts names 112, people and places", () => {
    expect(buildLeitfaden(empty()).hasContent).toBe(false);
    const d = empty();
    d.emergencyCard = { ...d.emergencyCard, emergencyContact1: { name: "Yusuf Beispiel", phone: "0151 0001", relation: "Bruder" } };
    d.documents = [{ id: "1", type: "testament", title: "Testament", location: "Ordner (Beispiel)", status: "vorhanden" }];
    const text = JSON.stringify(buildLeitfaden(d));
    expect(text).toContain("Notruf 112");
    expect(text).toContain("Yusuf Beispiel");
    expect(text).toContain("Ordner (Beispiel)");
    expect(text).toContain("Keine Rechtsberatung");
    expect(text).not.toMatch(/handelt nur mit|gültigen Vollmacht/);
  });
});

describe("P2.4 completion page", () => {
  beforeEach(() => useAmanahStore.setState({ ...structuredClone(defaultAmanahData), saveStatus: "idle" }));

  it("explains what is informative, what needs its own legal form, who to tell, and records the review date", () => {
    render(<AbschlussPage />);
    expect(screen.getByTestId("completion-header").textContent).toContain("was noch fehlt");
    expect(screen.getByTestId("completion-informative").textContent).toContain("keine rechtliche Wirkung");
    expect(screen.getByTestId("completion-access").textContent).toContain("noch nicht verfügbar");
    expect(screen.getByTestId("completion-reviewed").textContent).toContain("noch nicht als überprüft");
    fireEvent.click(screen.getByTestId("completion-mark-reviewed"));
    expect(useAmanahStore.getState().vorsorgeMeta.reviewedAt).toBeTruthy();
    expect(screen.getByTestId("completion-reviewed").textContent).toMatch(/zuletzt am \d{2}\.\d{2}\.\d{4}/);
  });

  it("never says the legal side is finished", () => {
    const src = readFileSync("src/app/dashboard/vorsorge/abschluss/page.tsx", "utf8");
    expect(src).toContain("Deine Vorsorge ist vorbereitet – was passiert jetzt?");
    expect(src).toContain("rechtlich wirksam ist dadurch noch nichts");
    expect(src).not.toMatch(/rechtssicher|rechtsgültig|abgeschlossen ist/);
  });
});
