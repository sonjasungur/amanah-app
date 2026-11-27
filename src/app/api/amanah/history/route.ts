import { NextResponse } from "next/server";
import { crossOriginRejected, getAuthenticatedUserId, getServerRepository } from "@/lib/server/auth-utils";
import { HISTORY_MAX_VERSIONS, HISTORY_RETENTION_DAYS, isDataHistoryEnabled } from "@/lib/server/data-history";
import { isSameOriginRequest } from "@/lib/server/session-cookie";

/** Dates and kinds of change only, never the earlier content. Prepared: 404 until the history is turned on. */
export async function GET(request: Request) {
  if (!isDataHistoryEnabled()) return NextResponse.json({ error: "Nicht verfügbar." }, { status: 404 });
  const userId = await getAuthenticatedUserId(request);
  if (!userId) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  const versions = await getServerRepository().listDataVersions(userId);
  return NextResponse.json(
    { versions, retentionDays: HISTORY_RETENTION_DAYS, maxVersions: HISTORY_MAX_VERSIONS },
    { headers: { "Cache-Control": "no-store" } },
  );
}

/** Deleting stays possible when the history is switched off: data that exists must remain deletable. */
export async function DELETE(request: Request) {
  if (!isSameOriginRequest(request)) return crossOriginRejected();
  const userId = await getAuthenticatedUserId(request);
  if (!userId) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  await getServerRepository().deleteDataVersions(userId);
  return NextResponse.json({ success: true });
}
