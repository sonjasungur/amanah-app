import { defaultAmanahData } from "./defaults";
import { SCHEMA_VERSION } from "./schema";
import type { AmanahOrdnerData, DocumentType, FamilyConversation, FamilyTalk, TestamentPreparation } from "./types";
import { normalizeCheckProgress } from "@/lib/check/progress";
import { sanitizeBequests } from "@/lib/testament/bequests";
import { normalizeVorsorgeMeta } from "@/lib/vorsorge/meta";
import { normalizePowerOfAttorney } from "@/lib/vorsorge/power-of-attorney";
import { normalizeDigitalLegacy } from "@/lib/vorsorge/digital-legacy";
import { toIsoDate } from "@/lib/utils/date-input";

/** Birth dates typed as TT.MM.JJJJ in earlier versions become ISO; anything else stays as typed. */
const isoIfDate = (value: unknown): string => (typeof value === "string" ? (toIsoDate(value) ?? value) : "");

type LegacyRawData = Record<string, unknown>;

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function deepMerge<T extends Record<string, unknown>>(defaults: T, raw: LegacyRawData): T {
  const result = { ...defaults };
  for (const key of Object.keys(raw)) {
    const rawVal = raw[key];
    const defaultVal = defaults[key];
    if (Array.isArray(rawVal)) {
      (result as Record<string, unknown>)[key] = rawVal;
    } else if (isObject(rawVal) && isObject(defaultVal)) {
      (result as Record<string, unknown>)[key] = deepMerge(defaultVal, rawVal);
    } else if (rawVal !== undefined) {
      (result as Record<string, unknown>)[key] = rawVal;
    }
  }
  return result;
}

/** Migrate legacy data (v0, no schemaVersion) to current schema v1 */
export function migrateV0ToV1(raw: LegacyRawData): AmanahOrdnerData {
  const merged = deepMerge(defaultAmanahData as unknown as Record<string, unknown>, raw) as unknown as AmanahOrdnerData;
  return normalizeData(merged);
}

function normalizeTestamentPreparation(raw: unknown): TestamentPreparation {
  const prep = (isObject(raw) ? raw : defaultAmanahData.testamentPreparation) as unknown as TestamentPreparation;
  const wishes = isObject(prep.personalWishes) ? prep.personalWishes : defaultAmanahData.testamentPreparation.personalWishes;
  return { ...prep, personalWishes: { ...wishes, bequests: sanitizeBequests(wishes.bequests) } };
}

const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
const text = (v: unknown): string => (typeof v === "string" ? v : "");

/** Keeps only well-formed topic progress and talks; anything else from an old or broken copy is dropped. */
export function normalizeFamilyConversation(raw: unknown): FamilyConversation {
  const value = isObject(raw) ? (raw as Record<string, unknown>) : {};
  const topics: FamilyConversation["topics"] = {};
  if (isObject(value.topics)) {
    for (const [id, t] of Object.entries(value.topics as Record<string, unknown>)) {
      if (!isObject(t)) continue;
      const topic = t as Record<string, unknown>;
      topics[id] = { checkedQuestionIds: strings(topic.checkedQuestionIds), starredQuestionIds: strings(topic.starredQuestionIds), notes: text(topic.notes) };
    }
  }
  const talks = (Array.isArray(value.talks) ? value.talks : []).filter(isObject).slice(0, 100).map((t, i) => {
    const talk = t as Record<string, unknown>;
    const explained = text(talk.storageExplained);
    return {
      // Stable fallback ids: normalising the same copy twice must give the same folder.
      id: text(talk.id) || `talk-${i + 1}`,
      date: text(talk.date),
      personIds: strings(talk.personIds),
      otherPeople: text(talk.otherPeople),
      topicIds: strings(talk.topicIds),
      tasks: (Array.isArray(talk.tasks) ? talk.tasks : []).filter(isObject).map((k, j) => {
        const task = k as Record<string, unknown>;
        return { id: text(task.id) || `talk-${i + 1}-task-${j + 1}`, who: text(task.who), what: text(task.what), done: task.done === true };
      }),
      documentsToKnow: strings(talk.documentsToKnow) as DocumentType[],
      storageExplained: (["ja", "teilweise", "nein"].includes(explained) ? explained : "") as FamilyTalk["storageExplained"],
      openPoints: text(talk.openPoints),
    };
  });
  return { topics, talks };
}

export function normalizeData(data: Partial<AmanahOrdnerData>): AmanahOrdnerData {
  const merged = deepMerge(defaultAmanahData as unknown as Record<string, unknown>, data as LegacyRawData) as unknown as AmanahOrdnerData;
  return {
    ...merged,
    schemaVersion: SCHEMA_VERSION,
    familyMembers: (merged.familyMembers ?? []).map((m) => (m.birthDate ? { ...m, birthDate: isoIfDate(m.birthDate) } : m)),
    documents: merged.documents ?? [],
    assets: merged.assets ?? [],
    testamentPreparation: normalizeTestamentPreparation(merged.testamentPreparation),
    donations: merged.donations ?? [],
    importantInstructions: merged.importantInstructions ?? [],
    debtsAmanah: merged.debtsAmanah ?? [],
    // AP22 EA-18.1: old entries keep every field; only values of the wrong type are dropped.
    digitalLegacy: normalizeDigitalLegacy(merged.digitalLegacy ?? []),
    // AP22 EA-07: old free texts stay untouched; the structured wishes are cleaned if present.
    powerOfAttorney: normalizePowerOfAttorney(merged.powerOfAttorney),
    knowledgeBookmarks: Array.isArray(merged.knowledgeBookmarks)
      ? merged.knowledgeBookmarks.filter((s): s is string => typeof s === "string").slice(0, 200)
      : [],
    familyConversation: normalizeFamilyConversation(merged.familyConversation),
    reviewStatus: merged.reviewStatus ?? "draft",
    vorsorgeMeta: normalizeVorsorgeMeta(merged.vorsorgeMeta),
    userProfile: { ...merged.userProfile, birthDate: isoIfDate(merged.userProfile?.birthDate) },
    emergencyCard: { ...merged.emergencyCard, birthDate: isoIfDate(merged.emergencyCard?.birthDate) },
    janazahWishes: { ...merged.janazahWishes, birthDate: isoIfDate(merged.janazahWishes?.birthDate) },
    checkProgress: normalizeCheckProgress(merged.checkProgress ?? defaultAmanahData.checkProgress),
  };
}

export function migrateRawData(raw: LegacyRawData): AmanahOrdnerData {
  if (typeof raw.schemaVersion === "number" && raw.schemaVersion >= SCHEMA_VERSION) {
    return normalizeData(raw as Partial<AmanahOrdnerData>);
  }
  return migrateV0ToV1(raw);
}

/** Extract data payload from export bundle or legacy flat JSON */
export function extractDataFromImport(raw: LegacyRawData): AmanahOrdnerData {
  if (raw.data && isObject(raw.data)) {
    return migrateRawData(raw.data as LegacyRawData);
  }
  return migrateRawData(raw);
}
