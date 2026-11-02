import { NextResponse } from "next/server";
import { normalizeData } from "@/lib/domain/migration";
import type { AmanahOrdnerData } from "@/lib/domain/types";
import type { ServerRepository } from "@/lib/server/repository/types";
import { getAuthenticatedUserId, getServerRepository } from "@/lib/server/auth-utils";
import { CONSENT_REQUIRED_RESPONSE, hasActiveConsent } from "@/lib/server/consent";
import { folderWriteBlocked } from "@/lib/server/email-verification";
import { folderWriteScope, freeSectionsOf, notStoredSections, readFolderBody } from "@/lib/server/folder-access";

/** The client sends the whole folder: store what is free, leave the rest untouched and say what was not stored. */
async function writeFreeSections(repo: ServerRepository, userId: string, body: Partial<AmanahOrdnerData>) {
  const notStored = notStoredSections(await repo.getAmanahData(userId), body);
  const saved = await repo.patchAmanahData(userId, freeSectionsOf(body));
  return NextResponse.json({ data: saved, lastSaved: saved.lastSaved, notStored });
}

export async function GET(request: Request) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const repo = getServerRepository();
  const data = (await repo.getAmanahData(userId)) ?? normalizeData({});
  return NextResponse.json({ data, writeScope: await folderWriteScope(repo, userId) });
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
    if ((await folderWriteScope(repo, userId)) === "free_sections") return writeFreeSections(repo, userId, read.body);
    const saved = await repo.saveAmanahData(userId, read.body as AmanahOrdnerData);
    return NextResponse.json({ data: saved, lastSaved: saved.lastSaved, notStored: [] });
  } catch {
    return NextResponse.json({ error: "Speichern fehlgeschlagen." }, { status: 500 });
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
    if ((await folderWriteScope(repo, userId)) === "free_sections") return writeFreeSections(repo, userId, read.body);
    const saved = await repo.patchAmanahData(userId, read.body);
    return NextResponse.json({ data: saved, lastSaved: saved.lastSaved, notStored: [] });
  } catch {
    return NextResponse.json({ error: "Aktualisieren fehlgeschlagen." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  try {
    const repo = getServerRepository();
    await repo.deleteAmanahData(userId);
    return NextResponse.json({
      success: true,
      message: "Amanah-Daten gelöscht. Dein Benutzerkonto bleibt bestehen.",
    });
  } catch {
    return NextResponse.json({ error: "Löschen fehlgeschlagen." }, { status: 500 });
  }
}
