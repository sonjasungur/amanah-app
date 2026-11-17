import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultAmanahData } from "@/lib/domain/defaults";
import { STORAGE_KEY } from "@/lib/storage/types";
import { DEVICE_OWNER_KEY, UNSENT_CHANGE_KEY, folderBackedStorage, hasUnsentChangeOf, keepsFolderInTab } from "@/lib/storage/device-data";
import { useAmanahStore } from "@/lib/store/use-amanah-store";
import { useFamilienGespraechStore } from "@/lib/familiengespraech/store";

const session = vi.hoisted(() => ({ signedIn: true, mode: "api" as "api" | "local" }));
vi.mock("@/lib/auth/config", () => ({ getStorageMode: () => session.mode }));
vi.mock("@/lib/auth/api-auth-provider", () => ({ hasAuthSession: () => session.signedIn, sessionUserId: () => (session.signedIn ? "user-1" : null) }));
vi.mock("@/lib/storage/amanah-storage", () => ({
  saveAmanahData: vi.fn(async () => ({ notStored: [], nearLimit: false })),
  loadAmanahData: vi.fn(async () => defaultAmanahData),
  lastFolderWriteScope: vi.fn(() => "full"),
  clearAmanahData: vi.fn(async () => undefined),
}));

const secret = "Nur in diesem Tab";
const typeName = (name: string) =>
  useAmanahStore.setState({ emergencyCard: { ...defaultAmanahData.emergencyCard, name }, saveStatus: "saved" });

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  session.signedIn = true;
  session.mode = "api";
});

describe("the working copy while signed in (API mode)", () => {
  it("lives in this tab only, never in the browser profile", () => {
    expect(keepsFolderInTab()).toBe(true);
    typeName(secret);
    expect(sessionStorage.getItem(STORAGE_KEY)).toContain(secret);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(JSON.stringify({ ...localStorage })).not.toContain(secret);
  });

  it("family conversation notes follow the folder into the tab", () => {
    useFamilienGespraechStore.getState().setNotes("erbe", secret);
    expect(sessionStorage.getItem("amanah-familiengespraech-v1")).toContain(secret);
    expect(localStorage.getItem("amanah-familiengespraech-v1")).toBeNull();
  });

  it("an older copy in localStorage moves into the tab once, with its unsent mark, and leaves the profile", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: { emergencyCard: { name: "Aelter" } }, version: 0 }));
    localStorage.setItem(UNSENT_CHANGE_KEY, "user-1");
    localStorage.setItem(DEVICE_OWNER_KEY, "user-1");

    expect(folderBackedStorage.getItem(STORAGE_KEY)).toContain("Aelter");
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(UNSENT_CHANGE_KEY)).toBeNull();
    expect(sessionStorage.getItem(UNSENT_CHANGE_KEY)).toBe("user-1");
    expect(hasUnsentChangeOf("user-1")).toBe(true);
  });

  it("the tab keeps its own copy when it already has one", () => {
    sessionStorage.setItem(STORAGE_KEY, "tab");
    localStorage.setItem(STORAGE_KEY, "profile");
    expect(folderBackedStorage.getItem(STORAGE_KEY)).toBe("tab");
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});

describe("without a session, and in the local demo mode", () => {
  it("a guest keeps the folder in localStorage", () => {
    session.signedIn = false;
    typeName("Gast");
    expect(localStorage.getItem(STORAGE_KEY)).toContain("Gast");
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("the demo mode keeps the folder in localStorage", () => {
    session.mode = "local";
    typeName("Demo");
    expect(localStorage.getItem(STORAGE_KEY)).toContain("Demo");
  });
});

describe("closing the tab", () => {
  const closing = () => {
    const event = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(event);
    return event.defaultPrevented;
  };

  it("asks first when the account did not take the last change", () => {
    useAmanahStore.setState({ saveStatus: "error", folderProblem: null });
    expect(closing()).toBe(true);
    useAmanahStore.setState({ saveStatus: "partial" });
    expect(closing()).toBe(true);
  });

  it("does not ask when everything is saved, or without a session", () => {
    useAmanahStore.setState({ saveStatus: "saved", folderProblem: null });
    expect(closing()).toBe(false);
    session.signedIn = false;
    useAmanahStore.setState({ saveStatus: "error" });
    expect(closing()).toBe(false);
  });
});
