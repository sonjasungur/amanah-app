import type { AmanahOrdnerData } from "@/lib/domain/types";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export const STORAGE_KEY = "amanah-ordner-data";

export interface StorageProvider {
  load(): Promise<AmanahOrdnerData | null>;
  save(data: AmanahOrdnerData): Promise<void>;
  clear(): Promise<void>;
}

export interface SaveState {
  status: SaveStatus;
  saveError: string | null;
  lastSaved: string | null;
}

export const initialSaveState: SaveState = {
  status: "idle",
  saveError: null,
  lastSaved: null,
};
