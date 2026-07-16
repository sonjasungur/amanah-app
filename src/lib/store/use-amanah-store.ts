"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { defaultAmanahData } from "@/lib/domain/defaults";
import { demoAmanahData } from "@/lib/domain/demo-data";
import { migrateRawData } from "@/lib/domain/migration";
import type { AmanahOrdnerData, DebtAmanahItem, DigitalLegacyItem } from "@/lib/domain/types";
import { STORAGE_KEY, type SaveStatus } from "@/lib/storage/types";
import { clearAmanahData } from "@/lib/storage/amanah-storage";
import { persistStoreChanges } from "@/lib/storage/store-sync";
import { pickDataFields } from "@/lib/store/store-utils";

const DATA_KEYS = Object.keys(defaultAmanahData) as (keyof AmanahOrdnerData)[];

interface AmanahStore extends AmanahOrdnerData {
  saveStatus: SaveStatus;
  saveError: string | null;
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

export const useAmanahStore = create<AmanahStore>()(
  persist(
    (set) => ({
      ...defaultAmanahData,
      saveStatus: "idle" as SaveStatus,
      saveError: null,
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
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => pickDataFields(state),
      merge: (persisted, current) => {
        const migrated = migrateRawData((persisted ?? {}) as Record<string, unknown>);
        return { ...current, ...migrated };
      },
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          useAmanahStore.setState({ saveStatus: "error", saveError: "Fehler beim Laden der gespeicherten Daten" });
        } else if (state) {
          useAmanahStore.setState({ saveStatus: "saved", saveError: null });
        }
      },
    }
  )
);

let saveDebounceTimer: ReturnType<typeof setTimeout> | null = null;

useAmanahStore.subscribe((state, prevState) => {
  const dataChanged = DATA_KEYS.some((key) => state[key] !== prevState[key]);
  if (!dataChanged || state.saveStatus !== "saving") return;

  if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
  saveDebounceTimer = setTimeout(() => {
    void persistStoreChanges();
  }, 400);
});

export async function resetAmanahStore(): Promise<void> {
  await clearAmanahData();
  useAmanahStore.setState({ ...defaultAmanahData, saveStatus: "saved", saveError: null, lastSaved: null });
}
