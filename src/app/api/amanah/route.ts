import { NextResponse } from "next/server";
import { normalizeData } from "@/lib/domain/migration";
import type { AmanahOrdnerData } from "@/lib/domain/types";
import type { ServerRepository } from "@/lib/server/repository/types";
import { getAuthenticatedUserId, getServerRepository } from "@/lib/server/auth-utils";
import { CONSENT_REQUIRED_RESPONSE, hasActiveConsent } from "@/lib/server/consent";
import { folderWriteBlocked } from "@/lib/server/email-verification";
import { folderUnreadableResponse } from "@/lib/server/folder-unreadable";
import {
  folderSizeRejected,
  folderWriteScope,
  freeSectionsOf,
  isNearFolderLimit,
  jsonBytes,
  MAX_ASSETS,
  MAX_FOLDER_BODY_BYTES,
  notStoredSections,
  readFolderBody,
  tooManyAssets,
} from "@/lib/server/folder-access";

/** The client sends the whole folder: store what is free, leave the rest untouched and say what was not stored. */
async function writeFreeSections(repo: ServerRepository, userId: string, body: Partial<AmanahOrdnerData>) {
  const existing = await repo.getAmanahData(userId);
  const free = freeSectionsOf(body);
  // Only what would really be stored counts, not what stays in the browser.
  const storedBytes = jsonBytes({ ...existing, ...free });
  const rejected = tooManyAssets(free.assets, existing) ?? folderSizeRejected(storedBytes, jsonBytes(existing));
  if (rejected) return rejected;
  const notStored = notStoredSections(existing, body);
  const saved = await repo.patchAmanahData(userId, free);
  return NextResponse.json({ data: saved, lastSaved: saved.lastSaved, notStored, nearLimit: isNearFolderLimit(storedBytes) });
}

/** Limits for a full write. The stored folder is read only when they could apply. */
async function fullWriteRejected(repo: ServerRepository, userId: string, body: Partial<AmanahOrdnerData>, storedBytes: number) {
  const mayExceed = storedBytes > MAX_FOLDER_BODY_BYTES || (Array.isArray(body.assets) && body.assets.length > MAX_ASSETS);
  if (!mayExceed) return null;
  const existing = await repo.getAmanahData(userId);
  return tooManyAssets(body.assets, existing) ?? folderSizeRejected(storedBytes, jsonBytes(existing));
}

export async function GET(request: Request) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  try {
    const repo = getServerRepository();
    const data = (await repo.getAmanahData(userId)) ?? normalizeData({});
    return NextResponse.json({ data, writeScope: await folderWriteScope(repo, userId) });
  } catch (error) {
    return folderUnreadableResponse(error) ?? NextResponse.json({ error: "Laden fehlgeschlagen." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  try {
    const repo = getServerRepository();
    if (!(await hasActiveConsent(repo, userId, "sensitive_folder_storage"))) {
      return NextResponse.json(CONSENT_REQUIRED_RESPONSE, { status: 403 });
    }
    const blocked = await folderWriteBlocked(repo, userId);
    if (blocked) return blocked;
    const read = await readFolderBody(request);
    if ("response" in read) return read.response;
    if ((await folderWriteScope(repo, userId)) === "free_sections") return await writeFreeSections(repo, userId, read.body);
    const rejected = await fullWriteRejected(repo, userId, read.body, read.bytes);
    if (rejected) return rejected;
    const saved = await repo.saveAmanahData(userId, read.body as AmanahOrdnerData);
    return NextResponse.json({ data: saved, lastSaved: saved.lastSaved, notStored: [], nearLimit: isNearFolderLimit(read.bytes) });
  } catch (error) {
    return folderUnreadableResponse(error) ?? NextResponse.json({ error: "Speichern fehlgeschlagen." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  try {
    const repo = getServerRepository();
    if (!(await hasActiveConsent(repo, userId, "sensitive_folder_storage"))) {
      return NextResponse.json(CONSENT_REQUIRED_RESPONSE, { status: 403 });
    }
    const blocked = await folderWriteBlocked(repo, userId);
    if (blocked) return blocked;
    const read = await readFolderBody(request);
    if ("response" in read) return read.response;
    if ((await folderWriteScope(repo, userId)) === "free_sections") return await writeFreeSections(repo, userId, read.body);
    const merged = read.bytes > MAX_FOLDER_BODY_BYTES ? { ...(await repo.getAmanahData(userId)), ...read.body } : read.body;
    const rejected = await fullWriteRejected(repo, userId, read.body, jsonBytes(merged));
    if (rejected) return rejected;
    const saved = await repo.patchAmanahData(userId, read.body);
    return NextResponse.json({ data: saved, lastSaved: saved.lastSaved, notStored: [] });
  } catch (error) {
    return folderUnreadableResponse(error) ?? NextResponse.json({ error: "Aktualisieren fehlgeschlagen." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  try {
    const repo = getServerRepository();
    // "Clear my folder" must not empty what a key problem merely hides. Withdrawing consent and
    // deleting the account remain possible: those are explicit requests to erase the data.
    await repo.assertFolderReadable(userId);
    await repo.deleteAmanahData(userId);
    return NextResponse.json({
      success: true,
      message: "Amanah-Daten gelöscht. Dein Benutzerkonto bleibt bestehen.",
    });
  } catch (error) {
    return folderUnreadableResponse(error) ?? NextResponse.json({ error: "Löschen fehlgeschlagen." }, { status: 500 });
  }
}
