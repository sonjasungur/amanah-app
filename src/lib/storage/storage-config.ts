import { getStorageMode } from "@/lib/auth/config";
import { hasAuthSession } from "@/lib/auth/api-auth-provider";
import { localStorageProvider } from "./local-storage-provider";
import { apiStorageProvider } from "./api-storage-provider";
import type { StorageProvider } from "./types";

export function resolveStorageProvider(): StorageProvider {
  if (getStorageMode() === "api" && hasAuthSession()) {
    return apiStorageProvider;
  }
  return localStorageProvider;
}

export function getActiveStorageLabel(): "local" | "api" | "local-demo" {
  const mode = getStorageMode();
  if (mode === "api" && hasAuthSession()) return "api";
  if (typeof window !== "undefined" && hasAuthSession()) return "local-demo";
  return "local";
}
