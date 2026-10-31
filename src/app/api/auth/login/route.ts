import { NextResponse } from "next/server";
import { crossOriginRejected, getServerRepository, sessionToResponse } from "@/lib/server/auth-utils";
import { isSameOriginRequest, readSessionToken, setSessionCookie } from "@/lib/server/session-cookie";
import { checkRateLimit } from "@/lib/ai/rate-limit";
import { emailVerificationInfo, mayLogIn } from "@/lib/server/email-verification";

const LOGIN_ATTEMPTS_PER_MINUTE = 10;

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return crossOriginRejected();
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
    // Only reachable with the correct password, so it does not reveal accounts to strangers.
    // Accounts from before e-mail confirmation may log in and are asked to confirm.
    if (!mayLogIn(emailVerificationInfo(user))) {
      return NextResponse.json(
        { error: "Bitte bestätige zuerst deine E-Mail-Adresse.", code: "email_unverified" },
        { status: 403 }
      );
    }

    // Session fixation: never reuse a token presented before authentication.
    const previous = readSessionToken(request);
    if (previous) await repo.deleteSession(previous);

    const session = await repo.createSession(user.id);
    const response = NextResponse.json(sessionToResponse(session, user));
    setSessionCookie(response, session.token, session.expiresAt);
    return response;
  } catch {
    return NextResponse.json({ error: "Anmeldung fehlgeschlagen." }, { status: 500 });
  }
}
