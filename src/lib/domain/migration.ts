import { defaultAmanahData } from "./defaults";
import { SCHEMA_VERSION } from "./schema";
import type { AmanahOrdnerData } from "./types";

type LegacyRawData = Record<string, unknown>;

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function deepMerge<T extends Record<string, unknown>>(defaults: T, raw: LegacyRawData): T {
  const result = { ...defaults };
  for (const key of Object.keys(raw)) {
    const rawVal = raw[key];
    const defaultVal = defaults[key];
    if (Array.isArray(rawVal)) {
      (result as Record<string, unknown>)[key] = rawVal;
    } else if (isObject(rawVal) && isObject(defaultVal)) {
      (result as Record<string, unknown>)[key] = deepMerge(defaultVal, rawVal);
    } else if (rawVal !== undefined) {
      (result as Record<string, unknown>)[key] = rawVal;
    }
  }
  return result;
}

/** Migrate legacy data (v0, no schemaVersion) to current schema v1 */
export function migrateV0ToV1(raw: LegacyRawData): AmanahOrdnerData {
  const merged = deepMerge(defaultAmanahData as unknown as Record<string, unknown>, raw) as unknown as AmanahOrdnerData;
  return normalizeData(merged);
}

export function normalizeData(data: Partial<AmanahOrdnerData>): AmanahOrdnerData {
  const merged = deepMerge(defaultAmanahData as unknown as Record<string, unknown>, data as LegacyRawData) as unknown as AmanahOrdnerData;
  return {
    ...merged,
    schemaVersion: SCHEMA_VERSION,
    familyMembers: merged.familyMembers ?? [],
    documents: merged.documents ?? [],
    assets: merged.assets ?? [],
    donations: merged.donations ?? [],
    importantInstructions: merged.importantInstructions ?? [],
    debtsAmanah: merged.debtsAmanah ?? [],
    digitalLegacy: merged.digitalLegacy ?? [],
    reviewStatus: merged.reviewStatus ?? "draft",
  };
}

export function migrateRawData(raw: LegacyRawData): AmanahOrdnerData {
  if (typeof raw.schemaVersion === "number" && raw.schemaVersion >= SCHEMA_VERSION) {
    return normalizeData(raw as Partial<AmanahOrdnerData>);
  }
  return migrateV0ToV1(raw);
}

/** Extract data payload from export bundle or legacy flat JSON */
export function extractDataFromImport(raw: LegacyRawData): AmanahOrdnerData {
  if (raw.data && isObject(raw.data)) {
    return migrateRawData(raw.data as LegacyRawData);
  }
  return migrateRawData(raw);
}
