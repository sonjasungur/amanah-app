import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultAmanahData } from "@/lib/domain/defaults";
import { STORAGE_KEY } from "@/lib/storage/types";
import { CHECK_STORAGE_KEY } from "@/lib/check/state-machine";
import { GUIDED_FLOW_STORAGE_KEY } from "@/lib/guided-flow/config";
import { AI_CONSENT_STORAGE_KEY } from "@/lib/ai/config";
import {
  DEVICE_LOCAL_KEYS,
  DEVICE_OWNER_KEY,
  DEVICE_SESSION_KEYS,
  deviceDataOwner,
  UNSENT_CHANGE_KEY,
  wipeDeviceData,
} from "@/lib/storage/device-data";
import { discardDeviceDataWithoutSession, syncStoreWithRemoteAfterAuth } from "@/lib/storage/store-sync";
import { flushBeforeSignOut, useAmanahStore } from "@/lib/store/use-amanah-store";
import { useFamilienGespraechStore } from "@/lib/familiengespraech/store";

vi.mock("@/lib/auth/config", () => ({ getStorageMode: vi.fn(() => "api" as const) }));
vi.mock("@/lib/auth/api-auth-provider", () => ({
  hasAuthSession: vi.fn(() => true),
  sessionUserId: vi.fn(() => "user-b"),
}));
vi.mock("@/lib/storage/amanah-storage", () => ({
  saveAmanahData: vi.fn(async () => ({ notStored: [], nearLimit: false })),
  loadAmanahData: vi.fn(async () => defaultAmanahData),
  lastFolderWriteScope: vi.fn(() => "full"),
  clearAmanahData: vi.fn(async () => undefined),
}));

const secret = "Vertraulich von Konto A";

function fillAsAccountA() {
  useAmanahStore.getState().importData({ ...defaultAmanahData, emergencyCard: { ...defaultAmanahData.emergencyCard, name: secret } });
  useFamilienGespraechStore.getState().setNotes("erbe", secret);
  localStorage.setItem(DEVICE_OWNER_KEY, "user-a");
  localStorage.setItem(GUIDED_FLOW_STORAGE_KEY, JSON.stringify({ skippedQuestions: ["x"] }));
  localStorage.setItem(AI_CONSENT_STORAGE_KEY, "granted");
  sessionStorage.setItem(CHECK_STORAGE_KEY, JSON.stringify({ index: 2, answers: { a: true }, phase: "question" }));
}

function browserHolds(text: string): boolean {
  const dump = JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage });
  return dump.includes(text);
}

beforeEach(async () => {
  localStorage.clear();
  sessionStorage.clear();
  useAmanahStore.setState({ ...defaultAmanahData, saveStatus: "idle", saveError: null, folderProblem: null, lastSaved: null });
  const storage = await import("@/lib/storage/amanah-storage");
  vi.mocked(storage.saveAmanahData).mockClear();
  vi.mocked(storage.saveAmanahData).mockResolvedValue({ notStored: [], nearLimit: false });
  vi.mocked(storage.loadAmanahData).mockResolvedValue(defaultAmanahData);
});

describe("the working copy of a folder in this browser", () => {
  it("lists every key that holds folder content or answers", () => {
    expect(DEVICE_LOCAL_KEYS).toEqual(
      expect.arrayContaining([
        useFamilienGespraechStore.persist.getOptions().name,
        STORAGE_KEY,
        UNSENT_CHANGE_KEY,
        GUIDED_FLOW_STORAGE_KEY,
        AI_CONSENT_STORAGE_KEY,
      ])
    );
    expect(DEVICE_SESSION_KEYS).toContain(CHECK_STORAGE_KEY);
    expect(useFamilienGespraechStore.persist.getOptions().name).toBe("amanah-familiengespraech-v1");
  });

  it("is gone from storage and memory after a wipe", () => {
    fillAsAccountA();
    expect(browserHolds(secret)).toBe(true);

    wipeDeviceData();

    expect(browserHolds(secret)).toBe(false);
    for (const key of DEVICE_LOCAL_KEYS) expect(localStorage.getItem(key)).toBeNull();
    for (const key of DEVICE_SESSION_KEYS) expect(sessionStorage.getItem(key)).toBeNull();
    expect(useAmanahStore.getState().emergencyCard.name).toBe("");
    expect(useFamilienGespraechStore.getState().topics).toEqual({});
  });

  it("the wipe does not send the emptied folder to the account", async () => {
    const { saveAmanahData } = await import("@/lib/storage/amanah-storage");
    fillAsAccountA();
    wipeDeviceData();
    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(saveAmanahData).not.toHaveBeenCalled();
  });

  it("another account signing in never sees or uploads it", async () => {
    const { saveAmanahData } = await import("@/lib/storage/amanah-storage");
    fillAsAccountA();

    await syncStoreWithRemoteAfterAuth(); // the session hint now belongs to user-b, whose folder is empty

    expect(useAmanahStore.getState().emergencyCard.name).toBe("");
    expect(JSON.stringify(vi.mocked(saveAmanahData).mock.calls)).not.toContain(secret);
    expect(browserHolds(secret)).toBe(false);
    expect(deviceDataOwner()).toBe("user-b");
  });

  it("the same account keeps its copy and becomes its owner", async () => {
    const { sessionUserId } = await import("@/lib/auth/api-auth-provider");
    vi.mocked(sessionUserId).mockReturnValue("user-a");
    const { loadAmanahData } = await import("@/lib/storage/amanah-storage");
    vi.mocked(loadAmanahData).mockResolvedValue({ ...defaultAmanahData, emergencyCard: { ...defaultAmanahData.emergencyCard, name: secret } });
    fillAsAccountA();
    await syncStoreWithRemoteAfterAuth();
    expect(useAmanahStore.getState().emergencyCard.name).toBe(secret);
    expect(deviceDataOwner()).toBe("user-a");
    vi.mocked(sessionUserId).mockReturnValue("user-b");
  });

  it("an ended session removes it, unless a change of that account is still unsent", () => {
    fillAsAccountA();
    localStorage.setItem(UNSENT_CHANGE_KEY, "user-a");
    discardDeviceDataWithoutSession();
    expect(useAmanahStore.getState().emergencyCard.name).toBe(secret);
    expect(deviceDataOwner()).toBe("user-a");

    localStorage.removeItem(UNSENT_CHANGE_KEY);
    discardDeviceDataWithoutSession();
    expect(browserHolds(secret)).toBe(false);
    expect(useAmanahStore.getState().emergencyCard.name).toBe("");
  });

  it("an unsent change of another account does not keep this copy", () => {
    fillAsAccountA();
    localStorage.setItem(UNSENT_CHANGE_KEY, "user-x");
    discardDeviceDataWithoutSession();
    expect(browserHolds(secret)).toBe(false);
  });

  it("data typed without an account (no owner) is left alone when no session exists", () => {
    useAmanahStore.getState().importData({ ...defaultAmanahData, emergencyCard: { ...defaultAmanahData.emergencyCard, name: "Gast" } });
    discardDeviceDataWithoutSession();
    expect(useAmanahStore.getState().emergencyCard.name).toBe("Gast");
  });
});

describe("before a logout", () => {
  const typeSomething = () => {
    useAmanahStore.getState().updateField("emergencyCard", { ...defaultAmanahData.emergencyCard, name: "Noch nicht gesendet" });
  };

  it("sends what is pending and allows the logout once the account has it", async () => {
    const { saveAmanahData } = await import("@/lib/storage/amanah-storage");
    await syncStoreWithRemoteAfterAuth();
    typeSomething();
    expect(await flushBeforeSignOut()).toBe(true);
    expect(vi.mocked(saveAmanahData).mock.calls.at(-1)?.[0].emergencyCard.name).toBe("Noch nicht gesendet");
  });

  it("refuses when the account may not hold the newest state", async () => {
    const { saveAmanahData } = await import("@/lib/storage/amanah-storage");
    await syncStoreWithRemoteAfterAuth();
    typeSomething();
    vi.mocked(saveAmanahData).mockRejectedValueOnce(new Error("offline"));
    expect(await flushBeforeSignOut()).toBe(false);
    expect(useAmanahStore.getState().emergencyCard.name).toBe("Noch nicht gesendet");
  });

  it("refuses when only part of the folder was stored", async () => {
    const { saveAmanahData } = await import("@/lib/storage/amanah-storage");
    await syncStoreWithRemoteAfterAuth();
    typeSomething();
    vi.mocked(saveAmanahData).mockResolvedValueOnce({ notStored: ["janazahWishes"], nearLimit: false });
    expect(await flushBeforeSignOut()).toBe(false);
  });
});
