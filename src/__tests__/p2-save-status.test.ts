import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defaultAmanahData } from "@/lib/domain/defaults";
import { SAVE_FAILURE_MESSAGES, SaveFailedError } from "@/lib/storage/types";

vi.mock("@/lib/auth/config", () => ({ getStorageMode: vi.fn(() => "api" as const) }));
vi.mock("@/lib/auth/api-auth-provider", () => ({ hasAuthSession: vi.fn(() => true), sessionUserId: vi.fn(() => "user-p2") }));
vi.mock("@/lib/storage/amanah-storage", () => ({
  saveAmanahData: vi.fn(async () => ({ notStored: [], nearLimit: false })),
  loadAmanahData: vi.fn(async () => defaultAmanahData),
  lastFolderWriteScope: vi.fn(() => "full"),
}));

const { ApiStorageProvider } = await import("@/lib/storage/api-storage-provider");
const { persistStoreChanges, syncStoreWithRemoteAfterAuth } = await import("@/lib/storage/store-sync");
const { useAmanahStore } = await import("@/lib/store/use-amanah-store");
const { saveAmanahData } = await import("@/lib/storage/amanah-storage");

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("P2 save failures say why (account provider)", () => {
  afterEach(() => vi.unstubAllGlobals());
  const save = () => new ApiStorageProvider().save(defaultAmanahData);
  const failureOf = async () => save().then(() => null, (e: unknown) => e);

  it.each([
    ["missing consent", json(403, { code: "consent_required", error: "x" }), "consent"],
    ["expired session", json(401, { error: "Nicht angemeldet." }), "session"],
    ["server error", json(500, { error: "Speichern fehlgeschlagen." }), "server"],
    ["too large", json(413, { error: "Zu groß." }), "rejected"],
  ])("%s", async (_name, response, kind) => {
    vi.stubGlobal("fetch", vi.fn(async () => response));
    const err = await failureOf();
    expect(err).toBeInstanceOf(SaveFailedError);
    expect((err as SaveFailedError).kind).toBe(kind);
    expect((err as Error).message).not.toBe("Speichern auf dem Server fehlgeschlagen.");
  });

  it("no network", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("Failed to fetch"))));
    const err = (await failureOf()) as SaveFailedError;
    expect(err.kind).toBe("offline");
    expect(err.message).toBe(SAVE_FAILURE_MESSAGES.offline);
  });

  it("an unconfirmed address keeps the server's reason", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json(403, { code: "email_unverified", error: "Bitte bestätige zuerst deine E-Mail-Adresse." })));
    const err = (await failureOf()) as SaveFailedError;
    expect(err.kind).toBe("rejected");
    expect(err.message).toContain("bestätige zuerst");
  });

  it("every message says that the input stays", () => {
    for (const text of Object.values(SAVE_FAILURE_MESSAGES)) expect(text).toMatch(/bleiben in diesem Tab/);
  });
});

describe("P2 save status: only a confirmed, current state counts as saved", () => {
  beforeEach(async () => {
    vi.useRealTimers();
    vi.mocked(saveAmanahData).mockReset();
    vi.mocked(saveAmanahData).mockResolvedValue({ notStored: [], nearLimit: false });
    useAmanahStore.setState({ ...structuredClone(defaultAmanahData), saveStatus: "idle", saveError: null, lastSaved: null, folderProblem: null });
    await syncStoreWithRemoteAfterAuth();
  });

  it("a newer change while saving keeps 'not yet synced' until it is confirmed too", async () => {
    let releaseFirst: () => void = () => {};
    vi.mocked(saveAmanahData).mockImplementationOnce(() => new Promise((r) => (releaseFirst = () => r({ notStored: [] }))));
    useAmanahStore.getState().updateNested("emergencyCard", "name", "Erste Eingabe");
    const first = persistStoreChanges();
    await vi.waitFor(() => expect(saveAmanahData).toHaveBeenCalledTimes(1));
    useAmanahStore.getState().updateNested("emergencyCard", "name", "Zweite Eingabe");
    const second = persistStoreChanges();
    releaseFirst();
    await first;
    expect(useAmanahStore.getState().saveStatus).toBe("saving");
    await second;
    expect(useAmanahStore.getState().saveStatus).toBe("saved");
    // One after the other: the newer state is the last one the account received.
    expect(vi.mocked(saveAmanahData).mock.calls.at(-1)?.[0].emergencyCard.name).toBe("Zweite Eingabe");
  });

  it("an older failure never hides a newer success", async () => {
    vi.mocked(saveAmanahData).mockRejectedValueOnce(new SaveFailedError("server"));
    useAmanahStore.getState().updateNested("emergencyCard", "name", "A");
    const first = persistStoreChanges();
    useAmanahStore.getState().updateNested("emergencyCard", "name", "B");
    const second = persistStoreChanges();
    await Promise.all([first, second]);
    expect(useAmanahStore.getState().saveStatus).toBe("saved");
    expect(useAmanahStore.getState().emergencyCard.name).toBe("B");
  });

  it("without network: input stays, the reason is shown, and it is sent again by itself", async () => {
    vi.useFakeTimers();
    vi.mocked(saveAmanahData).mockRejectedValueOnce(new SaveFailedError("offline"));
    useAmanahStore.getState().updateNested("emergencyCard", "name", "Offline erfasst");
    await persistStoreChanges();
    expect(useAmanahStore.getState().saveStatus).toBe("error");
    expect(useAmanahStore.getState().saveError).toBe(SAVE_FAILURE_MESSAGES.offline);
    expect(useAmanahStore.getState().emergencyCard.name).toBe("Offline erfasst");
    await vi.advanceTimersByTimeAsync(5_100);
    await vi.waitFor(() => expect(useAmanahStore.getState().saveStatus).toBe("saved"));
    expect(vi.mocked(saveAmanahData).mock.calls.at(-1)?.[0].emergencyCard.name).toBe("Offline erfasst");
    vi.useRealTimers();
  });

  it("a missing consent is named and not retried in a loop", async () => {
    vi.useFakeTimers();
    vi.mocked(saveAmanahData).mockRejectedValue(new SaveFailedError("consent"));
    useAmanahStore.getState().updateNested("emergencyCard", "name", "Vor Einwilligung");
    await persistStoreChanges();
    expect(useAmanahStore.getState().saveError).toBe(SAVE_FAILURE_MESSAGES.consent);
    // Let the regular autosave of the edit run first; after that nothing may repeat by itself.
    await vi.advanceTimersByTimeAsync(1_000);
    const calls = vi.mocked(saveAmanahData).mock.calls.length;
    await vi.advanceTimersByTimeAsync(120_000);
    expect(vi.mocked(saveAmanahData).mock.calls.length).toBe(calls);
    vi.useRealTimers();
  });
});
