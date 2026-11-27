import type { DebtAmanahItem } from "@/lib/domain/types";

export const debtTypeLabels: Record<DebtAmanahItem["type"], string> = {
  debt_owed: "Schuld, die ich schulde",
  debt_owed_to_me: "Schuld, die mir geschuldet wird",
  borrowed: "Geliehenes (Amanah)",
  entrusted: "Anvertrautes (Amanah)",
  zakat: "Offene Zakat",
  kaffara: "Offene Kaffara",
  promise: "Offenes Versprechen",
  forgiveness: "Vergebung gewünscht",
  document: "Wichtiges Dokument",
};

/** @deprecated first version of the digital legacy; use DIGITAL_CATEGORY_LABELS / digitalKindLabel(). */
export { LEGACY_TYPE_LABELS as digitalTypeLabels } from "@/lib/vorsorge/digital-legacy";
