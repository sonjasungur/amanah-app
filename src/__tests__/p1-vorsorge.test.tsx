/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { defaultAmanahData } from "@/lib/domain/defaults";
import { normalizeData } from "@/lib/domain/migration";
import type { AmanahOrdnerData, FamilyMember } from "@/lib/domain/types";
import { getAllAreaStates, getAreaState, getArea, AREA_STATUS_LABELS, REVIEW_AFTER_DAYS, changedAreas } from "@/lib/vorsorge/areas";
import { normalizeVorsorgeMeta } from "@/lib/vorsorge/meta";
import { activeLinks, linkPerson, removePerson, updatePerson, usagesOf } from "@/lib/vorsorge/people";
import { FLOW_STEPS, getVorsorgeNextStep, COMPLETION_PATH } from "@/lib/vorsorge/flow";
import { PACKAGE_ITEMS, buildPackage, defaultSelection } from "@/lib/vorsorge/emergency-package";
import { useAmanahStore } from "@/lib/store/use-amanah-store";
import { pickDataFields } from "@/lib/store/store-utils";
import { freeSectionsOf, notStoredSections } from "@/lib/server/folder-access";

const NOW = new Date("2026-11-17T12:00:00Z");
const base = (): AmanahOrdnerData => normalizeData(structuredClone(defaultAmanahData));
const apply = (data: AmanahOrdnerData, patch: Partial<AmanahOrdnerData>): AmanahOrdnerData => ({ ...data, ...patch });

const yusuf: FamilyMember = { id: "p1", name: "Yusuf Beispiel", relation: "Bruder / Schwester", relationType: "geschwister", phone: "0151 0001", roles: ["notfallkontakt", "vertrauensperson"] };

function complete(): AmanahOrdnerData {
  const d = base();
  d.familyMembers = [yusuf];
  d.emergencyCard = { ...d.emergencyCard, name: "Amina Beispiel", emergencyContact1: { name: "Yusuf Beispiel", phone: "0151 0001", relation: "Bruder" }, hasPatientenverfuegung: true, hasVorsorgevollmacht: false };
  d.medicalWishes = { ...d.medicalWishes, medicalWishes: "Keine künstliche Verlängerung ohne Aussicht" };
  d.powerOfAttorney = { ...d.powerOfAttorney, authorizedPerson: "Yusuf Beispiel" };
  d.janazahWishes = { ...d.janazahWishes, islamicBurialDesired: true, preferredMosque: "Beispiel-Moschee", burialGermany: true };
  d.documents = [
    { id: "d1", type: "patientenverfuegung", title: "Patientenverfügung", location: "Ordner Arbeitszimmer", status: "vorhanden" },
    { id: "d2", type: "vorsorgevollmacht", title: "Vorsorgevollmacht", location: "", status: "fehlt" },
    { id: "d3", type: "testament", title: "Testament", location: "", status: "fehlt" },
  ];
  d.assets = [{ id: "a1", type: "bank", description: "Girokonto Beispielbank" }];
  d.digitalLegacy = [{ id: "g1", type: "email", description: "E-Mail-Konto", locationHint: "Notfallbrief" }];
  return d;
}

describe("P1 areas and status", () => {
  it("a fresh folder has six areas, none started; defaults such as the language do not count as input", () => {
    const states = getAllAreaStates(base(), NOW);
    expect(states.map((s) => s.area.id)).toEqual(["notfall", "familie", "gesundheit", "janazah", "dokumente", "vermoegen"]);
    expect(states.every((s) => s.status === "nicht_begonnen")).toBe(true);
  });

  it("distinguishes begonnen, Angaben vollständig and prüfen", () => {
    const d = base();
    d.emergencyCard = { ...d.emergencyCard, name: "Amina" };
    expect(getAreaState(d, getArea("notfall"), NOW).status).toBe("begonnen");
    expect(getAreaState(d, getArea("notfall"), NOW).missing).toEqual(["Ein Notfallkontakt mit Telefonnummer"]);
    const full = complete();
    expect(getAllAreaStates(full, NOW).map((s) => s.status)).toEqual(["vollstaendig", "vollstaendig", "vollstaendig", "vollstaendig", "vollstaendig", "vollstaendig"]);
    const review = apply(full, { documents: full.documents.map((doc) => (doc.type === "testament" ? { ...doc, status: "pruefen" as const } : doc)) });
    const state = getAreaState(review, getArea("dokumente"), NOW);
    expect(state.status).toBe("pruefen");
    expect(state.reviewReasons[0]).toContain("prüfen");
  });

  it("flags a contradiction between emergency card and document list for review", () => {
    const d = complete();
    d.documents = d.documents.map((doc) => (doc.type === "patientenverfuegung" ? { ...doc, status: "fehlt" as const } : doc));
    expect(getAreaState(d, getArea("dokumente"), NOW).reviewReasons.join(" ")).toContain("Patientenverfügung");
  });

  it("asks to look again after a year without change", () => {
    const d = complete();
    const old = new Date(NOW.getTime() - (REVIEW_AFTER_DAYS + 1) * 86_400_000).toISOString();
    d.vorsorgeMeta = { ...d.vorsorgeMeta, areaUpdatedAt: { notfall: old } };
    expect(getAreaState(d, getArea("notfall"), NOW).status).toBe("pruefen");
  });

  it("labels never claim legal validity", () => {
    expect(Object.values(AREA_STATUS_LABELS)).toEqual(["Nicht begonnen", "Begonnen", "Angaben vollständig", "Prüfen"]);
    for (const label of Object.values(AREA_STATUS_LABELS)) expect(label).not.toMatch(/rechtssicher|gültig|wirksam|geordnet|fertig/i);
  });

  it("maps changed sections to areas", () => {
    const a = base();
    const b = apply(a, { burialPreference: { ...a.burialPreference, cityPlz: "34117" } });
    expect(changedAreas(a, b)).toEqual(["janazah"]);
  });
});

describe("P1 bookkeeping in the folder (no database migration)", () => {
  it("old folders without vorsorgeMeta load with an empty meta and keep all data", () => {
    const legacy = { ...structuredClone(defaultAmanahData), familyMembers: [yusuf] } as Record<string, unknown>;
    delete legacy.vorsorgeMeta;
    const loaded = normalizeData(legacy);
    expect(loaded.vorsorgeMeta).toEqual({ areaUpdatedAt: {}, flowStep: null, flowPausedAt: null, personLinks: {} });
    expect(loaded.familyMembers).toEqual([yusuf]);
  });

  it("drops unknown keys and wrong types from imported meta", () => {
    const meta = normalizeVorsorgeMeta({ areaUpdatedAt: { notfall: "2026-01-01T00:00:00Z", fremd: "x", familie: 5 }, flowStep: { x: 1 }, personLinks: { emergencyContact1: "p1", evil: "p2" }, extra: true });
    expect(meta).toEqual({ areaUpdatedAt: { notfall: "2026-01-01T00:00:00Z" }, flowStep: null, flowPausedAt: null, personLinks: { emergencyContact1: "p1" } });
  });

  it("meta is bookkeeping: a restricted save never reports it as lost content", () => {
    const before = base();
    const incoming = { vorsorgeMeta: { ...before.vorsorgeMeta, flowStep: "familie" } };
    expect(notStoredSections(before, incoming)).toEqual([]);
  });
});

describe("P1 people entered once", () => {
  it("links a person into the emergency card with phone and relation", () => {
    const d = apply(base(), { familyMembers: [yusuf] });
    const linked = apply(d, linkPerson(d, "emergencyContact1", "p1"));
    expect(linked.emergencyCard.emergencyContact1).toEqual({ name: "Yusuf Beispiel", phone: "0151 0001", relation: "Bruder / Schwester" });
    expect(usagesOf(linked, "p1")).toEqual(["emergencyContact1"]);
  });

  it("a change of the person appears everywhere the person is linked, without creating a second entry", () => {
    let d = apply(base(), { familyMembers: [yusuf] });
    d = apply(d, linkPerson(d, "emergencyContact1", "p1"));
    d = apply(d, linkPerson(d, "authorizedPerson", "p1"));
    d = apply(d, linkPerson(d, "janazahTrustedContact", "p1"));
    d = apply(d, updatePerson(d, { ...yusuf, name: "Yusuf B. Beispiel", phone: "0151 9999" }));
    expect(d.familyMembers).toHaveLength(1);
    expect(d.emergencyCard.emergencyContact1.name).toBe("Yusuf B. Beispiel");
    expect(d.emergencyCard.emergencyContact1.phone).toBe("0151 9999");
    expect(d.powerOfAttorney.authorizedPerson).toBe("Yusuf B. Beispiel");
    expect(d.janazahWishes.trustedContact).toBe("Yusuf B. Beispiel");
  });

  it("a field changed by hand is no longer overwritten by the person", () => {
    let d = apply(base(), { familyMembers: [yusuf] });
    d = apply(d, linkPerson(d, "authorizedPerson", "p1"));
    d = apply(d, { powerOfAttorney: { ...d.powerOfAttorney, authorizedPerson: "Notar-Kanzlei Beispiel" } });
    expect(activeLinks(d).authorizedPerson).toBeUndefined();
    d = apply(d, updatePerson(d, { ...yusuf, name: "Yusuf Neu" }));
    expect(d.powerOfAttorney.authorizedPerson).toBe("Notar-Kanzlei Beispiel");
  });

  it("removing a person keeps the text in every field and only drops the link", () => {
    let d = apply(base(), { familyMembers: [yusuf] });
    d = apply(d, linkPerson(d, "emergencyContact1", "p1"));
    d = apply(d, removePerson(d, "p1"));
    expect(d.familyMembers).toEqual([]);
    expect(d.emergencyCard.emergencyContact1.name).toBe("Yusuf Beispiel");
    expect(d.vorsorgeMeta.personLinks).toEqual({});
  });

  it("a trusted person is explicitly not a legal power of attorney", () => {
    const people = readFileSync(join(process.cwd(), "src/lib/vorsorge/people.ts"), "utf8");
    expect(people).toContain("Das ist keine rechtliche Vollmacht.");
  });
});

describe("P1 guided flow and next step", () => {
  it("has one path through all six areas without required steps", () => {
    expect(new Set(FLOW_STEPS.map((s) => s.area))).toEqual(new Set(["notfall", "familie", "gesundheit", "janazah", "dokumente", "vermoegen"]));
    expect(new Set(FLOW_STEPS.map((s) => s.id)).size).toBe(FLOW_STEPS.length);
  });

  it("next step: resume first, then review, then gaps, then the completion summary", () => {
    const d = base();
    expect(getVorsorgeNextStep(d, NOW)).toMatchObject({ kind: "area", cta: "Jetzt beginnen" });
    const paused = apply(d, { vorsorgeMeta: { ...d.vorsorgeMeta, flowStep: "vollmacht", flowPausedAt: NOW.toISOString() } });
    expect(getVorsorgeNextStep(paused, NOW)).toMatchObject({ kind: "resume", href: "/dashboard/vorsorge?schritt=vollmacht", cta: "Fortsetzen" });
    const full = complete();
    expect(getVorsorgeNextStep(full, NOW)).toMatchObject({ kind: "done", href: COMPLETION_PATH, title: "Deine Angaben sind vollständig erfasst" });
    const review = apply(full, { documents: full.documents.map((doc) => ({ ...doc, status: "pruefen" as const })) });
    expect(getVorsorgeNextStep(review, NOW).kind).toBe("review");
  });

  it("the completion page uses the careful wording and states the legal limits", () => {
    const page = readFileSync(join(process.cwd(), "src/app/dashboard/vorsorge/abschluss/page.tsx"), "utf8");
    expect(page).toContain("Deine Angaben sind vollständig erfasst.");
    expect(page).not.toContain("Deine Vorsorge ist geordnet");
    expect(page).toContain("Sie sind kein Testament, keine Vollmacht und keine");
  });
});

describe("P1 emergency package", () => {
  it("never preselects health, debts, assets or digital accounts", () => {
    const sensitive = PACKAGE_ITEMS.filter((i) => i.sensitive).map((i) => i.id);
    expect(sensitive).toEqual(["gesundheit", "schulden", "vermoegen", "digital"]);
    for (const id of sensitive) expect(defaultSelection().has(id)).toBe(false);
  });

  it("contains only selected items, and sensitive ones only after confirmation", () => {
    const d = complete();
    d.emergencyCard.allergies = "Penicillin";
    d.debtsAmanah = [{ id: "s1", type: "debt_owed", description: "Darlehen 500 €", person: "Onkel", priority: "high" }];
    const selected = new Set([...defaultSelection(), "gesundheit" as const, "schulden" as const]);
    const unconfirmed = buildPackage(d, selected, new Set());
    const text = JSON.stringify(unconfirmed);
    expect(text).not.toContain("Penicillin");
    expect(text).not.toContain("Darlehen");
    const confirmed = buildPackage(d, selected, new Set(["gesundheit" as const]));
    expect(JSON.stringify(confirmed)).toContain("Penicillin");
    expect(JSON.stringify(confirmed)).not.toContain("Darlehen");
  });

  it("keeps immediate emergency data apart from wishes for the time after death", () => {
    const pkg = buildPackage(complete(), defaultSelection(), new Set());
    expect(pkg.notfall.map((s) => s.id)).toEqual(["kontakte", "vollmacht", "dokumente"]);
    expect(pkg.todesfall.map((s) => s.id)).toEqual(["janazah"]);
  });

  it("the page states date, possible later changes, no legal effect and no online sharing", () => {
    const page = readFileSync(join(process.cwd(), "src/app/dashboard/notfallpaket/page.tsx"), "utf8");
    expect(page).toContain("Erstellt am");
    expect(page).toContain("Spätere Änderungen");
    expect(page).toContain("keine rechtliche Verfügung");
    expect(page).toContain("Es wird nichts verschickt oder online geteilt.");
    expect(page).not.toMatch(/fetch\(|navigator\.share|sendBeacon/);
  });
});

describe("P1 store: last change per area", () => {
  beforeEach(() => {
    useAmanahStore.setState({ ...structuredClone(defaultAmanahData), saveStatus: "idle", saveError: null });
  });

  it("stamps the area of an edit, but not loading or importing", () => {
    useAmanahStore.getState().importData({ ...structuredClone(defaultAmanahData), assets: [{ id: "a", type: "bank", description: "Konto" }] });
    expect(useAmanahStore.getState().vorsorgeMeta.areaUpdatedAt).toEqual({});
    useAmanahStore.getState().updateNested("emergencyCard", "name", "Amina");
    const stamped = useAmanahStore.getState().vorsorgeMeta.areaUpdatedAt;
    expect(Object.keys(stamped)).toEqual(["notfall"]);
    expect(pickDataFields(useAmanahStore.getState()).vorsorgeMeta.areaUpdatedAt.notfall).toBe(stamped.notfall);
  });
});

describe("P1 bookkeeping for accounts without Plus (billing enforced)", () => {
  it("keeps the pause point and the date of the free emergency-card area, but nothing about Plus content", () => {
    const existing = base();
    existing.vorsorgeMeta = { ...existing.vorsorgeMeta, areaUpdatedAt: { janazah: "2026-01-01T00:00:00.000Z" }, personLinks: { authorizedPerson: "old" } };
    const incoming = {
      vorsorgeMeta: {
        areaUpdatedAt: { notfall: "2026-11-17T10:00:00.000Z", janazah: "2026-11-17T10:00:00.000Z", vermoegen: "2026-11-17T10:00:00.000Z" },
        flowStep: "vollmacht",
        flowPausedAt: "2026-11-17T10:00:00.000Z",
        personLinks: { emergencyContact1: "p-new", authorizedPerson: "p-new" },
      },
    };
    const free = freeSectionsOf(incoming as never, existing);
    expect(free.vorsorgeMeta).toEqual({
      areaUpdatedAt: { notfall: "2026-11-17T10:00:00.000Z", janazah: "2026-01-01T00:00:00.000Z" },
      flowStep: "vollmacht",
      flowPausedAt: "2026-11-17T10:00:00.000Z",
      personLinks: { authorizedPerson: "old" },
    });
  });

  it("stores no Plus section along with it", () => {
    const free = freeSectionsOf({ vorsorgeMeta: base().vorsorgeMeta, familyMembers: [yusuf], janazahWishes: base().janazahWishes } as never, null);
    expect(Object.keys(free).sort()).toEqual(["vorsorgeMeta"]);
  });
});
