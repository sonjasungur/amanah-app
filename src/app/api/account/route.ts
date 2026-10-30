import { NextResponse } from "next/server";
import { crossOriginRejected, getAuthenticatedUserId, getServerRepository } from "@/lib/server/auth-utils";
import { clearSessionCookie, isSameOriginRequest } from "@/lib/server/session-cookie";

/**
 * Art. 17 DSGVO: deletes the account, every session and all stored data.
 * Requires the current password so a hijacked session alone cannot erase an account.
 */
export async function DELETE(request: Request) {
  if (!isSameOriginRequest(request)) return crossOriginRejected();
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  let password = "";
  try {
    password = ((await request.json()) as { password?: string }).password ?? "";
  } catch {
    // handled below
  }

  const repo = getServerRepository();
  const user = await repo.getUserById(userId);
  const confirmed = user && password ? await repo.authenticateUser(user.email, password) : null;
  if (!confirmed || confirmed.id !== userId) {
    return NextResponse.json({ error: "Passwort zur Bestätigung erforderlich." }, { status: 403 });
  }

  await repo.deleteUser(userId);
  const response = NextResponse.json({ success: true, message: "Konto und alle Daten wurden gelöscht." });
  clearSessionCookie(response);
  return response;
}
