import type { SourceAuditCategory } from "@/lib/types";

/** Visible section labels for grouped sources */
export const SOURCE_SECTION_LABELS: Record<SourceAuditCategory, string> = {
  QURAN_PRIMARY: "Qur'an und authentische Sunnah",
  SAHIH_PRIMARY: "Qur'an und authentische Sunnah",
  LEGAL_GERMANY: "Deutsches Recht und Vorsorgedokumente",
  GENERAL_GUIDANCE: "Praktische Orientierung",
  FIQH_REVIEW_REQUIRED: "Fachliche Prüfung erforderlich",
};

export const SOURCE_SECTION_ORDER: SourceAuditCategory[] = [
  "QURAN_PRIMARY",
  "SAHIH_PRIMARY",
  "LEGAL_GERMANY",
  "GENERAL_GUIDANCE",
  "FIQH_REVIEW_REQUIRED",
];

export function auditCategoryForType(
  type: string,
  auditCategory?: SourceAuditCategory
): SourceAuditCategory {
  if (auditCategory) return auditCategory;
  switch (type) {
    case "quran":
      return "QURAN_PRIMARY";
    case "hadith":
      return "SAHIH_PRIMARY";
    case "official":
    case "legal":
      return "LEGAL_GERMANY";
    case "fiqh":
      return "FIQH_REVIEW_REQUIRED";
    default:
      return "GENERAL_GUIDANCE";
  }
}
