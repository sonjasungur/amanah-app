import { STORAGE_KEY } from "./types";

/**
 * What this browser keeps of a person's folder, and how it is removed.
 *
 * In API mode the account is authoritative and the browser holds only a working copy. That copy
 * belongs to one account: it is removed on logout, when another account signs in, and when a session
 * ends without a change still waiting to be sent. The local demo mode keeps its data, because the
 * browser is its only storage.
 */

/** Id of the account the working copy in this browser belongs to. Holds no folder content. */
export const DEVICE_OWNER_KEY = "amanah-ordner-owner";
export const UNSENT_CHANGE_KEY = "amanah-unsent-change";

const FAMILY_CONVERSATION_NOTES = "amanah-familiengespraech-v1";
const GUIDED_FLOW_PROGRESS = "amanah-guided-flow-state";
const AI_CONSENT_CHOICE = "amanah-ai-consent";
const CHECK_ANSWERS = "amanah-check-progress-v3";

/** Every localStorage key with folder content or per-person progress. */
export const DEVICE_LOCAL_KEYS = [
  STORAGE_KEY,
  UNSENT_CHANGE_KEY,
  DEVICE_OWNER_KEY,
  FAMILY_CONVERSATION_NOTES,
  GUIDED_FLOW_PROGRESS,
  AI_CONSENT_CHOICE,
] as const;

/** Every sessionStorage key with answers of the person. */
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

export function deviceDataOwner(): string | null {
  return storage("local")?.getItem(DEVICE_OWNER_KEY) ?? null;
}

export function markDeviceDataOwner(userId: string): void {
  try {
    storage("local")?.setItem(DEVICE_OWNER_KEY, userId);
  } catch {
    // Without a storage there is no working copy to protect.
  }
}

/** Whether a change of this account left a page before the account confirmed it. */
export function hasUnsentChangeOf(userId: string | null): boolean {
  return userId !== null && storage("local")?.getItem(UNSENT_CHANGE_KEY) === userId;
}

/** Drops the folder from memory and from this browser's storage. */
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
  const session = storage("session");
  for (const key of DEVICE_LOCAL_KEYS) local?.removeItem(key);
  for (const key of DEVICE_SESSION_KEYS) session?.removeItem(key);
}
