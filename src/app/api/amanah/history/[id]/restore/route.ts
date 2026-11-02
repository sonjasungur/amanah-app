import { NextResponse } from "next/server";
import { FREE_ACCOUNT_SECTIONS } from "@/lib/billing/plan-matrix";
import { crossOriginRejected, getAuthenticatedUserId, getServerRepository } from "@/lib/server/auth-utils";
import { CONSENT_REQUIRED_RESPONSE, hasActiveConsent } from "@/lib/server/consent";
import { isDataHistoryEnabled } from "@/lib/server/data-history";
import { folderWriteBlocked } from "@/lib/server/email-verification";
import { folderWriteScope } from "@/lib/server/folder-access";
import { isSameOriginRequest } from "@/lib/server/session-cookie";

/**
 * Only on an explicit user action: the body must say { "confirmed": true }. The current state
 * becomes a version itself, so a restore can be undone. Same write rules as saving.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isDataHistoryEnabled()) return NextResponse.json({ error: "Nicht verfügbar." }, { status: 404 });
  if (!isSameOriginRequest(request)) return crossOriginRejected();
  const userId = await getAuthenticatedUserId(request);
  if (!userId) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });

  const { confirmed } = (await request.json().catch(() => ({}))) as { confirmed?: unknown };
  if (confirmed !== true) return NextResponse.json({ error: "Wiederherstellung nicht bestätigt." }, { status: 400 });

  const repo = getServerRepository();
  if (!(await hasActiveConsent(repo, userId, "sensitive_folder_storage"))) {
    return NextResponse.json(CONSENT_REQUIRED_RESPONSE, { status: 403 });
  }
  const blocked = await folderWriteBlocked(repo, userId);
  if (blocked) return blocked;

  const { id } = await params;
  const scope = await folderWriteScope(repo, userId);
  try {
    const data = await repo.restoreDataVersion(userId, id, scope === "free_sections" ? FREE_ACCOUNT_SECTIONS : undefined);
    if (!data) return NextResponse.json({ error: "Version nicht gefunden." }, { status: 404 });
    return NextResponse.json({ data, lastSaved: data.lastSaved, writeScope: scope });
  } catch {
    return NextResponse.json({ error: "Wiederherstellung fehlgeschlagen. Es wurde nichts geändert." }, { status: 500 });
  }
}
