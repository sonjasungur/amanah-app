import { NextResponse } from "next/server";
import { crossOriginRejected, getServerRepository, sessionToResponse } from "@/lib/server/auth-utils";
import { isSameOriginRequest, readSessionToken, setSessionCookie } from "@/lib/server/session-cookie";
import { stagingDirectLoginEmail } from "@/lib/server/staging-direct-login";

/** Staging only: is the one-tap login as the acceptance account available? (owner 24.11.2026) */
export async function GET() {
  const email = stagingDirectLoginEmail();
  if (!email) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ available: true, email });
}

/** Staging only: log in as the acceptance account without a password. Behind the staging basic auth. */
export async function POST(request: Request) {
  const email = stagingDirectLoginEmail();
  if (!email) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isSameOriginRequest(request)) return crossOriginRejected();

  const repo = getServerRepository();
  const user = await repo.findUserByEmail(email);
  if (!user) return NextResponse.json({ error: "Das Abnahmekonto gibt es auf Staging nicht." }, { status: 404 });

  // Session fixation: never reuse a token presented before this login.
  const previous = readSessionToken(request);
  if (previous) await repo.deleteSession(previous);

  const session = await repo.createSession(user.id);
  const response = NextResponse.json(sessionToResponse(session, user));
  setSessionCookie(response, session.token, session.expiresAt);
  return response;
}
