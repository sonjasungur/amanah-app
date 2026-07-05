import type { AmanahOrdnerData } from "@/lib/domain/types";
import { defaultAmanahData } from "@/lib/domain/defaults";

const DATA_KEYS = Object.keys(defaultAmanahData) as (keyof AmanahOrdnerData)[];

export function pickDataFields<T extends AmanahOrdnerData>(state: T): AmanahOrdnerData {
  return Object.fromEntries(DATA_KEYS.map((key) => [key, state[key]])) as unknown as AmanahOrdnerData;
}
