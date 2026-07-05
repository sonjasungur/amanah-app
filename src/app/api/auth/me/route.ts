import { NextResponse } from "next/server";
import { getSessionByToken, getUserById } from "@/lib/server/memory-store";
import { getBearerToken, sessionToResponse } from "@/lib/server/auth-utils";

export async function GET(request: Request) {
  const token = getBearerToken(request);
  if (!token) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const session = getSessionByToken(token);
  if (!session) {
    return NextResponse.json({ error: "Sitzung abgelaufen." }, { status: 401 });
  }

  const user = getUserById(session.userId);
  if (!user) {
    return NextResponse.json({ error: "Benutzer nicht gefunden." }, { status: 401 });
  }

  return NextResponse.json(sessionToResponse(session, user));
}
