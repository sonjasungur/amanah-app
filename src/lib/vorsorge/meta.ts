import type { PersonLinkField, VorsorgeAreaId, VorsorgeMeta } from "@/lib/domain/types";

export const VORSORGE_AREA_IDS: readonly VorsorgeAreaId[] = ["notfall", "familie", "gesundheit", "janazah", "dokumente", "vermoegen"];

export const PERSON_LINK_FIELDS: readonly PersonLinkField[] = [
  "emergencyContact1",
  "emergencyContact2",
  "authorizedPerson",
  "substitutePerson",
  "preferredGuardian",
  "janazahTrustedContact",
];

const MAX_ID_LENGTH = 100;

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isIsoTime(value: unknown): value is string {
  return typeof value === "string" && value.length <= 40 && !Number.isNaN(Date.parse(value));
}

function shortString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 && value.length <= MAX_ID_LENGTH ? value : null;
}

/** Keeps only known keys with fitting types: the folder may come from an import or an older version. */
export function normalizeVorsorgeMeta(raw: unknown): VorsorgeMeta {
  const source = isObject(raw) ? raw : {};
  const areaUpdatedAt: VorsorgeMeta["areaUpdatedAt"] = {};
  const rawAreas = isObject(source.areaUpdatedAt) ? source.areaUpdatedAt : {};
  for (const id of VORSORGE_AREA_IDS) {
    if (isIsoTime(rawAreas[id])) areaUpdatedAt[id] = rawAreas[id] as string;
  }
  const personLinks: VorsorgeMeta["personLinks"] = {};
  const rawLinks = isObject(source.personLinks) ? source.personLinks : {};
  for (const field of PERSON_LINK_FIELDS) {
    const id = shortString(rawLinks[field]);
    if (id) personLinks[field] = id;
  }
  return {
    areaUpdatedAt,
    flowStep: shortString(source.flowStep),
    flowPausedAt: isIsoTime(source.flowPausedAt) ? source.flowPausedAt : null,
    personLinks,
  };
}
