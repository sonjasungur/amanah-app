import { NextResponse } from "next/server";
import { crossOriginRejected, getServerRepository } from "@/lib/server/auth-utils";
import { isSameOriginRequest } from "@/lib/server/session-cookie";
import { clientAddress, consumeLimits, FIFTEEN_MINUTES, tooManyAttempts } from "@/lib/server/auth-rate-limit";
import { CHECK_EMAIL_RESPONSE, emailKey, sendPasswordResetMail } from "@/lib/server/account-recovery";
import { MailNotConfiguredError } from "@/lib/server/mailer";

/** Always answers the same way; a link is only sent if the account exists. */
export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return crossOriginRejected();
  const { email } = (await request.json().catch(() => ({}))) as { email?: string };
  if (typeof email !== "string" || !email.includes("@")) return NextResponse.json(CHECK_EMAIL_RESPONSE, { status: 202 });

  const limit = await consumeLimits([
    { scope: "reset:ip", subject: clientAddress(request), max: 10, windowMs: FIFTEEN_MINUTES },
    { scope: "reset:email", subject: emailKey(email), max: 3, windowMs: FIFTEEN_MINUTES },
  ]);
  if (!limit.allowed) return tooManyAttempts(limit, "Zu viele Anfragen. Bitte später erneut versuchen.");

  const repo = getServerRepository();
  const user = await repo.findUserByEmail(email);
  try {
    if (user) await sendPasswordResetMail(repo, user);
  } catch (e) {
    if (!(e instanceof MailNotConfiguredError)) throw e;
  }
  return NextResponse.json(CHECK_EMAIL_RESPONSE, { status: 202 });
}
