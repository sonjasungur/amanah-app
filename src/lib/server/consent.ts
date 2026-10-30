import { CONSENT_PURPOSES, type ConsentPurpose } from "@/lib/consent/purposes";
import type { RepositoryConsent, ServerRepository } from "./repository/types";

/** Active = granted for the current text version and not withdrawn. */
export function findActiveConsent(records: RepositoryConsent[], purpose: ConsentPurpose): RepositoryConsent | null {
  const version = CONSENT_PURPOSES[purpose].version;
  return records.find((r) => r.purpose === purpose && r.textVersion === version && !r.revokedAt) ?? null;
}

export async function hasActiveConsent(repo: ServerRepository, userId: string, purpose: ConsentPurpose): Promise<boolean> {
  return findActiveConsent(await repo.listConsents(userId), purpose) !== null;
}

export const CONSENT_REQUIRED_RESPONSE = {
  error: "Für die Speicherung im Konto ist deine ausdrückliche Einwilligung nötig.",
  code: "consent_required",
  purpose: "sensitive_folder_storage",
} as const;
