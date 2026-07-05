import type { AuthProvider, AuthResult, AuthSession, LoginInput, RegisterInput } from "./types";

const SESSION_KEY = "amanah-auth-session";

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
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

async function apiCall<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.error || "Anfrage fehlgeschlagen");
  }
  return body as T;
}

export class ApiAuthProvider implements AuthProvider {
  async register(input: RegisterInput): Promise<AuthResult> {
    try {
      const result = await apiCall<{ session: AuthSession }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(input),
      });
      writeSession(result.session);
      return { success: true, session: result.session };
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
      return { success: false, error: err instanceof Error ? err.message : "Anmeldung fehlgeschlagen" };
    }
  }

  async logout(): Promise<void> {
    const session = readSession();
    if (session) {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${session.token}` },
        });
      } catch {
        // ignore network errors on logout
      }
    }
    writeSession(null);
  }

  async getSession(): Promise<AuthSession | null> {
    const session = readSession();
    if (!session) return null;
    try {
      const result = await apiCall<{ session: AuthSession }>("/api/auth/me", {
        headers: { Authorization: `Bearer ${session.token}` },
      });
      writeSession(result.session);
      return result.session;
    } catch {
      writeSession(null);
      return null;
    }
  }
}

export const apiAuthProvider = new ApiAuthProvider();

export function getAuthToken(): string | null {
  return readSession()?.token ?? null;
}
