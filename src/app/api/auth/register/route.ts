import { NextResponse } from "next/server";
import { isPublicRegistrationEnabled } from "@/lib/auth/public-registration";
import { crossOriginRejected, getServerRepository, sessionToResponse } from "@/lib/server/auth-utils";
import { isSameOriginRequest, readSessionToken, setSessionCookie } from "@/lib/server/session-cookie";
import { checkRateLimit } from "@/lib/ai/rate-limit";

const REGISTRATIONS_PER_MINUTE = 5;

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return crossOriginRejected();
  try {
    if (!isPublicRegistrationEnabled()) {
      return NextResponse.json(
        { error: "Öffentliche Registrierung ist derzeit nicht geöffnet." },
        { status: 403 }
      );
    }

    const ip = request.headers.get("x-forwarded-for") || "local";
    if (!checkRateLimit(`auth-register:${ip}`, REGISTRATIONS_PER_MINUTE).allowed) {
      return NextResponse.json({ error: "Zu viele Anfragen. Bitte kurz warten." }, { status: 429 });
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

    const previous = readSessionToken(request);
    if (previous) await repo.deleteSession(previous);

    const session = await repo.createSession(result.id);
    const response = NextResponse.json(sessionToResponse(session, result), { status: 201 });
    setSessionCookie(response, session.token, session.expiresAt);
    return response;
  } catch {
    return NextResponse.json({ error: "Registrierung fehlgeschlagen." }, { status: 500 });
  }
}
