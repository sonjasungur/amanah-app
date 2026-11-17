import type { StateStorage } from "zustand/middleware";
import { getStorageMode } from "@/lib/auth/config";
import { hasAuthSession } from "@/lib/auth/api-auth-provider";
import { STORAGE_KEY } from "./types";

/**
 * What this browser keeps of a person's folder, and how it is removed.
 *
 * In API mode the account is authoritative and the browser holds only a working copy. While someone
 * is signed in, that copy lives in this tab only (sessionStorage): it ends with the tab and never
 * stays in the browser profile. It belongs to one account and is removed on logout, when another
 * account signs in, and when a session ends without a change still waiting to be sent. Without a
 * session (guest) and in the local demo mode the browser is the only storage, so localStorage stays.
 */

/** Id of the account the working copy belongs to. Holds no folder content. */
export const DEVICE_OWNER_KEY = "amanah-ordner-owner";
export const UNSENT_CHANGE_KEY = "amanah-unsent-change";

const FAMILY_CONVERSATION_NOTES = "amanah-familiengespraech-v1";
const GUIDED_FLOW_PROGRESS = "amanah-guided-flow-state";
const AI_CONSENT_CHOICE = "amanah-ai-consent";
const CHECK_ANSWERS = "amanah-check-progress-v3";

/** Keys that follow the folder: in the tab while signed in, otherwise in localStorage. */
const FOLDER_BOUND_KEYS = [STORAGE_KEY, UNSENT_CHANGE_KEY, DEVICE_OWNER_KEY, FAMILY_CONVERSATION_NOTES] as const;

/** Every key with folder content or per-person progress; a wipe removes them from both storages. */
export const DEVICE_LOCAL_KEYS = [...FOLDER_BOUND_KEYS, GUIDED_FLOW_PROGRESS, AI_CONSENT_CHOICE] as const;

/** Every sessionStorage-only key with answers of the person. */
export const DEVICE_SESSION_KEYS = [CHECK_ANSWERS] as const;

const memoryResets = new Set<() => void>();

/** Stores register how to drop what they hold in memory; called before the keys are removed. */
export function onDeviceDataWipe(reset: () => void): void {
  memoryResets.add(reset);
}

function storage(kind: "local" | "session"): Storage | null {
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

/** True while the working copy belongs to a signed-in account in API mode, and so lives in this tab. */
export function keepsFolderInTab(): boolean {
  return getStorageMode() === "api" && hasAuthSession();
}

function folderStorage(): Storage | null {
  return storage(keepsFolderInTab() ? "session" : "local");
}

/**
 * A copy kept in localStorage by an earlier version (or by a guest who has just signed in) moves into
 * this tab once and leaves localStorage. Nothing waiting to be sent is lost on the way; other tabs then
 * read the account instead.
 */
function adoptOlderCopies(): void {
  if (!keepsFolderInTab()) return;
  const local = storage("local");
  const tab = storage("session");
  if (!local || !tab) return;
  for (const key of FOLDER_BOUND_KEYS) {
    const older = local.getItem(key);
    if (older === null) continue;
    try {
      if (tab.getItem(key) === null) tab.setItem(key, older);
      local.removeItem(key);
    } catch {
      // A full tab storage keeps the older copy where it is rather than dropping it.
    }
  }
}

/** Storage for the folder and the notes: the tab while signed in, localStorage otherwise. */
export const folderBackedStorage: StateStorage = {
  getItem: (name) => {
    adoptOlderCopies();
    return folderStorage()?.getItem(name) ?? null;
  },
  setItem: (name, value) => {
    const target = folderStorage();
    if (!target) return;
    target.setItem(name, value); // may throw when full; the caller reports that
    if (keepsFolderInTab()) storage("local")?.removeItem(name);
  },
  removeItem: (name) => {
    storage("local")?.removeItem(name);
    storage("session")?.removeItem(name);
  },
};

function readEither(key: string): string | null {
  return storage("session")?.getItem(key) ?? storage("local")?.getItem(key) ?? null;
}

export function deviceDataOwner(): string | null {
  return readEither(DEVICE_OWNER_KEY);
}

export function markDeviceDataOwner(userId: string): void {
  try {
    folderStorage()?.setItem(DEVICE_OWNER_KEY, userId);
  } catch {
    // Without a storage there is no working copy to protect.
  }
}

/** Whether a change of this account left a page, or a save of it is running, without the account confirming it. */
export function hasUnsentChangeOf(userId: string | null): boolean {
  return userId !== null && readEither(UNSENT_CHANGE_KEY) === userId;
}

export function markUnsentChangeOf(userId: string): void {
  try {
    folderStorage()?.setItem(UNSENT_CHANGE_KEY, userId);
  } catch {
    // Without a storage only the request remains.
  }
}

export function clearUnsentChange(): void {
  storage("local")?.removeItem(UNSENT_CHANGE_KEY);
  storage("session")?.removeItem(UNSENT_CHANGE_KEY);
}

/** Drops the folder from memory and from both of this browser's storages. */
export function wipeDeviceData(): void {
  if (typeof window === "undefined") return;
  for (const reset of memoryResets) {
    try {
      reset();
    } catch {
      // One store failing must not keep the others' data.
    }
  }
  const local = storage("local");
  const tab = storage("session");
  for (const key of DEVICE_LOCAL_KEYS) {
    local?.removeItem(key);
    tab?.removeItem(key);
  }
  for (const key of DEVICE_SESSION_KEYS) tab?.removeItem(key);
}
