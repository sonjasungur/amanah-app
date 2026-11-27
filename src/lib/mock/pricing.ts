import type { PricingPlan } from "@/lib/types";

/** Public one-time model only. Subscriptions and B2B are not part of the active offer. */
export const pricingPlans: PricingPlan[] = [
  {
    id: "free-check",
    name: "Vorsorge-Check",
    price: "0 €",
    features: ["Persönliche Auswertung", "Ein nächster Schritt", "Ohne Konto, ohne KI"],
    category: "free",
  },
  {
    id: "basic-pdf",
    name: "Wasiyya Basic",
    price: "29 €",
    features: ["Notfallkarte", "Janazah-Wünsche", "Familienbrief", "PDF-Export"],
    category: "one_time",
  },
  {
    id: "complete",
    name: "Wasiyya Komplett",
    price: "79 €",
    features: ["Alle Vorsorgebereiche", "Vollständiger PDF-Ordner", "JSON-Export", "Erbprofil mit ersten Hinweisen"],
    category: "one_time",
  },
  {
    id: "family",
    name: "Wasiyya Familie",
    price: "99 €",
    features: ["Maximal zwei Erwachsenenprofile", "Familienbrief", "Gemeinsame Notfallübersicht"],
    category: "one_time",
  },
];
