import { NextResponse } from "next/server";
import { normalizeData } from "@/lib/domain/migration";
import { getAmanahData, saveAmanahData, patchAmanahData } from "@/lib/server/memory-store";
import { getAuthenticatedUserId } from "@/lib/server/auth-utils";

export async function GET(request: Request) {
  const userId = getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const data = getAmanahData(userId) ?? normalizeData({});
  return NextResponse.json({ data });
}

export async function PUT(request: Request) {
  const userId = getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const saved = saveAmanahData(userId, body);
    return NextResponse.json({ data: saved, lastSaved: saved.lastSaved });
  } catch {
    return NextResponse.json({ error: "Speichern fehlgeschlagen." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const userId = getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const saved = patchAmanahData(userId, body);
    return NextResponse.json({ data: saved, lastSaved: saved.lastSaved });
  } catch {
    return NextResponse.json({ error: "Aktualisieren fehlgeschlagen." }, { status: 500 });
  }
}
