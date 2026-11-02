import { NextResponse } from "next/server";
import { isBillingEnforced } from "@/lib/billing/config";
import { FREE_ACCOUNT_SECTIONS, planFeature } from "@/lib/billing/plan-matrix";
import { resolvePlusAccess } from "@/lib/billing/plus-access";
import { normalizeCheckProgress } from "@/lib/check/progress";
import { defaultAmanahData } from "@/lib/domain/defaults";
import { normalizeData } from "@/lib/domain/migration";
import type { AmanahOrdnerData, AssetEntry } from "@/lib/domain/types";
import { sanitizeAssets } from "@/lib/testament/asset-labels";
import type { ServerRepository } from "./repository/types";

/**
 * What an account may write to its folder. With enforcement off everything stays as it is. With
 * enforcement on and no Plus access only FREE_ACCOUNT_SECTIONS change; all other stored sections
 * stay untouched and remain readable, exportable and deletable (also after a tariff change).
 */
export type FolderWriteScope = "full" | "free_sections";

/** New data may grow up to here. */
export const MAX_FOLDER_BODY_BYTES = 2 * 1024 * 1024;
/** Nothing larger is read at all, also not from accounts that are already above the limit. */
export const HARD_FOLDER_BODY_BYTES = 16 * 1024 * 1024;
/** Larger folders stored before the limit stay editable and may grow by this much per save. */
export const OVERSIZE_GROWTH_BYTES = 64 * 1024;
export const MAX_ASSETS = 500;

/** Early enough to shorten something before a save is refused. */
export function isNearFolderLimit(storedBytes: number): boolean {
  return storedBytes > MAX_FOLDER_BODY_BYTES * 0.8;
}

/** Not worth a warning: bookkeeping and navigation. */
const NOT_CONTENT = new Set(["schemaVersion", "lastSaved", "reviewStatus", "selectedPath"]);

const TOO_LARGE = { error: "Die Daten sind zu groß zum Speichern. Bitte kürze längere Texte. Deine Eingaben bleiben in diesem Browser erhalten.", code: "folder_too_large" };

export async function folderWriteScope(repo: ServerRepository, userId: string, env: NodeJS.ProcessEnv = process.env): Promise<FolderWriteScope> {
  if (!isBillingEnforced(env)) return "full";
  const [user, purchases] = await Promise.all([repo.getUserById(userId), repo.listPurchases(userId)]);
  const paidPlus = purchases.some((p) => p.status === "paid" && p.productId === "vorsorge_plus");
  const access = resolvePlusAccess({ accountCreatedAt: user?.createdAt ?? null, paidPlus, feature: planFeature("persistent_folder") ?? undefined }, env);
  return access.allowed ? "full" : "free_sections";
}

/** Keeps only the fields of the default object, with fitting types. For untrusted input. */
function likeDefaults<T>(value: unknown, defaults: T): T {
  if (!value || typeof value !== "object" || Array.isArray(value)) return defaults;
  const source = value as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const [key, fallback] of Object.entries(defaults as Record<string, unknown>)) {
    const candidate = source[key];
    if (fallback && typeof fallback === "object") result[key] = likeDefaults(candidate, fallback);
    else if (fallback === null) result[key] = typeof candidate === "string" || typeof candidate === "boolean" ? candidate : null;
    else result[key] = typeof candidate === typeof fallback || (typeof fallback === "boolean" && candidate === null) ? candidate : fallback;
  }
  return result as T;
}

/** Only well-formed free sections from an untrusted body. Sections that were not sent stay as they are. */
export function freeSectionsOf(incoming: Partial<AmanahOrdnerData>): Partial<AmanahOrdnerData> {
  const free: Partial<AmanahOrdnerData> = {};
  if ("assets" in incoming) free.assets = sanitizeAssets(incoming.assets) as AssetEntry[];
  if ("emergencyCard" in incoming) free.emergencyCard = likeDefaults(incoming.emergencyCard, defaultAmanahData.emergencyCard);
  if ("checkProgress" in incoming) free.checkProgress = normalizeCheckProgress(incoming.checkProgress);
  if ("knowledgeBookmarks" in incoming) {
    free.knowledgeBookmarks = normalizeData({ knowledgeBookmarks: incoming.knowledgeBookmarks }).knowledgeBookmarks;
  }
  return free;
}

/** Sections the person changed that a restricted write did not store, so the client can say so. */
export function notStoredSections(existing: AmanahOrdnerData | null, incoming: Partial<AmanahOrdnerData>): string[] {
  const before = (existing ?? normalizeData({})) as unknown as Record<string, unknown>;
  const after = normalizeData(incoming) as unknown as Record<string, unknown>;
  return Object.keys(incoming).filter(
    (key) =>
      !NOT_CONTENT.has(key) &&
      !(FREE_ACCOUNT_SECTIONS as readonly string[]).includes(key) &&
      JSON.stringify(before[key]) !== JSON.stringify(after[key]),
  );
}

export function jsonBytes(value: unknown): number {
  return Buffer.byteLength(JSON.stringify(value) ?? "", "utf8");
}

/**
 * Up to the limit everything may be saved. Above it only what is already there may stay, so that
 * nobody who stored more before the limit existed loses the ability to edit or shorten it.
 */
export function folderSizeRejected(storedBytes: number, existingBytes: number): NextResponse | null {
  if (storedBytes <= MAX_FOLDER_BODY_BYTES || storedBytes <= existingBytes + OVERSIZE_GROWTH_BYTES) return null;
  return NextResponse.json(TOO_LARGE, { status: 413 });
}

export function tooManyAssets(next: unknown, existing: AmanahOrdnerData | null): NextResponse | null {
  if (!Array.isArray(next) || next.length <= MAX_ASSETS || next.length <= (existing?.assets.length ?? 0)) return null;
  return NextResponse.json({ error: `Die Vermögensübersicht kann höchstens ${MAX_ASSETS} Einträge speichern.`, code: "too_many_assets" }, { status: 422 });
}

/** Reads a body with a hard limit, also when the client sends no or a wrong Content-Length. */
export async function readFolderBody(request: Request): Promise<{ body: Partial<AmanahOrdnerData>; bytes: number } | { response: NextResponse }> {
  const tooLarge = () => ({ response: NextResponse.json(TOO_LARGE, { status: 413 }) });
  if (Number(request.headers.get("content-length") ?? 0) > HARD_FOLDER_BODY_BYTES) return tooLarge();

  const chunks: Uint8Array[] = [];
  let size = 0;
  const reader = request.body?.getReader();
  while (reader) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > HARD_FOLDER_BODY_BYTES) {
      await reader.cancel();
      return tooLarge();
    }
    chunks.push(value);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    parsed = null;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { response: NextResponse.json({ error: "Ungültige Daten." }, { status: 400 }) };
  }
  return { body: parsed as Partial<AmanahOrdnerData>, bytes: size };
}
