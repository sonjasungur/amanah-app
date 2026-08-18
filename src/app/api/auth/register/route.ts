import { NextResponse } from "next/server";
import { isPublicRegistrationEnabled } from "@/lib/auth/public-registration";
import { getServerRepository, sessionToResponse } from "@/lib/server/auth-utils";

export async function POST(request: Request) {
  try {
    if (!isPublicRegistrationEnabled()) {
      return NextResponse.json(
        { error: "Öffentliche Registrierung ist derzeit nicht geöffnet." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, password, name } = body as { email?: string; password?: string; name?: string };

    if (!email || !password) {
      return NextResponse.json({ error: "E-Mail und Passwort erforderlich." }, { status: 400 });
    }

    const repo = getServerRepository();
    const result = await repo.registerUser(email, password, name ?? "");
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }

    const session = await repo.createSession(result.id);
    return NextResponse.json(sessionToResponse(session, result), { status: 201 });
  } catch {
    return NextResponse.json({ error: "Registrierung fehlgeschlagen." }, { status: 500 });
  }
}
