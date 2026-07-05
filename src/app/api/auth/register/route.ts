import { NextResponse } from "next/server";
import { registerUser, createSession } from "@/lib/server/memory-store";
import { sessionToResponse } from "@/lib/server/auth-utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = body as { email?: string; password?: string; name?: string };

    if (!email || !password) {
      return NextResponse.json({ error: "E-Mail und Passwort erforderlich." }, { status: 400 });
    }

    const result = await registerUser(email, password, name ?? "");
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }

    const session = createSession(result.id);
    return NextResponse.json(sessionToResponse(session, result), { status: 201 });
  } catch {
    return NextResponse.json({ error: "Registrierung fehlgeschlagen." }, { status: 500 });
  }
}
