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

/** Why the account's folder is not known in this browser. Nothing is saved until it is. */
export type FolderProblem = "unreadable" | "load_failed";

export const STORAGE_KEY = "amanah-ordner-data";

/** Sent by the API when a stored folder exists but cannot be decrypted. */
export const FOLDER_UNREADABLE_CODE = "folder_unreadable";

/** The account holds data that cannot be read right now: nothing may be saved over it. */
export class FolderUnreadableError extends Error {
  constructor(message = "Deine gespeicherten Daten sind gerade nicht lesbar. Sie wurden nicht verändert.") {
    super(message);
    this.name = "FolderUnreadableError";
  }
}

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
