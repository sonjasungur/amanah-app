import { getServerRepository } from "./repository";

export async function getAuthenticatedUserId(request: Request): Promise<string | null> {
  const token = getBearerToken(request);
  if (!token) return null;
  const repo = getServerRepository();
  const session = await repo.getSessionByToken(token);
  if (!session) return null;
  const user = await repo.getUserById(session.userId);
  return user ? user.id : null;
}

export function getBearerToken(request: Request): string | null {
  const header = request.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice(7);
}

export function sessionToResponse(
  session: { token: string; expiresAt: string },
  user: { id: string; email: string; name: string; createdAt: string }
) {
  return {
    session: {
      token: session.token,
      expiresAt: session.expiresAt,
      user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
    },
  };
}

export { getServerRepository };
