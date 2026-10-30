import { NextResponse } from "next/server";
import { getServerRepository } from "@/lib/server/repository";
import { sessionToResponse } from "@/lib/server/auth-utils";
import { clearSessionCookie, readSessionToken } from "@/lib/server/session-cookie";

function unauthorized(error: string) {
  const response = NextResponse.json({ error }, { status: 401 });
  clearSessionCookie(response);
  return response;
}

export async function GET(request: Request) {
  const token = readSessionToken(request);
  if (!token) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const repo = getServerRepository();
  const session = await repo.getSessionByToken(token);
  if (!session) return unauthorized("Sitzung abgelaufen.");

  const user = await repo.getUserById(session.userId);
  if (!user) return unauthorized("Benutzer nicht gefunden.");

  return NextResponse.json(sessionToResponse(session, user));
}
