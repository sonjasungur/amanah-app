import { defaultAmanahData } from "@/lib/domain/defaults";
import { migrateRawData } from "@/lib/domain/migration";
import type { AmanahOrdnerData } from "@/lib/domain/types";
import { STORAGE_KEY, type StorageProvider } from "./types";

function readRaw(): unknown {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function extractPersistedState(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  if (obj.state && typeof obj.state === "object") {
    return obj.state as Record<string, unknown>;
  }
  return obj;
}

export class LocalStorageProvider implements StorageProvider {
  async load(): Promise<AmanahOrdnerData | null> {
    const raw = readRaw();
    if (!raw) return null;

    const persisted = extractPersistedState(raw);
    if (!persisted) return null;

    const dataFields = { ...persisted };
    delete dataFields.saveStatus;
    delete dataFields.saveError;
    return migrateRawData(dataFields);
  }

  async save(data: AmanahOrdnerData): Promise<void> {
    if (typeof window === "undefined") return;
    const toSave = { ...data, lastSaved: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  }

  async clear(): Promise<void> {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEY);
  }
}

export const localStorageProvider = new LocalStorageProvider();

export function loadFromStorageSync(): AmanahOrdnerData {
  const raw = readRaw();
  if (!raw) return defaultAmanahData;
  const persisted = extractPersistedState(raw);
  if (!persisted) return defaultAmanahData;
  const dataFields = { ...persisted };
  delete dataFields.saveStatus;
  delete dataFields.saveError;
  return migrateRawData(dataFields);
}
