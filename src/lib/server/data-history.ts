import type { AmanahOrdnerData } from "@/lib/domain/types";
import { openFromStorage, sealForStorage } from "./data-encryption";

/**
 * Change history of the personal folder, prepared but off (AMANAH_DATA_HISTORY=true turns it on).
 *
 * A version holds only the earlier values of the sections that changed, sealed with the same
 * owner-bound encryption as the folder. Going back to a version overlays the versions from the
 * newest down to it. Rules below are proposals for the privacy review (Doku 38).
 */
export const HISTORY_RETENTION_DAYS = 90;
export const HISTORY_MAX_VERSIONS = 50;
export const HISTORY_MAX_BYTES = 5 * 1024 * 1024;
/** Autosave fires while typing: changes within this window count as one change. */
export const HISTORY_COALESCE_MS = 10 * 60 * 1000;

const VERSION_KIND = "amanah-data-version";
const DAY_MS = 24 * 60 * 60 * 1000;

/** What people entered. Progress, navigation and bookkeeping fields are not history. */
export const HISTORY_SECTIONS = [
  "userProfile",
  "familyMembers",
  "emergencyCard",
  "medicalWishes",
  "powerOfAttorney",
  "careDirective",
  "janazahWishes",
  "ghuslKafan",
  "burialPreference",
  "inheritanceProfile",
  "testamentPreparation",
  "documents",
  "assets",
  "debtsAmanah",
  "digitalLegacy",
  "donations",
  "importantInstructions",
  "barzakhPlan",
  "sadaqaJariya",
  "familyMessage",
] as const satisfies readonly (keyof AmanahOrdnerData)[];

export type HistorySection = (typeof HISTORY_SECTIONS)[number];
export type ChangeType = "save" | "restore";

export interface VersionPayload {
  kind: typeof VERSION_KIND;
  seq: number;
  sections: string[];
  prior: Record<string, unknown>;
}

export interface VersionRowInfo {
  id: string;
  seq: number;
  changeType: string;
  sizeBytes: number;
  createdAt: Date;
}

export function isDataHistoryEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.AMANAH_DATA_HISTORY === "true";
}

export function retentionCutoff(now: Date = new Date()): Date {
  return new Date(now.getTime() - HISTORY_RETENTION_DAYS * DAY_MS);
}

const SECRET_FIELD = /pass(word|wort)|^pin$|secret|token|api.?key|private.?key|schl(ue|ü)ssel/i;

/** No field in the data model holds a secret; imported or older data must not bring one into the history. */
export function stripSecretFields<T>(value: T): T {
  if (Array.isArray(value)) return value.map(stripSecretFields) as T;
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value).filter(([key]) => !SECRET_FIELD.test(key)).map(([key, v]) => [key, stripSecretFields(v)]),
  ) as T;
}

/** Moving through the questionnaire is no change of content. */
function comparable(section: HistorySection, data: AmanahOrdnerData): string {
  if (section === "testamentPreparation") {
    return JSON.stringify({ ...data.testamentPreparation, currentStep: 0 });
  }
  return JSON.stringify(data[section]);
}

export function changedSections(before: AmanahOrdnerData, after: AmanahOrdnerData): HistorySection[] {
  return HISTORY_SECTIONS.filter((section) => comparable(section, before) !== comparable(section, after));
}

export type HistoryPlan =
  | { kind: "none" }
  | { kind: "create"; seq: number; payload: VersionPayload }
  | { kind: "extend"; id: string; seq: number; payload: VersionPayload };

/** Decides what a write adds to the history. Pure, so both repositories behave alike. */
export function planHistoryWrite(input: {
  before: AmanahOrdnerData;
  after: AmanahOrdnerData;
  latest: { row: VersionRowInfo; payload: VersionPayload | null } | null;
  changeType: ChangeType;
  now?: Date;
}): HistoryPlan {
  const sections = changedSections(input.before, input.after);
  if (sections.length === 0) return { kind: "none" };
  const prior = Object.fromEntries(sections.map((s) => [s, stripSecretFields(input.before[s])]));
  const seq = (input.latest?.row.seq ?? 0) + 1;
  const tooLarge = (payload: VersionPayload) => Buffer.byteLength(JSON.stringify(payload), "utf8") > HISTORY_MAX_BYTES;
  const latest = input.latest;
  const withinWindow = latest && (input.now ?? new Date()).getTime() - latest.row.createdAt.getTime() < HISTORY_COALESCE_MS;
  if (input.changeType === "save" && withinWindow && latest.payload && latest.row.changeType === "save") {
    // The oldest value within the window is the one worth going back to.
    const payload = {
      ...latest.payload,
      sections: [...new Set([...latest.payload.sections, ...sections])],
      prior: { ...prior, ...latest.payload.prior },
    };
    return tooLarge(payload) ? { kind: "none" } : { kind: "extend", id: latest.row.id, seq: latest.row.seq, payload };
  }
  const payload: VersionPayload = { kind: VERSION_KIND, seq, sections, prior };
  // A single change above the account limit is not kept: the limit holds without exception.
  return tooLarge(payload) ? { kind: "none" } : { kind: "create", seq, payload };
}

/** Oldest first: everything past its retention, then whatever exceeds the count or size limit. */
export function versionsToPrune(rows: VersionRowInfo[], now: Date = new Date()): string[] {
  const cutoff = retentionCutoff(now);
  const prune = new Set(rows.filter((r) => r.createdAt < cutoff).map((r) => r.id));
  const kept = rows.filter((r) => !prune.has(r.id)).sort((a, b) => a.seq - b.seq);
  let bytes = kept.reduce((total, r) => total + r.sizeBytes, 0);
  for (let i = 0; i < kept.length - 1 && (kept.length - i > HISTORY_MAX_VERSIONS || bytes > HISTORY_MAX_BYTES); i++) {
    prune.add(kept[i].id);
    bytes -= kept[i].sizeBytes;
  }
  return [...prune];
}

/** The folder as it was before the oldest given change. `chain` runs from the newest version down to the target. */
export function overlayVersions(
  current: AmanahOrdnerData,
  chain: VersionPayload[],
  allowedSections?: readonly string[],
): AmanahOrdnerData {
  const next: Record<string, unknown> = { ...current };
  for (const version of chain) {
    for (const [section, value] of Object.entries(version.prior)) {
      if ((HISTORY_SECTIONS as readonly string[]).includes(section) && (!allowedSections || allowedSections.includes(section))) {
        next[section] = value;
      }
    }
  }
  return next as unknown as AmanahOrdnerData;
}

export function sealVersion(payload: VersionPayload, userId: string, env: NodeJS.ProcessEnv = process.env): { stored: unknown; sizeBytes: number } {
  return { stored: sealForStorage(payload, userId, env), sizeBytes: Buffer.byteLength(JSON.stringify(payload), "utf8") };
}

/** Checks the content too: encryption binds a version to its owner, this binds it to its place. */
export function openVersion(stored: unknown, userId: string, seq: number, env: NodeJS.ProcessEnv = process.env): VersionPayload {
  const payload = openFromStorage<VersionPayload>(stored, userId, env);
  if (payload?.kind !== VERSION_KIND || payload.seq !== seq) throw new Error("Version does not match its record.");
  return payload;
}

export function openVersionOrNull(stored: unknown, userId: string, seq: number): VersionPayload | null {
  try {
    return openVersion(stored, userId, seq);
  } catch {
    return null;
  }
}
