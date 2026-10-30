import type { AuthMode } from "./types";

export type StorageMode = "local" | "api";

/** Shared by client forms and server repositories (NIST SP 800-63B minimum). */
export const MIN_PASSWORD_LENGTH = 8;
export const PASSWORD_REQUIREMENT_ERROR = `E-Mail und Passwort (min. ${MIN_PASSWORD_LENGTH} Zeichen) erforderlich.`;

export function getAuthMode(): AuthMode {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_AUTH_MODE === "api") {
    return "api";
  }
  return "local";
}

export function getStorageMode(): StorageMode {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_STORAGE_MODE === "api") {
    return "api";
  }
  return "local";
}

export function isApiStorageEnabled(): boolean {
  return getStorageMode() === "api";
}
