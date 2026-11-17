import { NextResponse } from "next/server";
import { crossOriginRejected, getServerRepository, sessionToResponse } from "@/lib/server/auth-utils";
import { isSameOriginRequest, readSessionToken, setSessionCookie } from "@/lib/server/session-cookie";
import { clearLimit, clientAddress, consumeLimits, FIFTEEN_MINUTES, isLimitReached, MINUTE, recordLimitHit, tooManyAttempts } from "@/lib/server/auth-rate-limit";
import { emailKey } from "@/lib/server/account-recovery";
import { emailVerificationInfo, mayLogIn } from "@/lib/server/email-verification";

const LOGIN_ATTEMPTS_PER_MINUTE = 10;
/** Failed passwords per address before it is paused; counted whether or not the account exists. */
const FAILED_LOGINS_PER_15_MINUTES = 10;
const TOO_MANY_LOGINS = "Zu viele Anmeldeversuche. Bitte kurz warten.";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return crossOriginRejected();
  try {
    const body = await request.json();
    const { email, password } = body as { email?: string; password?: string };

    if (!email || !password) {
      return NextResponse.json({ error: "E-Mail und Passwort erforderlich." }, { status: 400 });
    }

    const address = emailKey(email);
    const attempt = await consumeLimits([
      { scope: "login:ip", subject: clientAddress(request), max: LOGIN_ATTEMPTS_PER_MINUTE, windowMs: MINUTE },
      { scope: "login:email", subject: address, max: LOGIN_ATTEMPTS_PER_MINUTE, windowMs: MINUTE },
    ]);
    if (!attempt.allowed) return tooManyAttempts(attempt, TOO_MANY_LOGINS);
    const failures = { scope: "login:failed", subject: address, max: FAILED_LOGINS_PER_15_MINUTES, windowMs: FIFTEEN_MINUTES };
    // Checked before the password, so a paused address answers the same with a right or wrong one.
    if (await isLimitReached(failures)) return tooManyAttempts({ allowed: false, retryAfterSeconds: FIFTEEN_MINUTES / 1000 }, TOO_MANY_LOGINS);

    const repo = getServerRepository();
    const user = await repo.authenticateUser(email, password);
    if (!user) {
      await recordLimitHit(failures);
      return NextResponse.json({ error: "E-Mail oder Passwort ungültig." }, { status: 401 });
    }
    await clearLimit(failures);
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
