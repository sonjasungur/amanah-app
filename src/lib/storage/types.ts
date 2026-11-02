import type { AmanahOrdnerData } from "@/lib/domain/types";

/** "partial": saved in this browser, but the account stored only part of it (no Plus access). */
export type SaveStatus = "idle" | "saving" | "saved" | "partial" | "error";

export interface SaveResult {
  /** Sections the account did not store. */
  notStored?: string[];
  /** The account is close to its size limit. */
  nearLimit?: boolean;
}

export type FolderWriteScope = "full" | "free_sections";

export const STORAGE_KEY = "amanah-ordner-data";

export interface StorageProvider {
  load(): Promise<AmanahOrdnerData | null>;
  save(data: AmanahOrdnerData): Promise<SaveResult | void>;
  /** From the last load; only the account provider knows it. */
  lastWriteScope?(): FolderWriteScope;
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
