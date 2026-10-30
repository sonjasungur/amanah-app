import { NextResponse } from "next/server";
import { getServerRepository, sessionToResponse } from "@/lib/server/auth-utils";
import { checkRateLimit } from "@/lib/ai/rate-limit";

const LOGIN_ATTEMPTS_PER_MINUTE = 10;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body as { email?: string; password?: string };

    if (!email || !password) {
      return NextResponse.json({ error: "E-Mail und Passwort erforderlich." }, { status: 400 });
    }

    const ip = request.headers.get("x-forwarded-for") || "local";
    const byIp = checkRateLimit(`auth-login:ip:${ip}`, LOGIN_ATTEMPTS_PER_MINUTE);
    const byEmail = checkRateLimit(`auth-login:email:${email.trim().toLowerCase()}`, LOGIN_ATTEMPTS_PER_MINUTE);
    if (!byIp.allowed || !byEmail.allowed) {
      return NextResponse.json({ error: "Zu viele Anmeldeversuche. Bitte kurz warten." }, { status: 429 });
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
