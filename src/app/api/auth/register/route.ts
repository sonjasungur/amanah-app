import { NextResponse } from "next/server";
import { isPublicRegistrationEnabled } from "@/lib/auth/public-registration";
import { MIN_PASSWORD_LENGTH, PASSWORD_REQUIREMENT_ERROR } from "@/lib/auth/config";
import { crossOriginRejected, getServerRepository } from "@/lib/server/auth-utils";
import { isSameOriginRequest } from "@/lib/server/session-cookie";
import { clientAddress, consumeLimits, FIFTEEN_MINUTES, MINUTE, tooManyAttempts } from "@/lib/server/auth-rate-limit";
import { CHECK_EMAIL_RESPONSE, emailKey, sendAccountExistsMail, sendVerificationMail } from "@/lib/server/account-recovery";
import { MailNotConfiguredError } from "@/lib/server/mailer";
import { isRegistrationDomainAllowed } from "@/lib/deployment-env";

const REGISTRATIONS_PER_MINUTE = 5;
/** Mails to one address (confirmation or "account exists") per 15 minutes. */
const REGISTRATIONS_PER_ADDRESS = 3;

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

    const byIp = await consumeLimits([{ scope: "register:ip", subject: clientAddress(request), max: REGISTRATIONS_PER_MINUTE, windowMs: MINUTE }]);
    if (!byIp.allowed) return tooManyAttempts(byIp, "Zu viele Anfragen. Bitte kurz warten.");

    const body = await request.json();
    const { email, password, name } = body as { email?: string; password?: string; name?: string };

    if (!email || !password || password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json({ error: PASSWORD_REQUIREMENT_ERROR }, { status: 400 });
    }
    // Staging: only reserved test domains, so no real person's data can end up there.
    if (!isRegistrationDomainAllowed(email)) {
      return NextResponse.json({ error: "Diese E-Mail-Adresse ist in dieser Umgebung nicht zugelassen." }, { status: 400 });
    }

    // Counted for new and existing addresses alike, so the limit reveals nothing about an account.
    const byAddress = await consumeLimits([{ scope: "register:email", subject: emailKey(email), max: REGISTRATIONS_PER_ADDRESS, windowMs: FIFTEEN_MINUTES }]);
    if (!byAddress.allowed) return tooManyAttempts(byAddress, "Zu viele Anfragen. Bitte später erneut versuchen.");

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
