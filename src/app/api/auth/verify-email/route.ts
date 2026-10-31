import { NextResponse } from "next/server";
import { crossOriginRejected, getServerRepository, sessionToResponse } from "@/lib/server/auth-utils";
import { isSameOriginRequest, readSessionToken, setSessionCookie } from "@/lib/server/session-cookie";
import { consumeToken } from "@/lib/server/account-recovery";

/** Confirms the address with a single-use token and signs the user in. */
export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return crossOriginRejected();
  const { token } = (await request.json().catch(() => ({}))) as { token?: unknown };
  const repo = getServerRepository();
  const userId = await consumeToken(repo, token, "verify_email");
  const user = userId ? await repo.getUserById(userId) : null;
  if (!user) {
    return NextResponse.json({ error: "Der Link ist ungültig oder abgelaufen." }, { status: 400 });
  }

  await repo.markEmailVerified(user.id);
  const confirmed = (await repo.getUserById(user.id)) ?? user;
  const previous = readSessionToken(request);
  if (previous) await repo.deleteSession(previous);
  const session = await repo.createSession(user.id);
  const response = NextResponse.json(sessionToResponse(session, confirmed));
  setSessionCookie(response, session.token, session.expiresAt);
  return response;
}
