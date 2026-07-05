import { createEmergencyExportBundle, createExportBundle, type AmanahExportBundle } from "@/lib/domain/schema";
import { extractDataFromImport, normalizeData } from "@/lib/domain/migration";
import { validateImportData } from "@/lib/domain/validation";
import type { AmanahOrdnerData } from "@/lib/domain/types";
import { localStorageProvider } from "./local-storage-provider";
import { resolveStorageProvider } from "./storage-config";
import { STORAGE_KEY, type StorageProvider } from "./types";

export { STORAGE_KEY };

let provider: StorageProvider = localStorageProvider;

export function setStorageProvider(p: StorageProvider): void {
  provider = p;
}

export function getStorageProvider(): StorageProvider {
  if (typeof window !== "undefined") {
    return resolveStorageProvider();
  }
  return provider;
}

export async function loadAmanahData(): Promise<AmanahOrdnerData> {
  const data = await provider.load();
  return data ?? normalizeData({});
}

export async function saveAmanahData(data: AmanahOrdnerData): Promise<void> {
  await provider.save(data);
}

export async function clearAmanahData(): Promise<void> {
  await provider.clear();
}

export function exportToJson(data: AmanahOrdnerData): void {
  const bundle = createExportBundle(data);
  downloadJson(bundle, `amanah-ordner-${new Date().toISOString().split("T")[0]}.json`);
}

export function exportEmergencyFolder(data: AmanahOrdnerData): void {
  const bundle = createEmergencyExportBundle(data);
  downloadJson(bundle, `amanah-notfallmappe-${new Date().toISOString().split("T")[0]}.json`);
}

function downloadJson(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export interface ImportResult {
  success: boolean;
  data?: AmanahOrdnerData;
  errors?: string[];
  warnings?: string[];
}

export function parseImportJson(raw: unknown): ImportResult {
  try {
    if (!raw || typeof raw !== "object") {
      return { success: false, errors: ["Ungültige JSON-Datei"] };
    }

    const data = extractDataFromImport(raw as Record<string, unknown>);
    const validation = validateImportData(data);

    if (!validation.valid) {
      return { success: false, errors: validation.errors, warnings: validation.warnings };
    }

    return { success: true, data, warnings: validation.warnings };
  } catch {
    return { success: false, errors: ["Ungültige JSON-Datei"] };
  }
}

export function importFromJson(file: File): Promise<ImportResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        resolve(parseImportJson(parsed));
      } catch {
        resolve({ success: false, errors: ["Ungültige JSON-Datei"] });
      }
    };
    reader.onerror = () => resolve({ success: false, errors: ["Datei konnte nicht gelesen werden"] });
    reader.readAsText(file);
  });
}

export type { AmanahExportBundle };
