import { getSessionByToken, getUserById } from "./memory-store";

export function getBearerToken(request: Request): string | null {
  const header = request.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice(7);
}

export function getAuthenticatedUserId(request: Request): string | null {
  const token = getBearerToken(request);
  if (!token) return null;
  const session = getSessionByToken(token);
  if (!session) return null;
  const user = getUserById(session.userId);
  return user ? user.id : null;
}

export function sessionToResponse(session: { token: string; expiresAt: string }, user: { id: string; email: string; name: string; createdAt: string }) {
  return {
    session: {
      token: session.token,
      expiresAt: session.expiresAt,
      user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
    },
  };
}
