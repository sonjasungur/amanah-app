import { NextResponse } from "next/server";
import { isBillingEnforced } from "@/lib/billing/config";
import { FREE_ACCOUNT_SECTIONS, planFeature } from "@/lib/billing/plan-matrix";
import { resolvePlusAccess } from "@/lib/billing/plus-access";
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

export const MAX_FOLDER_BODY_BYTES = 2 * 1024 * 1024;
export const MAX_ASSETS = 500;

/**
 * Not worth a warning: bookkeeping, and progress or bookmarks that simply stay in this browser.
 * Otherwise anyone who did the check would see "partly saved" on the free asset page for good.
 */
const NOT_CONTENT = new Set(["schemaVersion", "lastSaved", "reviewStatus", "selectedPath", "checkProgress", "knowledgeBookmarks"]);

export async function folderWriteScope(repo: ServerRepository, userId: string, env: NodeJS.ProcessEnv = process.env): Promise<FolderWriteScope> {
  if (!isBillingEnforced(env)) return "full";
  const [user, purchases] = await Promise.all([repo.getUserById(userId), repo.listPurchases(userId)]);
  const paidPlus = purchases.some((p) => p.status === "paid" && p.productId === "vorsorge_plus");
  const access = resolvePlusAccess({ accountCreatedAt: user?.createdAt ?? null, paidPlus, feature: planFeature("persistent_folder") ?? undefined }, env);
  return access.allowed ? "full" : "free_sections";
}

/** Only well-formed free sections from an untrusted body. Sections that were not sent stay as they are. */
export function freeSectionsOf(incoming: Partial<AmanahOrdnerData>): Partial<AmanahOrdnerData> {
  return "assets" in incoming ? { assets: sanitizeAssets(incoming.assets) as AssetEntry[] } : {};
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

/** Reads a folder body with a hard size limit, also when the client sends no or a wrong Content-Length. */
export async function readFolderBody(request: Request): Promise<{ body: Partial<AmanahOrdnerData> } | { response: NextResponse }> {
  const tooLarge = () => ({
    response: NextResponse.json({ error: "Die Daten sind zu groß zum Speichern. Bitte kürze längere Texte.", code: "folder_too_large" }, { status: 413 }),
  });
  if (Number(request.headers.get("content-length") ?? 0) > MAX_FOLDER_BODY_BYTES) return tooLarge();

  const chunks: Uint8Array[] = [];
  let size = 0;
  const reader = request.body?.getReader();
  while (reader) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_FOLDER_BODY_BYTES) {
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
  const assets = (parsed as Partial<AmanahOrdnerData>).assets;
  if (Array.isArray(assets) && assets.length > MAX_ASSETS) {
    return { response: NextResponse.json({ error: `Die Vermögensübersicht kann höchstens ${MAX_ASSETS} Einträge speichern.`, code: "too_many_assets" }, { status: 422 }) };
  }
  return { body: parsed as Partial<AmanahOrdnerData> };
}
