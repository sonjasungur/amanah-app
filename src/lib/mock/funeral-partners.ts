import type { FuneralPartner } from "@/lib/types";

/** No mock partners. A public directory is only shown when real, reviewed entries exist. */
export const funeralPartners: FuneralPartner[] = [];

export function searchFuneralPartners(query: string): FuneralPartner[] {
  const q = query.toLowerCase().trim();
  if (!q) return funeralPartners;
  return funeralPartners.filter(
    (p) =>
      p.city.toLowerCase().includes(q) ||
      p.plzRange.includes(q) ||
      p.name.toLowerCase().includes(q)
  );
}
