import type { AmanahOrdnerData } from "@/lib/domain/types";
import { defaultAmanahData } from "@/lib/domain/defaults";
import { getNestedValue } from "@/lib/domain/validation";
import { isAllowedFieldPath } from "./config";
import type { SuggestedUpdate } from "./types";

function setNestedValue(obj: AmanahOrdnerData, path: string, value: unknown): AmanahOrdnerData {
  const parts = path.split(".");
  if (parts.length === 2) {
    const [section, field] = parts;
    const sec = obj[section as keyof AmanahOrdnerData];
    if (sec && typeof sec === "object" && !Array.isArray(sec)) {
      return {
        ...obj,
        [section]: { ...(sec as object), [field]: value },
      } as AmanahOrdnerData;
    }
  }
  if (parts.length === 3) {
    const [section, nested, field] = parts;
    const sec = obj[section as keyof AmanahOrdnerData];
    if (sec && typeof sec === "object" && !Array.isArray(sec)) {
      const secObj = sec as unknown as Record<string, unknown>;
      const inner = secObj[nested];
      const updatedInner =
        inner && typeof inner === "object"
          ? { ...(inner as Record<string, unknown>), [field]: value }
          : { [field]: value };
      return {
        ...obj,
        [section]: { ...secObj, [nested]: updatedInner },
      } as AmanahOrdnerData;
    }
  }
  throw new Error(`Unsupported path: ${path}`);
}

export function applyConfirmedUpdates(
  data: AmanahOrdnerData,
  updates: SuggestedUpdate[],
  options?: { overwrite?: boolean }
): { data: AmanahOrdnerData; applied: string[]; rejected: string[] } {
  let result = { ...defaultAmanahData, ...data };
  const applied: string[] = [];
  const rejected: string[] = [];

  for (const update of updates) {
    if (!isAllowedFieldPath(update.fieldPath)) {
      rejected.push(update.fieldPath);
      continue;
    }

    const current = getNestedValue(result, update.fieldPath);
    const hasExisting =
      current !== null &&
      current !== undefined &&
      current !== "" &&
      current !== false;

    if (hasExisting && !options?.overwrite && String(current) !== String(update.value)) {
      rejected.push(`${update.fieldPath} (Konflikt — bestehender Wert bleibt)`);
      continue;
    }

    try {
      result = setNestedValue(result, update.fieldPath, update.value);
      applied.push(update.fieldPath);
    } catch {
      rejected.push(update.fieldPath);
    }
  }

  result.lastSaved = new Date().toISOString();
  return { data: result, applied, rejected };
}

export function validateUpdates(updates: SuggestedUpdate[]): { valid: SuggestedUpdate[]; invalid: string[] } {
  const valid: SuggestedUpdate[] = [];
  const invalid: string[] = [];
  for (const u of updates) {
    if (isAllowedFieldPath(u.fieldPath)) valid.push(u);
    else invalid.push(u.fieldPath);
  }
  return { valid, invalid };
}
