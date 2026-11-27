import type { AmanahOrdnerData } from "@/lib/domain/types";
import { getNestedValue } from "@/lib/domain/validation";
import { labelForField } from "@/lib/ai/context";
import { DIGITAL_LEGACY_APPEND_PATH } from "./config";
import type { PatchPreviewItem, SuggestedUpdate, UpdateConfidence } from "./types";

function confidenceToStatus(
  confidence: UpdateConfidence,
  hasClarification: boolean
): PatchPreviewItem["status"] {
  if (hasClarification) return "needs_clarification";
  if (confidence === "high") return "safe";
  if (confidence === "medium") return "uncertain";
  return "needs_clarification";
}

export function buildPatchPreview(
  data: AmanahOrdnerData,
  updates: SuggestedUpdate[],
  clarifications: string[] = []
): PatchPreviewItem[] {
  const hasClarification = clarifications.length > 0;
  return updates.map((u) => ({
    fieldPath: u.fieldPath,
    label: u.label || labelForField(u.fieldPath),
    moduleId: u.moduleId,
    // A new digital-legacy entry replaces nothing, so there is no old value to show.
    oldValue: u.fieldPath === DIGITAL_LEGACY_APPEND_PATH ? "" : (getNestedValue(data, u.fieldPath) ?? ""),
    newValue: u.value,
    confidence: u.confidence,
    status: confidenceToStatus(u.confidence, hasClarification && u.confidence !== "high"),
  }));
}

export function formatPreviewValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Ja" : "Nein";
  if (Array.isArray(value)) return value.length ? `${value.length} Einträge` : "—";
  return String(value);
}
