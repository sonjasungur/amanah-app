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

/**
 * Why a save to the account did not go through. Each kind has its own message, so that nobody sees a
 * generic failure for a missing consent or an expired session. The input always stays in this tab.
 */
export type SaveFailureKind = "consent" | "session" | "offline" | "server" | "rejected";

export const SAVE_FAILURE_MESSAGES: Record<SaveFailureKind, string> = {
  consent: "Für die Speicherung im Konto fehlt deine Einwilligung. Deine Eingaben bleiben in diesem Tab erhalten.",
  session: "Deine Anmeldung ist abgelaufen. Deine Eingaben bleiben in diesem Tab erhalten. Bitte melde dich erneut an.",
  offline: "Keine Verbindung zum Server. Deine Eingaben bleiben in diesem Tab und werden gesendet, sobald die Verbindung wieder steht.",
  server: "Der Server hat die Speicherung nicht bestätigt. Deine Eingaben bleiben in diesem Tab und werden erneut gesendet.",
  rejected: "Die Speicherung wurde abgelehnt. Deine Eingaben bleiben in diesem Tab erhalten.",
};

/** Kinds that can succeed later without the person doing anything. */
export const RETRYABLE_SAVE_FAILURES: readonly SaveFailureKind[] = ["offline", "server"];

export class SaveFailedError extends Error {
  constructor(
    public readonly kind: SaveFailureKind,
    message: string = SAVE_FAILURE_MESSAGES[kind],
  ) {
    super(message);
    this.name = "SaveFailedError";
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
