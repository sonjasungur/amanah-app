import { defaultAmanahData } from "@/lib/domain/defaults";
import type { AmanahOrdnerData } from "@/lib/domain/types";
import { hasAuthSession, sessionUserId } from "@/lib/auth/api-auth-provider";
import { getStorageMode } from "@/lib/auth/config";
import { FREE_ACCOUNT_SECTIONS } from "@/lib/billing/plan-matrix";
import { pickDataFields } from "@/lib/store/store-utils";
import { useAmanahStore } from "@/lib/store/use-amanah-store";
import { lastFolderWriteScope, loadAmanahData, saveAmanahData } from "./amanah-storage";
import { apiStorageProvider } from "./api-storage-provider";
import { getActiveStorageLabel } from "./storage-config";
import { FolderUnreadableError } from "./types";

export type StorageLocationLabel = "local" | "api" | "local-demo";

export function getStorageLocationLabel(): StorageLocationLabel {
  return getActiveStorageLabel();
}

export function isRemotePersistenceActive(): boolean {
  return getStorageMode() === "api" && hasAuthSession();
}

export function hasMeaningfulLocalData(data: AmanahOrdnerData): boolean {
  if (data.lastSaved) return true;
  if (data.emergencyCard.name?.trim()) return true;
  if (data.userProfile.name?.trim()) return true;
  if (data.janazahWishes.fullName?.trim()) return true;
  if (data.janazahWishes.messageToFamily?.trim()) return true;
  if (data.janazahWishes.preferredMosque?.trim()) return true;
  if (data.debtsAmanah.length > 0) return true;
  if (data.digitalLegacy.length > 0) return true;
  if (data.familyMessage.familyLetter?.trim()) return true;
  if (data.checkProgress?.phase === "result") return true;
  if ((data.checkProgress?.index ?? 0) > 0) return true;
  if (Object.keys(data.checkProgress?.answers ?? {}).length > 0) return true;
  return JSON.stringify(data) !== JSON.stringify(defaultAmanahData);
}

/**
 * Without Plus access the account holds only the free sections, so what exists only in this
 * browser must not be overwritten on login. For free sections the account wins, unless it holds
 * nothing yet: then the entries from this browser count and are uploaded.
 */
export function keepLocalOnlySections(remote: AmanahOrdnerData, local: AmanahOrdnerData): AmanahOrdnerData {
  const merged: Record<string, unknown> = { ...remote };
  const account = remote as unknown as Record<string, unknown>;
  const defaults = defaultAmanahData as unknown as Record<string, unknown>;
  const isDefault = (key: string, value: unknown) => JSON.stringify(value) === JSON.stringify(defaults[key]);
  for (const [key, value] of Object.entries(local)) {
    if (key === "lastSaved" || isDefault(key, value)) continue;
    if (!(FREE_ACCOUNT_SECTIONS as readonly string[]).includes(key) || isDefault(key, account[key])) merged[key] = value;
  }
  return merged as unknown as AmanahOrdnerData;
}

/** Whose folder was read in this session. Until then a save could replace what the account holds. */
let folderReadFor: string | null = null;
/** After a failed read: the state to compare with, so that what was typed since survives the next read. */
let unreadBaseline: { userId: string | null; data: AmanahOrdnerData } | null = null;
/** The last state both sides agreed on. */
let accountState: AmanahOrdnerData | null = null;
let runningSync: Promise<void> | null = null;

function isAccountFolderKnown(): boolean {
  return folderReadFor !== null && folderReadFor === sessionUserId();
}

function reportFolderUnreadable(error: FolderUnreadableError, baseline: AmanahOrdnerData): void {
  folderReadFor = null;
  unreadBaseline = { userId: sessionUserId(), data: baseline };
  useAmanahStore.setState({ folderProblem: "unreadable", saveStatus: "error", saveError: error.message });
}

async function saveToAccount(data: AmanahOrdnerData): Promise<void> {
  const result = await saveAmanahData(data);
  accountState = data;
  useAmanahStore.setState({
    saveStatus: result?.notStored?.length ? "partial" : "saved",
    saveError: null,
    saveNearLimit: result?.nearLimit === true,
    lastSaved: new Date().toISOString(),
  });
}

export async function persistStoreChanges(): Promise<void> {
  if (isRemotePersistenceActive() && !isAccountFolderKnown()) {
    // A read is running or has failed: never write over what is not known. Reading again keeps new input.
    await (runningSync ?? syncStoreWithRemoteAfterAuth());
    return;
  }

  const state = useAmanahStore.getState();
  const data = pickDataFields(state);

  if (!hasMeaningfulLocalData(data)) {
    useAmanahStore.setState({ saveStatus: "idle", saveError: null });
    return;
  }

  try {
    if (isRemotePersistenceActive()) {
      await saveToAccount(data);
      return;
    }

    useAmanahStore.setState({
      saveStatus: "saved",
      saveError: null,
      lastSaved: new Date().toISOString(),
    });
  } catch (err) {
    if (err instanceof FolderUnreadableError) {
      reportFolderUnreadable(err, accountState ?? data);
      return;
    }
    useAmanahStore.setState({
      saveStatus: "error",
      saveError: err instanceof Error ? err.message : "Speichern nicht möglich — erneut versuchen",
    });
  }
}

const KEEPALIVE_MAX_BYTES = 60_000;
const UNSENT_KEY = "amanah-unsent-change";

/** Whether this account left a page with a change the account may not have received. */
function hasUnsentChange(): boolean {
  try {
    return localStorage.getItem(UNSENT_KEY) === sessionUserId();
  } catch {
    return false;
  }
}

function clearUnsentChange(): void {
  try {
    localStorage.removeItem(UNSENT_KEY);
  } catch {
    // Nothing to clear without a storage.
  }
}

/**
 * The page goes away with a change not yet sent. Without this the next load would show the older
 * account state. Larger folders exceed what browsers finish for a leaving page: tried all the same.
 */
export function saveBeforeLeaving(): void {
  if (!isRemotePersistenceActive() || !isAccountFolderKnown()) return;
  const data = pickDataFields(useAmanahStore.getState());
  if (!hasMeaningfulLocalData(data)) return;
  // The next page cannot know whether this request arrived, or arrived before it loads the account.
  const userId = sessionUserId();
  if (userId) {
    try {
      localStorage.setItem(UNSENT_KEY, userId);
    } catch {
      // Without a storage only the request below remains.
    }
  }
  const body = JSON.stringify(data);
  if (new TextEncoder().encode(body).length > KEEPALIVE_MAX_BYTES) {
    void persistStoreChanges();
    return;
  }
  apiStorageProvider.saveWhileLeaving(body);
}

export async function flushPendingSave(): Promise<void> {
  await persistStoreChanges();
}

export function syncStoreWithRemoteAfterAuth(): Promise<void> {
  if (!isRemotePersistenceActive()) return Promise.resolve();
  const run = readAndMergeAccountFolder().finally(() => {
    if (runningSync === run) runningSync = null;
  });
  runningSync = run;
  return run;
}

async function readAndMergeAccountFolder(): Promise<void> {
  folderReadFor = null;
  useAmanahStore.setState({ saveStatus: "saving", saveError: null });
  const userId = sessionUserId();
  const atStart = unreadBaseline?.userId === userId ? unreadBaseline.data : pickDataFields(useAmanahStore.getState());

  let remoteData: AmanahOrdnerData;
  try {
    remoteData = await loadAmanahData();
  } catch (err) {
    if (err instanceof FolderUnreadableError) {
      reportFolderUnreadable(err, atStart);
      return;
    }
    unreadBaseline = { userId, data: atStart };
    useAmanahStore.setState({ folderProblem: "load_failed", saveStatus: "error", saveError: "Daten konnten nicht vom Konto geladen werden." });
    return;
  }
  folderReadFor = userId;
  unreadBaseline = null;
  accountState = remoteData;
  useAmanahStore.setState({ folderProblem: null });

  try {
    // Read only now: what was entered while the account data was loading must not be lost.
    const localData = pickDataFields(useAmanahStore.getState());
    if (hasUnsentChange()) {
      // The browser holds the newest state: it goes to the account, instead of the older account
      // state replacing it. Sections this account may not write are not stored by the server.
      await saveToAccount(localData);
      clearUnsentChange();
      return;
    }
    const editedWhileLoading = (Object.keys(localData) as (keyof AmanahOrdnerData)[]).filter((key) => localData[key] !== atStart[key]);
    const withEdits = (base: AmanahOrdnerData): AmanahOrdnerData =>
      editedWhileLoading.reduce((data, key) => ({ ...data, [key]: localData[key] }), base);
    const remoteHasData = hasMeaningfulLocalData(remoteData);
    const localHasData = hasMeaningfulLocalData(localData);

    if (remoteHasData && lastFolderWriteScope() === "free_sections") {
      const merged = withEdits(keepLocalOnlySections(remoteData, localData));
      useAmanahStore.getState().importData(merged);
      if (JSON.stringify(merged) !== JSON.stringify(remoteData)) await saveToAccount(merged);
      return;
    }

    if (remoteHasData) {
      const remoteCheckEmpty =
        !remoteData.checkProgress ||
        (remoteData.checkProgress.phase !== "result" &&
          remoteData.checkProgress.index === 0 &&
          Object.keys(remoteData.checkProgress.answers ?? {}).length === 0);
      const localCheck = localData.checkProgress;
      const localCheckHasData =
        localCheck &&
        (localCheck.phase === "result" || localCheck.index > 0 || Object.keys(localCheck.answers ?? {}).length > 0);
      const takeLocalCheck = Boolean(remoteCheckEmpty && localCheckHasData);
      const merged = withEdits(takeLocalCheck ? { ...remoteData, checkProgress: localCheck } : remoteData);
      useAmanahStore.getState().importData(merged);
      if (takeLocalCheck || editedWhileLoading.length > 0) await saveToAccount(merged);
      return;
    }

    if (localHasData) {
      await saveToAccount(localData);
      return;
    }

    useAmanahStore.setState({ saveStatus: "idle", saveError: null });
  } catch (err) {
    if (err instanceof FolderUnreadableError) {
      reportFolderUnreadable(err, remoteData);
      return;
    }
    useAmanahStore.setState({
      saveStatus: "error",
      saveError: err instanceof Error ? err.message : "Speichern nicht möglich — erneut versuchen",
    });
  }
}
