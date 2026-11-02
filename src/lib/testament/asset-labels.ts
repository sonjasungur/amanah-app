import type { AssetEntry } from "@/lib/domain/types";

export const ASSET_PRINT_TITLE = "Vermögensübersicht – kein Testament";

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

const ASSET_TEXT_LIMIT = 2000;

/** For untrusted input: keeps well-formed entries and known fields only. Amounts stay optional. */
export function sanitizeAssets(raw: unknown): AssetEntry[] {
  if (!Array.isArray(raw)) return [];
  const text = (value: unknown) => (typeof value === "string" && value.trim() ? value.slice(0, ASSET_TEXT_LIMIT) : undefined);
  return raw.flatMap((entry): AssetEntry[] => {
    const e = (entry ?? {}) as Partial<Record<keyof AssetEntry, unknown>>;
    const description = text(e.description);
    if (typeof e.id !== "string" || !e.id || !description || typeof e.type !== "string" || !(e.type in ASSET_TYPES)) return [];
    const asset: AssetEntry = { id: e.id.slice(0, 100), type: e.type as AssetEntry["type"], description };
    for (const key of ["approximateValue", "locationHint", "notes"] as const) {
      const value = text(e[key]);
      if (value) asset[key] = value;
    }
    if (typeof e.mortgage === "string" && e.mortgage in MORTGAGE) asset.mortgage = e.mortgage as AssetEntry["mortgage"];
    if (typeof e.ownership === "string" && e.ownership in OWNERSHIP) asset.ownership = e.ownership as AssetEntry["ownership"];
    return [asset];
  });
}

export const MORTGAGE: Record<NonNullable<AssetEntry["mortgage"]>, string> = { ja: "Ja", nein: "Nein", unsicher: "Weiß ich nicht" };
export const OWNERSHIP: Record<NonNullable<AssetEntry["ownership"]>, string> = { allein: "Allein", gemeinsam: "Gemeinsam", unsicher: "Weiß ich nicht" };
