"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AmanahOrdnerData, DebtAmanahItem, DigitalLegacyItem } from "@/lib/types";
import { defaultAmanahData, STORAGE_KEY } from "@/lib/storage/amanah-store";

interface AmanahStore extends AmanahOrdnerData {
  updateField: <K extends keyof AmanahOrdnerData>(section: K, value: AmanahOrdnerData[K]) => void;
  updateNested: (section: string, field: string, value: unknown) => void;
  addDebtAmanah: (item: DebtAmanahItem) => void;
  removeDebtAmanah: (id: string) => void;
  addDigitalLegacy: (item: DigitalLegacyItem) => void;
  removeDigitalLegacy: (id: string) => void;
  setSelectedPath: (path: string) => void;
  reset: () => void;
  importData: (data: AmanahOrdnerData) => void;
}

export const useAmanahStore = create<AmanahStore>()(
  persist(
    (set) => ({
      ...defaultAmanahData,
      updateField: (section, value) =>
        set((state) => ({ ...state, [section]: value, lastSaved: new Date().toISOString() })),
      updateNested: (section, field, value) =>
        set((state) => ({
          ...state,
          [section]: { ...(state[section as keyof AmanahOrdnerData] as object), [field]: value },
          lastSaved: new Date().toISOString(),
        })),
      addDebtAmanah: (item) =>
        set((state) => ({
          ...state,
          debtsAmanah: [...state.debtsAmanah, item],
          lastSaved: new Date().toISOString(),
        })),
      removeDebtAmanah: (id) =>
        set((state) => ({
          ...state,
          debtsAmanah: state.debtsAmanah.filter((d) => d.id !== id),
          lastSaved: new Date().toISOString(),
        })),
      addDigitalLegacy: (item) =>
        set((state) => ({
          ...state,
          digitalLegacy: [...state.digitalLegacy, item],
          lastSaved: new Date().toISOString(),
        })),
      removeDigitalLegacy: (id) =>
        set((state) => ({
          ...state,
          digitalLegacy: state.digitalLegacy.filter((d) => d.id !== id),
          lastSaved: new Date().toISOString(),
        })),
      setSelectedPath: (path) => set({ selectedPath: path }),
      reset: () => set({ ...defaultAmanahData }),
      importData: (data) => set({ ...defaultAmanahData, ...data, lastSaved: new Date().toISOString() }),
    }),
    { name: STORAGE_KEY }
  )
);
