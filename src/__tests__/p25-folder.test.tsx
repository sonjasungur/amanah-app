/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { defaultAmanahData } from "@/lib/domain/defaults";
import { demoAmanahData } from "@/lib/domain/demo-data";
import type { AmanahOrdnerData } from "@/lib/domain/types";
import { documentUpdatedAt, folderTasks, printoutStates } from "@/lib/vorsorge/folder-tasks";
import { useAmanahStore } from "@/lib/store/use-amanah-store";
import { I18nProvider } from "@/lib/i18n/context";
import PdfPage from "@/app/dashboard/pdf/page";

afterEach(cleanup);
const empty = (): AmanahOrdnerData => structuredClone(defaultAmanahData);
const NOW = new Date("2026-11-18T12:00:00Z");

describe("P2.5-C open tasks", () => {
  it("an empty folder lists the areas to start and the legal documents, but no review yet", () => {
    const tasks = folderTasks(empty(), NOW);
    expect(tasks.filter((t) => t.kind === "bereich")).toHaveLength(6);
    expect(tasks.filter((t) => t.kind === "dokument").map((t) => t.title)).toEqual(["Patientenverfügung", "Vorsorgevollmacht", "Betreuungsverfügung", "Testament"]);
    expect(tasks.some((t) => t.kind === "ueberpruefung")).toBe(false);
  });

  it("names contradictions, outdated areas, missing places and a missing review", () => {
    const d = empty();
    d.emergencyCard = { ...d.emergencyCard, name: "A", hasPatientenverfuegung: true, emergencyContact1: { name: "B", phone: "1", relation: "" } };
    d.documents = [
      { id: "1", type: "patientenverfuegung", title: "PV", location: "", status: "fehlt" },
      { id: "2", type: "testament", title: "T", location: "", status: "vorhanden" },
    ];
    d.vorsorgeMeta = { ...d.vorsorgeMeta, areaUpdatedAt: { notfall: "2025-01-01T00:00:00Z" } };
    const tasks = folderTasks(d, NOW);
    expect(tasks.find((t) => t.kind === "widerspruch")?.detail).toContain("Patientenverfügung");
    expect(tasks.find((t) => t.kind === "aktualitaet")?.title).toContain("Notfallkarte");
    expect(tasks.find((t) => t.title === "Testament")?.detail).toContain("Aufbewahrungsort fehlt");
    expect(tasks.find((t) => t.kind === "ueberpruefung")?.title).toContain("noch nie");
    // No task claims legal effect.
    expect(JSON.stringify(tasks)).not.toMatch(/gültig|rechtssicher|wirksam/);
  });

  it("a recent review removes the review task; an old one brings it back", () => {
    const d = structuredClone(demoAmanahData);
    d.vorsorgeMeta = { ...d.vorsorgeMeta, reviewedAt: "2026-10-01T00:00:00Z" };
    expect(folderTasks(d, NOW).some((t) => t.kind === "ueberpruefung")).toBe(false);
    d.vorsorgeMeta.reviewedAt = "2025-06-01T00:00:00Z";
    expect(folderTasks(d, NOW).find((t) => t.kind === "ueberpruefung")?.title).toContain("über einem Jahr");
  });
});

describe("P2.5-C printouts", () => {
  it("each printout shows the latest change of the areas it draws from", () => {
    const d = structuredClone(demoAmanahData);
    d.vorsorgeMeta = { ...d.vorsorgeMeta, areaUpdatedAt: { notfall: "2026-11-01T10:00:00Z", janazah: "2026-11-10T10:00:00Z", vermoegen: "invalid" } };
    expect(documentUpdatedAt(d, "notfallkarte")).toBe("2026-11-01T10:00:00Z");
    expect(documentUpdatedAt(d, "gesamt")).toBe("2026-11-10T10:00:00Z");
    expect(documentUpdatedAt(d, "vermoegen")).toBeNull();
    const states = printoutStates(empty());
    expect(states.every((s) => !s.ready && s.updatedAt === null)).toBe(true);
  });
});

describe("P2.5-C page", () => {
  beforeEach(() => useAmanahStore.setState({ ...structuredClone(demoAmanahData), lastSaved: "2026-11-18T09:30:00Z" }));

  it("shows folder state, open tasks, originals and printouts; no file upload", () => {
    const { container } = render(<I18nProvider><PdfPage /></I18nProvider>);
    expect(screen.getAllByRole("heading", { level: 1 })[0].textContent).toContain("Meine Dokumente");
    expect(screen.getByTestId("folder-last-saved").textContent).toMatch(/18\.11\.2026/);
    expect(screen.getByTestId("folder-reviewed").textContent).toBe("Noch nie bestätigt");
    expect(screen.getByTestId("folder-tasks").textContent).toContain("Testament");
    expect(screen.getByTestId("folder-originals").textContent).toContain("Patientenverfügung");
    expect(screen.getByTestId("folder-originals").textContent).toContain("Dateien werden nicht hochgeladen");
    expect(screen.getByTestId("printout-meta-notfallkarte")).toBeTruthy();
    expect(container.querySelector('input[type="file"]')).toBeNull();
  });
});
