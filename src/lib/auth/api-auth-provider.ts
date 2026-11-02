import type { AuthProvider, AuthResult, AuthSession, LoginInput, RegisterInput } from "./types";

const SESSION_KEY = "amanah-auth-session";

/**
 * The session token is an HttpOnly cookie set by the server. Locally we keep only a
 * non-secret hint (user + expiry) so the UI can render before /api/auth/me answers.
 */
function readSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as AuthSession;
    if (new Date(session.expiresAt) < new Date()) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

function writeSession(session: AuthSession | null): void {
  if (typeof window === "undefined") return;
  if (session) {
    const hint: AuthSession = { user: session.user, expiresAt: session.expiresAt };
    localStorage.setItem(SESSION_KEY, JSON.stringify(hint));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

class ApiError extends Error {
  constructor(message: string, readonly code?: string, readonly status?: number) {
    super(message);
  }
}

async function apiCall<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  const body = await res.json();
  if (!res.ok) {
    throw new ApiError(body.error || "Anfrage fehlgeschlagen", body.code, res.status);
  }
  return body as T;
}

/** Stores the non-secret session hint after a server-side sign-in (e.g. e-mail confirmation). */
export function rememberSession(session: AuthSession): void {
  writeSession(session);
}

export class ApiAuthProvider implements AuthProvider {
  async register(input: RegisterInput): Promise<AuthResult> {
    try {
      await apiCall<{ status: string }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(input),
      });
      return { success: true, pendingVerification: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Registrierung fehlgeschlagen" };
    }
  }

  async login(input: LoginInput): Promise<AuthResult> {
    try {
      const result = await apiCall<{ session: AuthSession }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(input),
      });
      writeSession(result.session);
      return { success: true, session: result.session };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Anmeldung fehlgeschlagen",
        code: err instanceof ApiError ? err.code : undefined,
      };
    }
  }

  async logout(): Promise<void> {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore network errors on logout
    }
    writeSession(null);
  }

  async getSession(): Promise<AuthSession | null> {
    const session = readSession();
    if (!session) return null;
    try {
      const result = await apiCall<{ session: AuthSession }>("/api/auth/me");
      writeSession(result.session);
      return result.session;
    } catch (error) {
      // Only the server's answer ends a session. A request cut off by leaving the page, a network
      // problem or a brief server error must not sign anyone out; the server stays authoritative.
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        writeSession(null);
        return null;
      }
      return session;
    }
  }
}

export const apiAuthProvider = new ApiAuthProvider();

/** True while a (local demo or API) session hint exists. The server stays authoritative. */
export function hasAuthSession(): boolean {
  return readSession() !== null;
}
