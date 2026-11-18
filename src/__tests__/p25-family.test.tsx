/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { defaultAmanahData } from "@/lib/domain/defaults";
import type { AmanahOrdnerData, FamilyTalk } from "@/lib/domain/types";
import { normalizeData, normalizeFamilyConversation } from "@/lib/domain/migration";
import { familyReadiness } from "@/lib/vorsorge/family-readiness";
import { buildLeitfaden } from "@/lib/documents/model";
import { useAmanahStore } from "@/lib/store/use-amanah-store";
import { LEGACY_FAMILY_CONVERSATION_ITEM, familyConversationActions, importLegacyConversation } from "@/lib/familiengespraech/store";
import AbschlussPage from "@/app/dashboard/vorsorge/abschluss/page";

const remote = vi.hoisted(() => ({ active: false, known: false }));
vi.mock("@/lib/storage/store-sync", async (orig) => ({
  ...(await orig<typeof import("@/lib/storage/store-sync")>()),
  isRemotePersistenceActive: () => remote.active,
  isAccountFolderKnown: () => remote.known,
}));

afterEach(cleanup);
const empty = (): AmanahOrdnerData => structuredClone(defaultAmanahData);
const talk = (patch: Partial<FamilyTalk> = {}): FamilyTalk => ({ id: "t1", date: "2026-11-01", personIds: [], otherPeople: "", topicIds: [], tasks: [], documentsToKnow: [], storageExplained: "", openPoints: "", ...patch });

beforeEach(() => {
  remote.active = false;
  remote.known = false;
  localStorage.clear();
  sessionStorage.clear();
  useAmanahStore.setState({ ...structuredClone(defaultAmanahData), saveStatus: "idle" });
});

describe("P2.5-D family conversation in the folder", () => {
  it("is part of the folder data with an empty default", () => {
    expect(defaultAmanahData.familyConversation).toEqual({ topics: {}, talks: [] });
    expect(normalizeData({}).familyConversation).toEqual({ topics: {}, talks: [] });
  });

  it("normalising drops broken entries and gives the same ids every time", () => {
    const raw = { topics: { a: { notes: "x", checkedQuestionIds: ["q", 3] }, b: "kaputt" }, talks: [{ date: "2026-01-02", tasks: [{ who: "Y" }], storageExplained: "vielleicht" }, "kaputt"] };
    const once = normalizeFamilyConversation(raw);
    expect(once).toEqual(normalizeFamilyConversation(raw));
    expect(once.topics).toEqual({ a: { notes: "x", checkedQuestionIds: ["q"], starredQuestionIds: [] } });
    expect(once.talks).toHaveLength(1);
    expect(once.talks[0]).toMatchObject({ id: "talk-1", storageExplained: "", tasks: [{ id: "talk-1-task-1", who: "Y", what: "", done: false }] });
  });

  it("actions write into the folder store", () => {
    familyConversationActions.setNotes("erbe", "Notiz");
    familyConversationActions.addTalk(talk());
    familyConversationActions.updateTalk("t1", { openPoints: "Offen" });
    expect(useAmanahStore.getState().familyConversation.topics.erbe.notes).toBe("Notiz");
    expect(useAmanahStore.getState().familyConversation.talks[0].openPoints).toBe("Offen");
    familyConversationActions.removeTalk("t1");
    expect(useAmanahStore.getState().familyConversation.talks).toEqual([]);
  });
});

describe("P2.5-D taking over the old browser-only notes", () => {
  const legacy = JSON.stringify({ state: { topics: { erbe: { notes: "Alte Notiz", checkedQuestionIds: [], starredQuestionIds: [] } } }, version: 0 });

  it("moves them into an empty folder record once and removes the old key", () => {
    localStorage.setItem(LEGACY_FAMILY_CONVERSATION_ITEM, legacy);
    expect(importLegacyConversation()).toBe(true);
    expect(useAmanahStore.getState().familyConversation.topics.erbe.notes).toBe("Alte Notiz");
    expect(localStorage.getItem(LEGACY_FAMILY_CONVERSATION_ITEM)).toBeNull();
    expect(importLegacyConversation()).toBe(false);
  });

  it("never overwrites a record that already has content", () => {
    familyConversationActions.setNotes("erbe", "Aus dem Konto");
    sessionStorage.setItem(LEGACY_FAMILY_CONVERSATION_ITEM, legacy);
    expect(importLegacyConversation()).toBe(false);
    expect(useAmanahStore.getState().familyConversation.topics.erbe.notes).toBe("Aus dem Konto");
  });

  it("waits while the account folder is not read yet", () => {
    remote.active = true;
    sessionStorage.setItem(LEGACY_FAMILY_CONVERSATION_ITEM, legacy);
    expect(importLegacyConversation()).toBe(false);
    expect(sessionStorage.getItem(LEGACY_FAMILY_CONVERSATION_ITEM)).toBe(legacy);
    remote.known = true;
    expect(importLegacyConversation()).toBe(true);
  });
});

describe("P2.5-D readiness of the relatives", () => {
  it("summarises who was told, open tasks, known documents and who is still missing", () => {
    const d = empty();
    d.familyMembers = [
      { id: "p1", name: "Yusuf", relation: "Sohn", roles: ["vertrauensperson"] },
      { id: "p2", name: "Mariam", relation: "Tochter", roles: ["notfallkontakt"] },
    ];
    d.familyConversation = {
      topics: {},
      talks: [
        talk({ personIds: ["p1"], otherPeople: "Tante Hafsa", documentsToKnow: ["testament"], storageExplained: "teilweise", tasks: [{ id: "k1", who: "Yusuf", what: "Vertrag holen", done: false }, { id: "k2", who: "", what: "Erledigt", done: true }], openPoints: "Grab" }),
        talk({ id: "t2", date: "2026-11-10", storageExplained: "ja" }),
      ],
    };
    const r = familyReadiness(d);
    expect(r).toMatchObject({ talks: 2, lastTalk: "2026-11-10", informed: ["Yusuf", "Tante Hafsa"], notYetTalkedTo: ["Mariam"], openTasks: [{ who: "Yusuf", what: "Vertrag holen" }], documentsKnown: ["testament"], storageExplained: "ja", openPoints: ["Grab"] });
  });

  it("open tasks from the talk appear in the family guide, done ones do not", () => {
    const d = empty();
    d.emergencyCard = { ...d.emergencyCard, emergencyContact1: { name: "Yusuf", phone: "1", relation: "" } };
    d.familyConversation = { topics: {}, talks: [talk({ tasks: [{ id: "k1", who: "Yusuf", what: "Vertrag holen", done: false }, { id: "k2", who: "Mariam", what: "Schon erledigt", done: true }] })] };
    const text = JSON.stringify(buildLeitfaden(d).sections);
    expect(text).toContain("Wer was übernommen hat");
    expect(text).toContain("Vertrag holen");
    expect(text).not.toContain("Schon erledigt");
    expect(text).toContain("keine Vollmacht");
  });
});

describe("P2.5-D completion page", () => {
  it("shows five steps and keeps every earlier promise", () => {
    render(<AbschlussPage />);
    expect(screen.getByTestId("completion-steps").querySelectorAll("li")).toHaveLength(5);
    for (const n of [1, 2, 3, 4, 5]) expect(screen.getByTestId(`completion-step-${n}`)).toBeTruthy();
    expect(screen.getByTestId("completion-access").textContent).toContain("noch nicht verfügbar");
    expect(screen.getByTestId("completion-family-talks").textContent).toContain("Noch kein Gespräch festgehalten");
    expect(screen.getByTestId("completion-talk-cta").getAttribute("href")).toBe("/dashboard/familiengespraech");
    expect(document.body.textContent).toContain("gibt niemandem Zugriff oder eine Vollmacht");
    expect(document.body.textContent).not.toMatch(/rechtssicher|rechtlich abgesichert/);
  });

  it("recommends the next review a year after the last one, without promising reminders", () => {
    useAmanahStore.setState({ vorsorgeMeta: { ...defaultAmanahData.vorsorgeMeta, reviewedAt: "2026-11-18T10:00:00Z" } });
    render(<AbschlussPage />);
    expect(screen.getByTestId("completion-next-review").textContent).toContain("18.11.2027");
    expect(screen.getByTestId("completion-next-review").textContent).toContain("keine Erinnerungen");
  });
});
