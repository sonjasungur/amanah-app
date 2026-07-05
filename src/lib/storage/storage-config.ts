import { getStorageMode } from "@/lib/auth/config";
import { getAuthToken } from "@/lib/auth/api-auth-provider";
import { localStorageProvider } from "./local-storage-provider";
import { apiStorageProvider } from "./api-storage-provider";
import type { StorageProvider } from "./types";

export function resolveStorageProvider(): StorageProvider {
  if (getStorageMode() === "api" && getAuthToken()) {
    return apiStorageProvider;
  }
  return localStorageProvider;
}

export function getActiveStorageLabel(): "local" | "api" | "local-demo" {
  const mode = getStorageMode();
  if (mode === "api" && getAuthToken()) return "api";
  if (typeof window !== "undefined" && getAuthToken()) return "local-demo";
  return "local";
}
