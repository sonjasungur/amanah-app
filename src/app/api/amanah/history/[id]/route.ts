import { NextResponse } from "next/server";
import { crossOriginRejected, getAuthenticatedUserId, getServerRepository } from "@/lib/server/auth-utils";
import { isDataHistoryEnabled } from "@/lib/server/data-history";
import { isSameOriginRequest } from "@/lib/server/session-cookie";

type Context = { params: Promise<{ id: string }> };

/** One version with its content, for its owner only. Prepared: 404 until the history is turned on. */
export async function GET(request: Request, { params }: Context) {
  if (!isDataHistoryEnabled()) return NextResponse.json({ error: "Nicht verfügbar." }, { status: 404 });
  const userId = await getAuthenticatedUserId(request);
  if (!userId) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  const { id } = await params;
  const version = await getServerRepository().getDataVersion(userId, id);
  if (!version) return NextResponse.json({ error: "Version nicht gefunden." }, { status: 404 });
  return NextResponse.json({ version }, { headers: { "Cache-Control": "no-store" } });
}

/** Deletes this version and all older ones. Stays possible when the history is switched off. */
export async function DELETE(request: Request, { params }: Context) {
  if (!isSameOriginRequest(request)) return crossOriginRejected();
  const userId = await getAuthenticatedUserId(request);
  if (!userId) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  const { id } = await params;
  if (!(await getServerRepository().deleteDataVersionsUpTo(userId, id))) {
    return NextResponse.json({ error: "Version nicht gefunden." }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
