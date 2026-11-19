import type { DebtAmanahItem, DigitalLegacyItem } from "@/lib/domain/types";

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

export const digitalTypeLabels: Record<DigitalLegacyItem["type"], string> = {
  email: "E-Mail-Konto",
  password_manager: "Passwort-Manager",
  emergency_access: "Notfallzugang",
  banking: "Online-Banking",
  paypal: "PayPal / Zahlungsdienst",
  subscription: "Abonnement",
  social: "Social Media",
  cloud: "Cloud-Speicher",
  domain: "Domain / Website",
  file: "Wichtige Datei",
};
