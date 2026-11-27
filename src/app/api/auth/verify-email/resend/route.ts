import { NextResponse } from "next/server";
import { crossOriginRejected, getAuthenticatedUserId, getServerRepository } from "@/lib/server/auth-utils";
import { isSameOriginRequest } from "@/lib/server/session-cookie";
import { clientAddress, consumeLimits, FIFTEEN_MINUTES, tooManyAttempts } from "@/lib/server/auth-rate-limit";
import { CHECK_EMAIL_RESPONSE, emailKey, sendVerificationMail } from "@/lib/server/account-recovery";
import { MailNotConfiguredError } from "@/lib/server/mailer";

/** Without an e-mail in the body, a signed-in legacy account asks for its own link. */
export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return crossOriginRejected();
  const body = (await request.json().catch(() => ({}))) as { email?: string; returnUrl?: unknown };
  let email = body.email;
  if (email === undefined) {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
    email = (await getServerRepository().getUserById(userId))?.email;
  }
  if (typeof email !== "string" || !email.includes("@")) return NextResponse.json(CHECK_EMAIL_RESPONSE, { status: 202 });

  const limit = await consumeLimits([
    { scope: "verify-resend:ip", subject: clientAddress(request), max: 10, windowMs: FIFTEEN_MINUTES },
    { scope: "verify-resend:email", subject: emailKey(email), max: 3, windowMs: FIFTEEN_MINUTES },
  ]);
  if (!limit.allowed) return tooManyAttempts(limit, "Zu viele Anfragen. Bitte später erneut versuchen.");

  const repo = getServerRepository();
  const user = await repo.findUserByEmail(email);
  try {
    if (user && !user.emailVerifiedAt) await sendVerificationMail(repo, user, typeof body.returnUrl === "string" ? body.returnUrl : null);
  } catch (e) {
    if (!(e instanceof MailNotConfiguredError)) throw e;
  }
  return NextResponse.json(CHECK_EMAIL_RESPONSE, { status: 202 });
}
