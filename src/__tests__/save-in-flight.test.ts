import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultAmanahData } from "@/lib/domain/defaults";
import { isSaveInFlight, persistStoreChanges, syncStoreWithRemoteAfterAuth } from "@/lib/storage/store-sync";
import { useAmanahStore } from "@/lib/store/use-amanah-store";

vi.mock("@/lib/auth/config", () => ({ getStorageMode: vi.fn(() => "api" as const) }));
vi.mock("@/lib/auth/api-auth-provider", () => ({ hasAuthSession: vi.fn(() => true), sessionUserId: vi.fn(() => "user-1") }));
vi.mock("@/lib/storage/amanah-storage", () => ({
  saveAmanahData: vi.fn(async () => ({ notStored: [], nearLimit: false })),
  loadAmanahData: vi.fn(async () => defaultAmanahData),
  lastFolderWriteScope: vi.fn(() => "full"),
  clearAmanahData: vi.fn(async () => undefined),
}));
vi.mock("@/lib/storage/api-storage-provider", () => ({ apiStorageProvider: { saveWhileLeaving: vi.fn() } }));

const UNSENT = "amanah-unsent-change";
const card = (name: string) => ({ ...defaultAmanahData.emergencyCard, name });

function heldSave() {
  let release!: () => void;
  const done = new Promise<{ notStored: string[]; nearLimit: boolean }>((resolve) => {
    release = () => resolve({ notStored: [], nearLimit: false });
  });
  return { done, release };
}

beforeEach(async () => {
  localStorage.clear();
  sessionStorage.clear();
  useAmanahStore.setState({ ...defaultAmanahData, saveStatus: "idle", saveError: null, folderProblem: null, lastSaved: null });
  await syncStoreWithRemoteAfterAuth();
});

describe("a save that is still running when the page goes away", () => {
  it("is marked as unsent until the account confirms it", async () => {
    const { saveAmanahData } = await import("@/lib/storage/amanah-storage");
    const held = heldSave();
    vi.mocked(saveAmanahData).mockReturnValueOnce(held.done);
    useAmanahStore.setState({ emergencyCard: card("Unterwegs"), saveStatus: "saving" });

    const running = persistStoreChanges();
    await vi.waitFor(() => expect(isSaveInFlight()).toBe(true));
    expect(sessionStorage.getItem(UNSENT)).toBe("user-1");

    held.release();
    await running;
    expect(isSaveInFlight()).toBe(false);
    expect(sessionStorage.getItem(UNSENT)).toBeNull();
  });

  it("stays marked when something newer was typed during the save", async () => {
    const { saveAmanahData } = await import("@/lib/storage/amanah-storage");
    const held = heldSave();
    vi.mocked(saveAmanahData).mockReturnValueOnce(held.done);
    useAmanahStore.setState({ emergencyCard: card("Erste Fassung"), saveStatus: "saving" });
    const running = persistStoreChanges();
    await vi.waitFor(() => expect(isSaveInFlight()).toBe(true));
    useAmanahStore.setState({ emergencyCard: card("Zweite Fassung") });
    held.release();
    await running;
    expect(sessionStorage.getItem(UNSENT)).toBe("user-1");
  });

  it("is sent again in a way that outlives the page", async () => {
    const { saveAmanahData } = await import("@/lib/storage/amanah-storage");
    const { apiStorageProvider } = await import("@/lib/storage/api-storage-provider");
    const held = heldSave();
    vi.mocked(saveAmanahData).mockReturnValueOnce(held.done);
    useAmanahStore.setState({ emergencyCard: card("Beim Verlassen"), saveStatus: "saving" });
    const running = persistStoreChanges();
    await vi.waitFor(() => expect(isSaveInFlight()).toBe(true));

    window.dispatchEvent(new Event("pagehide"));
    expect(apiStorageProvider.saveWhileLeaving).toHaveBeenCalledTimes(1);
    expect(String(vi.mocked(apiStorageProvider.saveWhileLeaving).mock.calls[0][0])).toContain("Beim Verlassen");
    held.release();
    await running;
  });

  it("the next load sends the newer browser state instead of taking the older account state", async () => {
    const { saveAmanahData, loadAmanahData } = await import("@/lib/storage/amanah-storage");
    useAmanahStore.setState({ emergencyCard: card("Neuer im Browser") });
    sessionStorage.setItem(UNSENT, "user-1"); // the save was aborted with the page
    vi.mocked(loadAmanahData).mockResolvedValueOnce({ ...defaultAmanahData, emergencyCard: card("Aelter im Konto") });
    await syncStoreWithRemoteAfterAuth();
    expect(useAmanahStore.getState().emergencyCard.name).toBe("Neuer im Browser");
    expect(vi.mocked(saveAmanahData).mock.calls.at(-1)?.[0].emergencyCard.name).toBe("Neuer im Browser");
  });
});
