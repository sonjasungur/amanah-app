import { NextResponse } from "next/server";
import { getServerRepository, sessionToResponse } from "@/lib/server/auth-utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body as { email?: string; password?: string };

    if (!email || !password) {
      return NextResponse.json({ error: "E-Mail und Passwort erforderlich." }, { status: 400 });
    }

    const repo = getServerRepository();
    const user = await repo.authenticateUser(email, password);
    if (!user) {
      return NextResponse.json({ error: "E-Mail oder Passwort ungültig." }, { status: 401 });
    }

    const session = await repo.createSession(user.id);
    return NextResponse.json(sessionToResponse(session, user));
  } catch {
    return NextResponse.json({ error: "Anmeldung fehlgeschlagen." }, { status: 500 });
  }
}
