import { NextResponse } from "next/server";
import { MIN_PASSWORD_LENGTH, PASSWORD_REQUIREMENT_ERROR } from "@/lib/auth/config";
import { crossOriginRejected, getServerRepository } from "@/lib/server/auth-utils";
import { clearSessionCookie, isSameOriginRequest } from "@/lib/server/session-cookie";
import { clientAddress, consumeLimits, MINUTE, tooManyAttempts } from "@/lib/server/auth-rate-limit";
import { consumeToken } from "@/lib/server/account-recovery";

/** Sets a new password with a single-use token; every existing session is revoked. */
export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return crossOriginRejected();
  const limit = await consumeLimits([{ scope: "reset-confirm:ip", subject: clientAddress(request), max: 10, windowMs: MINUTE }]);
  if (!limit.allowed) return tooManyAttempts(limit, "Zu viele Anfragen. Bitte kurz warten.");

  const { token, password } = (await request.json().catch(() => ({}))) as { token?: unknown; password?: unknown };
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json({ error: PASSWORD_REQUIREMENT_ERROR }, { status: 400 });
  }

  const repo = getServerRepository();
  const userId = await consumeToken(repo, token, "reset_password");
  if (!userId) {
    return NextResponse.json({ error: "Der Link ist ungültig oder abgelaufen." }, { status: 400 });
  }

  await repo.updatePassword(userId, password);
  await repo.invalidateAuthTokens(userId, "reset_password");
  // Receiving the link proves control of the mailbox.
  await repo.markEmailVerified(userId);
  const response = NextResponse.json({ success: true, message: "Passwort geändert. Bitte melde dich neu an." });
  clearSessionCookie(response);
  return response;
}
