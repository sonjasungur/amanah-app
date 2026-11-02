import { defaultAmanahData } from "@/lib/domain/defaults";
import type { AmanahOrdnerData } from "@/lib/domain/types";
import { hasAuthSession } from "@/lib/auth/api-auth-provider";
import { getStorageMode } from "@/lib/auth/config";
import { FREE_ACCOUNT_SECTIONS } from "@/lib/billing/plan-matrix";
import { pickDataFields } from "@/lib/store/store-utils";
import { useAmanahStore } from "@/lib/store/use-amanah-store";
import { lastFolderWriteScope, loadAmanahData, saveAmanahData } from "./amanah-storage";
import { getActiveStorageLabel } from "./storage-config";

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
 * browser must not be overwritten on login. The account still wins for the free sections.
 */
export function keepLocalOnlySections(remote: AmanahOrdnerData, local: AmanahOrdnerData): AmanahOrdnerData {
  const merged: Record<string, unknown> = { ...remote };
  const defaults = defaultAmanahData as unknown as Record<string, unknown>;
  for (const [key, value] of Object.entries(local)) {
    if ((FREE_ACCOUNT_SECTIONS as readonly string[]).includes(key) || key === "lastSaved") continue;
    if (JSON.stringify(value) !== JSON.stringify(defaults[key])) merged[key] = value;
  }
  return merged as unknown as AmanahOrdnerData;
}

async function saveToAccount(data: AmanahOrdnerData): Promise<void> {
  const result = await saveAmanahData(data);
  useAmanahStore.setState({
    saveStatus: result?.notStored?.length ? "partial" : "saved",
    saveError: null,
    lastSaved: new Date().toISOString(),
  });
}

export async function persistStoreChanges(): Promise<void> {
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
    useAmanahStore.setState({
      saveStatus: "error",
      saveError: err instanceof Error ? err.message : "Speichern nicht möglich — erneut versuchen",
    });
  }
}

export async function flushPendingSave(): Promise<void> {
  await persistStoreChanges();
}

export async function syncStoreWithRemoteAfterAuth(): Promise<void> {
  if (!isRemotePersistenceActive()) return;

  useAmanahStore.setState({ saveStatus: "saving", saveError: null });

  try {
    const localData = pickDataFields(useAmanahStore.getState());
    const remoteData = await loadAmanahData();
    const remoteHasData = hasMeaningfulLocalData(remoteData);
    const localHasData = hasMeaningfulLocalData(localData);

    if (remoteHasData && lastFolderWriteScope() === "free_sections") {
      useAmanahStore.getState().importData(keepLocalOnlySections(remoteData, localData));
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
      if (remoteCheckEmpty && localCheckHasData) {
        useAmanahStore.getState().importData({ ...remoteData, checkProgress: localCheck });
      } else {
        useAmanahStore.getState().importData(remoteData);
      }
      return;
    }

    if (localHasData) {
      await saveToAccount(localData);
      return;
    }

    useAmanahStore.setState({ saveStatus: "idle", saveError: null });
  } catch {
    useAmanahStore.setState({
      saveStatus: "error",
      saveError: "Daten konnten nicht vom Konto geladen werden.",
    });
  }
}
