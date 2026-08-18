import type { PricingPlan } from "@/lib/types";

/** Public one-time model only. Subscriptions and B2B are not part of the active offer. */
export const pricingPlans: PricingPlan[] = [
  {
    id: "free-check",
    name: "Amanah-Check",
    price: "0 €",
    features: ["Persönliche Auswertung", "Ein nächster Schritt", "Ohne Konto, ohne KI"],
    category: "free",
  },
  {
    id: "basic-pdf",
    name: "Mein Wille Basic",
    price: "29 €",
    features: ["Notfallkarte", "Janazah-Wünsche", "Familienbrief", "PDF-Export"],
    category: "one_time",
  },
  {
    id: "complete",
    name: "Mein Wille Komplett",
    price: "79 €",
    features: ["Alle Vorsorgebereiche", "Vollständiger PDF-Ordner", "JSON-Export", "Ampelcheck Erbe"],
    category: "one_time",
  },
  {
    id: "family",
    name: "Mein Wille Familie",
    price: "99 €",
    features: ["Maximal zwei Erwachsenenprofile", "Familienbrief", "Gemeinsame Notfallübersicht"],
    category: "one_time",
  },
];
