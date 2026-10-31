import { NextResponse } from "next/server";
import { crossOriginRejected, getAuthenticatedUserId, getServerRepository } from "@/lib/server/auth-utils";
import { isSameOriginRequest } from "@/lib/server/session-cookie";
import { checkRateLimit } from "@/lib/ai/rate-limit";
import { CHECK_EMAIL_RESPONSE, emailKey, sendVerificationMail } from "@/lib/server/account-recovery";
import { MailNotConfiguredError } from "@/lib/server/mailer";

const FIFTEEN_MINUTES = 15 * 60 * 1000;

/** Without an e-mail in the body, a signed-in legacy account asks for its own link. */
export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return crossOriginRejected();
  const body = (await request.json().catch(() => ({}))) as { email?: string };
  let email = body.email;
  if (email === undefined) {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
    email = (await getServerRepository().getUserById(userId))?.email;
  }
  if (typeof email !== "string" || !email.includes("@")) return NextResponse.json(CHECK_EMAIL_RESPONSE, { status: 202 });

  const ip = request.headers.get("x-forwarded-for") || "local";
  if (!checkRateLimit(`verify-resend:ip:${ip}`, 10, FIFTEEN_MINUTES).allowed || !checkRateLimit(`verify-resend:email:${emailKey(email)}`, 3, FIFTEEN_MINUTES).allowed) {
    return NextResponse.json({ error: "Zu viele Anfragen. Bitte später erneut versuchen." }, { status: 429 });
  }

  const repo = getServerRepository();
  const user = await repo.findUserByEmail(email);
  try {
    if (user && !user.emailVerifiedAt) await sendVerificationMail(repo, user);
  } catch (e) {
    if (!(e instanceof MailNotConfiguredError)) throw e;
  }
  return NextResponse.json(CHECK_EMAIL_RESPONSE, { status: 202 });
}
