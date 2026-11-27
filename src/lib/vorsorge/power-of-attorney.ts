import { SECRET_WITHHELD, isSecretLike } from "@/lib/validation/secret-like";
import type { AmanahOrdnerData, PoaAreaChoice, PoaAreaId, PoaHolder, PowerOfAttorney, PowerOfAttorneyWishes } from "@/lib/domain/types";

/**
 * AP22 EA-07: wishes for a power of attorney, structured. The first version had one free text per
 * area. Those texts are never changed or dropped: they stay in their fields and are shown as
 * "Früher eingetragen". The structure is derived from them until the person saves the new form
 * (Datenlandkarte §4.1, migration EA-07.3). Every output reads through powerOfAttorneyWishes().
 */

export const POA_AREAS: readonly { id: PoaAreaId; label: string }[] = [
  { id: "health", label: "Gesundheit" },
  { id: "authorities", label: "Behörden" },
  { id: "finance", label: "Finanzen und Bank" },
  { id: "housing", label: "Wohnung" },
  { id: "care", label: "Pflege" },
  { id: "mail", label: "Post und Fernmeldeverkehr" },
];

export const POA_HOLDER_LABELS: Record<PoaHolder, string> = {
  authorized: "Vorgesehene Person",
  substitute: "Ersatzperson",
  other: "Andere Person aus Familie & Kontakte",
  none: "Niemand / nicht gewünscht",
  undecided: "Noch nicht festgelegt",
};

export const POA_CHOICE_LABELS = { ja: "Ja", nein: "Nein", offen: "Noch offen" } as const;

/** Old free-text fields and where their topic lives now. */
export const POA_LEGACY_FIELDS: readonly { key: keyof PowerOfAttorney; label: string; area?: PoaAreaId; movedTo?: { label: string; href: string } }[] = [
  { key: "medical", label: "Medizinisch", area: "health" },
  { key: "authorities", label: "Behörden", area: "authorities" },
  { key: "bank", label: "Bank", area: "finance" },
  { key: "housing", label: "Wohnung", area: "housing" },
  { key: "care", label: "Pflege", area: "care" },
  { key: "burial", label: "Bestattung", movedTo: { label: "Janazah-Wünsche", href: "/dashboard/janazah" } },
  { key: "documents", label: "Dokumente", movedTo: { label: "Wichtige Dokumente", href: "/dashboard/dokumente" } },
  { key: "digitalAccounts", label: "Digitale Konten", movedTo: { label: "Digitaler Nachlass", href: "/dashboard/digitaler-nachlass" } },
  { key: "excludedPersons", label: "Wer soll NICHT entscheiden?" },
];

const AREA_IDS = POA_AREAS.map((a) => a.id);
const HOLDERS: readonly PoaHolder[] = ["authorized", "substitute", "other", "none", "undecided"];
const YES_NO_OPEN = ["ja", "nein", "offen", ""] as const;

const text = (v: unknown): string => (typeof v === "string" ? v : "");
const isObject = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === "object" && !Array.isArray(v);

/** "ja", "ja.", "x" (any case) count as "yes, the preferred person" (Datenlandkarte §4.1). */
export function isLegacyYes(value: string): boolean {
  return ["ja", "ja.", "x"].includes(value.trim().toLowerCase());
}

const undecided = (): PoaAreaChoice => ({ holder: "undecided" });

export function emptyPoaWishes(): PowerOfAttorneyWishes {
  return {
    version: 1,
    scope: "all",
    areas: Object.fromEntries(AREA_IDS.map((id) => [id, undecided()])) as Record<PoaAreaId, PoaAreaChoice>,
    onlineAccounts: "",
    beyondDeath: "",
    additionalNotes: "",
  };
}

/**
 * Derives the structure from the free texts of the first version. Pure and repeatable: the same
 * old fields always give the same result, and the old fields are not touched.
 * - "ja"/"x" → the preferred person; empty or any other text → not decided (the text stays visible).
 * - All five old areas "ja", or no old area text at all → "all matters" (the default).
 * - Otherwise → split per area. "Post und Fernmeldeverkehr" is new and starts undecided.
 */
export function migrateLegacyPowerOfAttorney(poa: Partial<PowerOfAttorney> | undefined): PowerOfAttorneyWishes {
  const result = emptyPoaWishes();
  const legacyAreas = POA_LEGACY_FIELDS.filter((f) => f.area);
  const values = legacyAreas.map((f) => text(poa?.[f.key]).trim());
  for (const [i, field] of legacyAreas.entries()) {
    result.areas[field.area!] = isLegacyYes(values[i]) ? { holder: "authorized" } : undecided();
  }
  const allYes = values.every((v) => isLegacyYes(v));
  const allEmpty = values.every((v) => v === "");
  result.scope = allYes || allEmpty ? "all" : "split";
  return result;
}

function normalizeChoice(raw: unknown): PoaAreaChoice {
  if (!isObject(raw)) return undecided();
  const holder = HOLDERS.includes(raw.holder as PoaHolder) ? (raw.holder as PoaHolder) : "undecided";
  if (holder !== "other") return { holder };
  const personId = text(raw.personId).slice(0, 100);
  const personName = text(raw.personName).slice(0, 200);
  return { holder, ...(personId ? { personId } : {}), ...(personName ? { personName } : {}) };
}

/** Keeps only known keys with fitting values; anything else from an import or an old copy is dropped. */
export function normalizePoaWishes(raw: unknown): PowerOfAttorneyWishes | undefined {
  if (!isObject(raw)) return undefined;
  const areasRaw = isObject(raw.areas) ? raw.areas : {};
  const pick = <T extends string>(v: unknown, allowed: readonly T[]): T => (allowed.includes(v as T) ? (v as T) : ("" as T));
  return {
    version: 1,
    scope: raw.scope === "split" ? "split" : "all",
    areas: Object.fromEntries(AREA_IDS.map((id) => [id, normalizeChoice(areasRaw[id])])) as Record<PoaAreaId, PoaAreaChoice>,
    onlineAccounts: pick(raw.onlineAccounts, YES_NO_OPEN),
    beyondDeath: pick(raw.beyondDeath, YES_NO_OPEN),
    additionalNotes: text(raw.additionalNotes).slice(0, 5000),
  };
}

/** Folder normalisation: keeps every old field as it is and cleans the structured part, if there is one. */
export function normalizePowerOfAttorney(poa: PowerOfAttorney): PowerOfAttorney {
  const wishes = normalizePoaWishes(poa.wishes);
  const { wishes: _drop, ...rest } = poa;
  void _drop;
  return wishes ? { ...rest, wishes } : rest;
}

/** The structured wishes: saved ones, or derived from the old free texts (read fallback, §7 R-5). */
export function powerOfAttorneyWishes(poa: PowerOfAttorney): PowerOfAttorneyWishes {
  return normalizePoaWishes(poa.wishes) ?? migrateLegacyPowerOfAttorney(poa);
}

export function hasSavedPoaWishes(poa: PowerOfAttorney): boolean {
  return normalizePoaWishes(poa.wishes) !== undefined;
}

/** Old free texts that still hold something, in a fixed order. */
export function legacyPoaEntries(poa: PowerOfAttorney): { key: keyof PowerOfAttorney; label: string; value: string; movedTo?: { label: string; href: string } }[] {
  return POA_LEGACY_FIELDS.flatMap((f) => {
    const value = text(poa[f.key]).trim();
    return value ? [{ key: f.key, label: f.label, value, movedTo: f.movedTo }] : [];
  });
}

/** Name of the person behind a holder, or null when nobody is named yet. */
export function holderName(data: Pick<AmanahOrdnerData, "powerOfAttorney" | "familyMembers">, choice: PoaAreaChoice): string | null {
  const poa = data.powerOfAttorney;
  switch (choice.holder) {
    case "authorized":
      return poa.authorizedPerson.trim() || null;
    case "substitute":
      return poa.substitutePerson.trim() || null;
    case "other": {
      const person = choice.personId ? data.familyMembers.find((m) => m.id === choice.personId) : undefined;
      return person?.name.trim() || choice.personName?.trim() || null;
    }
    default:
      return null;
  }
}

/** One line per area for outputs, e.g. "Vorgesehene Person (Yusuf)". */
export function describeAreaChoice(data: Pick<AmanahOrdnerData, "powerOfAttorney" | "familyMembers">, choice: PoaAreaChoice): string {
  const name = holderName(data, choice);
  if (choice.holder === "other") return name ? `Andere Person: ${name}` : "Andere Person (noch nicht gewählt)";
  const label = POA_HOLDER_LABELS[choice.holder];
  return name ? `${label} (${name})` : label;
}

/**
 * Rows for every output (PDF, emergency package, export). New structure first; old texts follow as
 * "früher eingetragen", so nothing that was entered disappears from a printout.
 */
export function powerOfAttorneyRows(data: Pick<AmanahOrdnerData, "powerOfAttorney" | "familyMembers">): [string, string | null][] {
  const poa = data.powerOfAttorney;
  const wishes = powerOfAttorneyWishes(poa);
  const value = (v: string) => (v.trim() ? (isSecretLike(v) ? SECRET_WITHHELD : v.trim()) : null);
  const hasPerson = Boolean(poa.authorizedPerson.trim());
  const rows: [string, string | null][] = [
    ["Vorgesehene Person", value(poa.authorizedPerson)],
    ["Ersatzperson", value(poa.substitutePerson)],
  ];
  if (hasPerson || hasSavedPoaWishes(poa) || wishes.scope === "split") {
    rows.push(["Umfang", wishes.scope === "all" ? "Alle Angelegenheiten durch die vorgesehene Person" : "Aufteilung nach Bereichen"]);
  }
  if (wishes.scope === "split") {
    for (const area of POA_AREAS) rows.push([area.label, describeAreaChoice(data, wishes.areas[area.id])]);
  }
  if (wishes.onlineAccounts) rows.push(["Auch für Online-Konten", POA_CHOICE_LABELS[wishes.onlineAccounts]]);
  if (wishes.beyondDeath) rows.push(["Auch über den Tod hinaus", POA_CHOICE_LABELS[wishes.beyondDeath]]);
  rows.push(["Zusätzliche Hinweise", value(wishes.additionalNotes)]);
  for (const legacy of legacyPoaEntries(poa)) rows.push([`${legacy.label} (früher eingetragen)`, value(legacy.value)]);
  return rows;
}
