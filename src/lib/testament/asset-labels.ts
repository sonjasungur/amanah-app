import type { AssetEntry } from "@/lib/domain/types";

export const ASSET_TYPES: Record<AssetEntry["type"], string> = {
  bank: "Bankkonto",
  real_estate: "Immobilie",
  investment: "Aktien oder Wertpapiere",
  pension: "Rente oder Pension",
  life_insurance: "Lebensversicherung",
  gold_silver: "Gold und Silber",
  business: "Unternehmen",
  vehicle: "Fahrzeug",
  other: "Sonstiges",
};

export const MORTGAGE: Record<NonNullable<AssetEntry["mortgage"]>, string> = { ja: "Ja", nein: "Nein", unsicher: "Weiß ich nicht" };
export const OWNERSHIP: Record<NonNullable<AssetEntry["ownership"]>, string> = { allein: "Allein", gemeinsam: "Gemeinsam", unsicher: "Weiß ich nicht" };
