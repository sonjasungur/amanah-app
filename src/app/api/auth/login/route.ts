import { NextResponse } from "next/server";
import { crossOriginRejected, getServerRepository, sessionToResponse } from "@/lib/server/auth-utils";
import { isSameOriginRequest, readSessionToken, setSessionCookie } from "@/lib/server/session-cookie";
import { clearLimit, clientAddress, consumeLimits, FIFTEEN_MINUTES, HOUR, isLimitReached, MINUTE, recordLimitHit, tooManyAttempts } from "@/lib/server/auth-rate-limit";
import { emailKey } from "@/lib/server/account-recovery";
import { emailVerificationInfo, mayLogIn } from "@/lib/server/email-verification";

/**
 * Limits that one client cannot use against someone else's account: attempts and failed passwords
 * count per pair of address and client. Only a much higher count across all clients pauses the address
 * itself, the case of an attack from many sources. Every limit applies whether or not the account exists.
 */
const ATTEMPTS_PER_CLIENT_PER_MINUTE = 10;
const ATTEMPTS_PER_ADDRESS_PER_MINUTE = 60;
const FAILED_PER_ADDRESS_AND_CLIENT_15_MIN = 10;
const FAILED_PER_ADDRESS_PER_HOUR = 50;
const TOO_MANY_LOGINS = "Zu viele Anmeldeversuche. Bitte kurz warten.";

/**
 * Prepared, not active: an address paused by an attack from many sources could receive a one-time
 * login link instead. Needs working mail delivery and the owner's release; until then it stays off and
 * the address is paused.
 */
function loginLinkInsteadOfPause(): boolean {
  return false;
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return crossOriginRejected();
  try {
    const body = await request.json();
    const { email, password } = body as { email?: string; password?: string };

    if (!email || !password) {
      return NextResponse.json({ error: "E-Mail und Passwort erforderlich." }, { status: 400 });
    }

    const address = emailKey(email);
    const client = clientAddress(request);
    const pair = `${address}\n${client}`;
    const attempt = await consumeLimits([
      { scope: "login:ip", subject: client, max: ATTEMPTS_PER_CLIENT_PER_MINUTE, windowMs: MINUTE },
      { scope: "login:email-client", subject: pair, max: ATTEMPTS_PER_CLIENT_PER_MINUTE, windowMs: MINUTE },
      { scope: "login:email", subject: address, max: ATTEMPTS_PER_ADDRESS_PER_MINUTE, windowMs: MINUTE },
    ]);
    if (!attempt.allowed) return tooManyAttempts(attempt, TOO_MANY_LOGINS);
    const pairFailures = { scope: "login:failed-pair", subject: pair, max: FAILED_PER_ADDRESS_AND_CLIENT_15_MIN, windowMs: FIFTEEN_MINUTES };
    const addressFailures = { scope: "login:failed-address", subject: address, max: FAILED_PER_ADDRESS_PER_HOUR, windowMs: HOUR };
    // Checked before the password, so a paused address answers the same with a right or wrong one.
    if (await isLimitReached(pairFailures)) return tooManyAttempts({ allowed: false, retryAfterSeconds: FIFTEEN_MINUTES / 1000 }, TOO_MANY_LOGINS);
    if ((await isLimitReached(addressFailures)) && !loginLinkInsteadOfPause()) {
      return tooManyAttempts({ allowed: false, retryAfterSeconds: FIFTEEN_MINUTES / 1000 }, TOO_MANY_LOGINS);
    }

    const repo = getServerRepository();
    const user = await repo.authenticateUser(email, password);
    if (!user) {
      await recordLimitHit(pairFailures);
      await recordLimitHit(addressFailures);
      return NextResponse.json({ error: "E-Mail oder Passwort ungültig." }, { status: 401 });
    }
    await clearLimit(pairFailures);
    await clearLimit(addressFailures);
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
