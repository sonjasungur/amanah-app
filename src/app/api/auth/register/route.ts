import { NextResponse } from "next/server";
import { isPublicRegistrationEnabled } from "@/lib/auth/public-registration";
import { MIN_PASSWORD_LENGTH, PASSWORD_REQUIREMENT_ERROR } from "@/lib/auth/config";
import { crossOriginRejected, getServerRepository } from "@/lib/server/auth-utils";
import { isSameOriginRequest } from "@/lib/server/session-cookie";
import { checkRateLimit } from "@/lib/ai/rate-limit";
import { CHECK_EMAIL_RESPONSE, emailKey, sendAccountExistsMail, sendVerificationMail } from "@/lib/server/account-recovery";
import { MailNotConfiguredError } from "@/lib/server/mailer";

const REGISTRATIONS_PER_MINUTE = 5;

/**
 * Creates an unverified account and sends a confirmation link. The response is the
 * same whether or not the address is already registered (no account enumeration);
 * no session is issued before the e-mail is confirmed.
 */
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

    if (!email || !password || password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json({ error: PASSWORD_REQUIREMENT_ERROR }, { status: 400 });
    }

    const repo = getServerRepository();
    const existing = await repo.findUserByEmail(email);
    if (existing) {
      if (existing.emailVerifiedAt) await sendAccountExistsMail(existing.email);
      else await sendVerificationMail(repo, existing);
      return NextResponse.json(CHECK_EMAIL_RESPONSE, { status: 202 });
    }

    const result = await repo.registerUser(emailKey(email), password, name ?? "");
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    await sendVerificationMail(repo, result);
    return NextResponse.json(CHECK_EMAIL_RESPONSE, { status: 202 });
  } catch (e) {
    if (e instanceof MailNotConfiguredError) {
      return NextResponse.json({ error: "E-Mail-Versand ist noch nicht eingerichtet." }, { status: 503 });
    }
    return NextResponse.json({ error: "Registrierung fehlgeschlagen." }, { status: 500 });
  }
}
