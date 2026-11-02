"use client";

import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";
import { defaultAmanahData } from "@/lib/domain/defaults";
import { demoAmanahData } from "@/lib/domain/demo-data";
import { migrateRawData } from "@/lib/domain/migration";
import type { AmanahOrdnerData, DebtAmanahItem, DigitalLegacyItem } from "@/lib/domain/types";
import { STORAGE_KEY, type SaveStatus } from "@/lib/storage/types";
import { clearAmanahData } from "@/lib/storage/amanah-storage";
import { persistStoreChanges, saveBeforeLeaving } from "@/lib/storage/store-sync";
import { pickDataFields } from "@/lib/store/store-utils";

const DATA_KEYS = Object.keys(defaultAmanahData) as (keyof AmanahOrdnerData)[];

interface AmanahStore extends AmanahOrdnerData {
  saveStatus: SaveStatus;
  saveError: string | null;
  saveNearLimit: boolean;
  updateField: <K extends keyof AmanahOrdnerData>(section: K, value: AmanahOrdnerData[K]) => void;
  updateNested: (section: string, field: string, value: unknown) => void;
  addDebtAmanah: (item: DebtAmanahItem) => void;
  removeDebtAmanah: (id: string) => void;
  addDigitalLegacy: (item: DigitalLegacyItem) => void;
  removeDigitalLegacy: (id: string) => void;
  setSelectedPath: (path: string) => void;
  reset: () => void;
  importData: (data: AmanahOrdnerData) => void;
  loadDemoData: () => void;
}

/**
 * A full browser storage must not take the page down with it: the input stays in the running
 * page, and the person is told that it was not saved here.
 */
const STORAGE_FULL_MESSAGE = "Der Speicher dieses Browsers ist voll. Bitte kürze längere Texte oder sichere deine Daten als Export.";

const guardedLocalStorage: StateStorage = {
  getItem: (name) => localStorage.getItem(name),
  removeItem: (name) => localStorage.removeItem(name),
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value);
    } catch {
      queueMicrotask(() => {
        // setState persists again: reporting the same failure twice would never end.
        if (useAmanahStore.getState().saveError === STORAGE_FULL_MESSAGE) return;
        useAmanahStore.setState({ saveStatus: "error", saveError: STORAGE_FULL_MESSAGE });
      });
    }
  },
};

/** Throws without a browser storage, so that the server renders without persistence. */
function browserStorage(): StateStorage {
  void localStorage;
  return guardedLocalStorage;
}

export const useAmanahStore = create<AmanahStore>()(
  persist(
    (set) => ({
      ...defaultAmanahData,
      saveStatus: "idle" as SaveStatus,
      saveError: null,
      saveNearLimit: false,
      updateField: (section, value) =>
        set((state) => ({ ...state, [section]: value, saveStatus: "saving" as SaveStatus, saveError: null })),
      updateNested: (section, field, value) =>
        set((state) => ({
          ...state,
          [section]: { ...(state[section as keyof AmanahOrdnerData] as object), [field]: value },
          saveStatus: "saving" as SaveStatus,
          saveError: null,
        })),
      addDebtAmanah: (item) =>
        set((state) => ({
          ...state,
          debtsAmanah: [...state.debtsAmanah, item],
          saveStatus: "saving" as SaveStatus,
          saveError: null,
        })),
      removeDebtAmanah: (id) =>
        set((state) => ({
          ...state,
          debtsAmanah: state.debtsAmanah.filter((d) => d.id !== id),
          saveStatus: "saving" as SaveStatus,
          saveError: null,
        })),
      addDigitalLegacy: (item) =>
        set((state) => ({
          ...state,
          digitalLegacy: [...state.digitalLegacy, item],
          saveStatus: "saving" as SaveStatus,
          saveError: null,
        })),
      removeDigitalLegacy: (id) =>
        set((state) => ({
          ...state,
          digitalLegacy: state.digitalLegacy.filter((d) => d.id !== id),
          saveStatus: "saving" as SaveStatus,
          saveError: null,
        })),
      setSelectedPath: (path) => set({ selectedPath: path, saveStatus: "saving" as SaveStatus }),
      reset: () => set({ ...defaultAmanahData, saveStatus: "saved" as SaveStatus, saveError: null }),
      importData: (data) =>
        set({ ...defaultAmanahData, ...migrateRawData(data as unknown as Record<string, unknown>), saveStatus: "saved" as SaveStatus, saveError: null, lastSaved: new Date().toISOString() }),
      loadDemoData: () =>
        set({ ...demoAmanahData, saveStatus: "saved" as SaveStatus, saveError: null, lastSaved: new Date().toISOString() }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(browserStorage),
      partialize: (state) => pickDataFields(state),
      merge: (persisted, current) => {
        const migrated = migrateRawData((persisted ?? {}) as Record<string, unknown>);
        return { ...current, ...migrated };
      },
      // Local storage answers synchronously, so this runs while `useAmanahStore` is still being created.
      // Touching it right away throws, and the store would never report itself as hydrated.
      onRehydrateStorage: () => (state, error) => {
        queueMicrotask(() => {
          if (error) {
            useAmanahStore.setState({ saveStatus: "error", saveError: "Fehler beim Laden der gespeicherten Daten" });
          } else if (state) {
            useAmanahStore.setState({ saveStatus: "saved", saveError: null });
          }
        });
      },
    }
  )
);

let saveDebounceTimer: ReturnType<typeof setTimeout> | null = null;

export function cancelPendingSave(): void {
  if (saveDebounceTimer) {
    clearTimeout(saveDebounceTimer);
    saveDebounceTimer = null;
  }
}

useAmanahStore.subscribe((state, prevState) => {
  const dataChanged = DATA_KEYS.some((key) => state[key] !== prevState[key]);
  if (!dataChanged || state.saveStatus !== "saving") return;

  if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
  saveDebounceTimer = setTimeout(() => {
    saveDebounceTimer = null;
    void persistStoreChanges();
  }, 400);
});

if (typeof window !== "undefined") {
  const sendPendingSave = () => {
    if (!saveDebounceTimer) return;
    cancelPendingSave();
    saveBeforeLeaving();
  };
  window.addEventListener("pagehide", sendPendingSave);
  // Phones often close background tabs without a pagehide.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") sendPendingSave();
  });
}

export async function resetAmanahStore(): Promise<void> {
  cancelPendingSave();
  await clearAmanahData();
  useAmanahStore.setState({ ...defaultAmanahData, saveStatus: "saved", saveError: null, lastSaved: null });
}
