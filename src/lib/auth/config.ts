import type { AuthMode } from "./types";

export type StorageMode = "local" | "api";

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
