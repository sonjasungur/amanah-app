import { NextResponse } from "next/server";
import { getServerRepository } from "./repository";
import { isSameOriginRequest, readSessionToken } from "./session-cookie";
import { emailVerificationInfo } from "./email-verification";
import type { RepositoryUser } from "./repository/types";

/** Cookie session only. Cross-origin state-changing requests are treated as anonymous. */
export async function getAuthenticatedUserId(request: Request): Promise<string | null> {
  if (!isSameOriginRequest(request)) return null;
  const token = readSessionToken(request);
  if (!token) return null;
  const repo = getServerRepository();
  const session = await repo.getSessionByToken(token);
  if (!session) return null;
  const user = await repo.getUserById(session.userId);
  return user ? user.id : null;
}

export function crossOriginRejected(): NextResponse {
  return NextResponse.json({ error: "Anfrage von fremder Herkunft abgelehnt." }, { status: 403 });
}

/** The token stays in the HttpOnly cookie and is never part of a response body. */
export function sessionToResponse(
  session: { expiresAt: string },
  user: Pick<RepositoryUser, "id" | "email" | "name" | "createdAt" | "emailVerifiedAt" | "emailVerificationLegacyAt">
) {
  return {
    session: {
      expiresAt: session.expiresAt,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        emailVerification: emailVerificationInfo(user),
      },
    },
  };
}

export { getServerRepository };
