import { describe, expect, it, vi, beforeEach } from "vitest";
import { defaultAmanahData } from "@/lib/domain/defaults";
import { migrateRawData } from "@/lib/domain/migration";
import { SCHEMA_VERSION } from "@/lib/domain/schema";
import { sanitizeReturnUrl, buildAuthHref } from "@/lib/auth/return-url";
import { hasMeaningfulLocalData, persistStoreChanges, saveBeforeLeaving, syncStoreWithRemoteAfterAuth } from "@/lib/storage/store-sync";
import { useAmanahStore } from "@/lib/store/use-amanah-store";

vi.mock("@/lib/auth/config", () => ({
  getStorageMode: vi.fn(() => "local" as const),
}));

vi.mock("@/lib/auth/api-auth-provider", () => ({
  hasAuthSession: vi.fn(() => false),
  sessionUserId: vi.fn(() => "user-1"),
}));

vi.mock("@/lib/storage/amanah-storage", () => ({
  saveAmanahData: vi.fn(async () => undefined),
  loadAmanahData: vi.fn(async () => defaultAmanahData),
  lastFolderWriteScope: vi.fn(() => "full"),
}));

describe("schema migration v1 to v2", () => {
  it("deep-merges v1 janazah data and upgrades schema version", () => {
    const v1 = {
      schemaVersion: 1,
      janazahWishes: {
        messageToFamily: "Bestehende Nachricht",
        preferredMosque: "Mevlana Moschee",
      },
    };
    const migrated = migrateRawData(v1);
    expect(migrated.schemaVersion).toBe(SCHEMA_VERSION);
    expect(migrated.janazahWishes.messageToFamily).toBe("Bestehende Nachricht");
    expect(migrated.janazahWishes.preferredMosque).toBe("Mevlana Moschee");
    expect(migrated.janazahWishes.fullName).toBe("");
    expect(migrated.janazahWishes.peopleToNotify).toBe("");
  });
});

describe("return URL helpers", () => {
  it("sanitizes unsafe return URLs", () => {
    expect(sanitizeReturnUrl("/dashboard/janazah")).toBe("/dashboard/janazah");
    expect(sanitizeReturnUrl("//evil.example")).toBe("/dashboard");
    expect(sanitizeReturnUrl("https://evil.example")).toBe("/dashboard");
    expect(sanitizeReturnUrl(null)).toBe("/dashboard");
  });

  it("builds auth href with encoded return URL", () => {
    expect(buildAuthHref("/login", "/dashboard/janazah")).toBe("/login?returnUrl=%2Fdashboard%2Fjanazah");
  });
});

describe("store sync helpers", () => {
  beforeEach(() => {
    useAmanahStore.setState({ ...defaultAmanahData, saveStatus: "idle", saveError: null, lastSaved: null });
  });

  it("treats empty defaults as not meaningful", () => {
    expect(hasMeaningfulLocalData(defaultAmanahData)).toBe(false);
  });

  it("detects meaningful janazah changes", () => {
    expect(
      hasMeaningfulLocalData({
        ...defaultAmanahData,
        janazahWishes: { ...defaultAmanahData.janazahWishes, fullName: "Amina" },
      })
    ).toBe(true);
  });

  it("persists local changes and marks saved without empty writes", async () => {
    await persistStoreChanges();
    expect(useAmanahStore.getState().saveStatus).toBe("idle");

    useAmanahStore.getState().updateField("janazahWishes", {
      ...defaultAmanahData.janazahWishes,
      fullName: "Test",
    });
    useAmanahStore.setState({ saveStatus: "saving", saveError: null });

    await persistStoreChanges();
    expect(useAmanahStore.getState().saveStatus).toBe("saved");
    expect(useAmanahStore.getState().lastSaved).toBeTruthy();
  });

  it("does not mark saved when remote save fails", async () => {
    const { getStorageMode } = await import("@/lib/auth/config");
    const { hasAuthSession } = await import("@/lib/auth/api-auth-provider");
    const { saveAmanahData } = await import("@/lib/storage/amanah-storage");

    vi.mocked(getStorageMode).mockReturnValue("api");
    vi.mocked(hasAuthSession).mockReturnValue(true);
    vi.mocked(saveAmanahData).mockRejectedValueOnce(new Error("Speichern auf dem Server fehlgeschlagen."));

    useAmanahStore.getState().updateField("janazahWishes", {
      ...defaultAmanahData.janazahWishes,
      messageToFamily: "Fehlerfall",
    });
    useAmanahStore.setState({ saveStatus: "saving", saveError: null });

    await persistStoreChanges();
    expect(useAmanahStore.getState().saveStatus).toBe("error");
    expect(useAmanahStore.getState().saveError).toContain("Server");
  });
});

describe("syncStoreWithRemoteAfterAuth", () => {
  const remoteMode = async () => {
    const { getStorageMode } = await import("@/lib/auth/config");
    const { hasAuthSession } = await import("@/lib/auth/api-auth-provider");
    const storage = await import("@/lib/storage/amanah-storage");
    vi.mocked(getStorageMode).mockReturnValue("api");
    vi.mocked(hasAuthSession).mockReturnValue(true);
    vi.mocked(storage.saveAmanahData).mockClear();
    vi.mocked(storage.saveAmanahData).mockResolvedValue({ notStored: [], nearLimit: false });
    return storage;
  };

  it("after leaving with an unsent change, the newer browser state goes to the account, once", async () => {
    const { loadAmanahData, saveAmanahData } = await remoteMode();
    useAmanahStore.getState().updateField("emergencyCard", { ...defaultAmanahData.emergencyCard, name: "Neuer im Browser" });
    useAmanahStore.setState({ saveStatus: "saving" });
    saveBeforeLeaving();
    expect(localStorage.getItem("amanah-unsent-change")).toBe("user-1");

    vi.mocked(loadAmanahData).mockResolvedValue({ ...defaultAmanahData, emergencyCard: { ...defaultAmanahData.emergencyCard, name: "Aelter im Konto" } });
    await syncStoreWithRemoteAfterAuth();
    expect(useAmanahStore.getState().emergencyCard.name).toBe("Neuer im Browser");
    expect(vi.mocked(saveAmanahData).mock.calls.at(-1)?.[0].emergencyCard.name).toBe("Neuer im Browser");
    expect(localStorage.getItem("amanah-unsent-change")).toBeNull();

    await syncStoreWithRemoteAfterAuth();
    expect(useAmanahStore.getState().emergencyCard.name).toBe("Aelter im Konto");
  });

  it("a folder too large for a leaving page is marked and arrives with the next load", async () => {
    const { loadAmanahData, saveAmanahData } = await remoteMode();
    const fetchMock = vi.fn(async () => new Response("{}"));
    vi.stubGlobal("fetch", fetchMock);
    const big = "x".repeat(70_000);
    useAmanahStore.getState().updateField("emergencyCard", { ...defaultAmanahData.emergencyCard, name: "Gross", allergies: big });
    useAmanahStore.setState({ saveStatus: "saving" });
    saveBeforeLeaving();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(localStorage.getItem("amanah-unsent-change")).toBe("user-1");

    vi.mocked(loadAmanahData).mockResolvedValueOnce(defaultAmanahData);
    await syncStoreWithRemoteAfterAuth();
    const last = vi.mocked(saveAmanahData).mock.calls.at(-1)?.[0];
    expect(last?.emergencyCard.allergies.length).toBe(big.length);
    expect(localStorage.getItem("amanah-unsent-change")).toBeNull();
    vi.unstubAllGlobals();
  });

  it("an unsent change of another account is not uploaded here", async () => {
    const { loadAmanahData, saveAmanahData } = await remoteMode();
    localStorage.setItem("amanah-unsent-change", "jemand-anderes");
    vi.mocked(loadAmanahData).mockResolvedValueOnce({ ...defaultAmanahData, emergencyCard: { ...defaultAmanahData.emergencyCard, name: "Eigenes Konto" } });
    await syncStoreWithRemoteAfterAuth();
    expect(useAmanahStore.getState().emergencyCard.name).toBe("Eigenes Konto");
    expect(saveAmanahData).not.toHaveBeenCalled();
    localStorage.removeItem("amanah-unsent-change");
  });

  it("a failed upload keeps the change marked for the next load", async () => {
    const { loadAmanahData, saveAmanahData } = await remoteMode();
    localStorage.setItem("amanah-unsent-change", "user-1");
    vi.mocked(saveAmanahData).mockRejectedValueOnce(new Error("offline"));
    vi.mocked(loadAmanahData).mockResolvedValueOnce(defaultAmanahData);
    await syncStoreWithRemoteAfterAuth();
    expect(localStorage.getItem("amanah-unsent-change")).toBe("user-1");
    expect(useAmanahStore.getState().saveStatus).toBe("error");
    localStorage.removeItem("amanah-unsent-change");
  });

  it("keeps and saves what was entered while the account data was loading", async () => {
    const { getStorageMode } = await import("@/lib/auth/config");
    const { hasAuthSession } = await import("@/lib/auth/api-auth-provider");
    const { loadAmanahData, saveAmanahData } = await import("@/lib/storage/amanah-storage");
    vi.mocked(getStorageMode).mockReturnValue("api");
    vi.mocked(hasAuthSession).mockReturnValue(true);
    vi.mocked(saveAmanahData).mockClear();
    vi.mocked(saveAmanahData).mockResolvedValue({ notStored: [], nearLimit: false });

    const remote = {
      ...defaultAmanahData,
      emergencyCard: { ...defaultAmanahData.emergencyCard, name: "Vom Konto" },
      janazahWishes: { ...defaultAmanahData.janazahWishes, fullName: "Vom Konto" },
    };
    let finishLoading: (data: typeof remote) => void = () => undefined;
    vi.mocked(loadAmanahData).mockReturnValueOnce(new Promise((resolve) => (finishLoading = resolve)));

    const sync = syncStoreWithRemoteAfterAuth();
    useAmanahStore.getState().updateField("janazahWishes", { ...defaultAmanahData.janazahWishes, fullName: "Eben eingegeben" });
    finishLoading(remote);
    await sync;

    const state = useAmanahStore.getState();
    expect(state.janazahWishes.fullName).toBe("Eben eingegeben");
    expect(state.emergencyCard.name).toBe("Vom Konto");
    const saved = vi.mocked(saveAmanahData).mock.calls.at(-1)?.[0];
    expect(saved?.janazahWishes.fullName).toBe("Eben eingegeben");
    expect(saved?.emergencyCard.name).toBe("Vom Konto");
  });

  it("without an edit the account state applies and nothing is written back", async () => {
    const { getStorageMode } = await import("@/lib/auth/config");
    const { hasAuthSession } = await import("@/lib/auth/api-auth-provider");
    const { loadAmanahData, saveAmanahData } = await import("@/lib/storage/amanah-storage");
    vi.mocked(getStorageMode).mockReturnValue("api");
    vi.mocked(hasAuthSession).mockReturnValue(true);
    vi.mocked(saveAmanahData).mockClear();
    vi.mocked(loadAmanahData).mockResolvedValueOnce({ ...defaultAmanahData, emergencyCard: { ...defaultAmanahData.emergencyCard, name: "Nur Konto" } });

    await syncStoreWithRemoteAfterAuth();

    expect(useAmanahStore.getState().emergencyCard.name).toBe("Nur Konto");
    expect(saveAmanahData).not.toHaveBeenCalled();
  });
});
