import { NextResponse } from "next/server";
import { normalizeData } from "@/lib/domain/migration";
import { getAuthenticatedUserId, getServerRepository } from "@/lib/server/auth-utils";

export async function GET(request: Request) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const repo = getServerRepository();
  const data = (await repo.getAmanahData(userId)) ?? normalizeData({});
  return NextResponse.json({ data });
}

export async function PUT(request: Request) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const repo = getServerRepository();
    const saved = await repo.saveAmanahData(userId, body);
    return NextResponse.json({ data: saved, lastSaved: saved.lastSaved });
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
    const body = await request.json();
    const repo = getServerRepository();
    const saved = await repo.patchAmanahData(userId, body);
    return NextResponse.json({ data: saved, lastSaved: saved.lastSaved });
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
