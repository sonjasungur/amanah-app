import { defaultAmanahData } from "@/lib/domain/defaults";
import type { AmanahOrdnerData } from "@/lib/domain/types";
import { getAuthToken } from "@/lib/auth/api-auth-provider";
import { getStorageMode } from "@/lib/auth/config";
import { pickDataFields } from "@/lib/store/store-utils";
import { useAmanahStore } from "@/lib/store/use-amanah-store";
import { loadAmanahData, saveAmanahData } from "./amanah-storage";
import { getActiveStorageLabel } from "./storage-config";

export type StorageLocationLabel = "local" | "api" | "local-demo";

export function getStorageLocationLabel(): StorageLocationLabel {
  return getActiveStorageLabel();
}

export function isRemotePersistenceActive(): boolean {
  return getStorageMode() === "api" && Boolean(getAuthToken());
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
  return JSON.stringify(data) !== JSON.stringify(defaultAmanahData);
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
      await saveAmanahData(data);
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

    if (remoteHasData) {
      useAmanahStore.getState().importData(remoteData);
      return;
    }

    if (localHasData) {
      await saveAmanahData(localData);
      useAmanahStore.setState({
        saveStatus: "saved",
        saveError: null,
        lastSaved: new Date().toISOString(),
      });
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
