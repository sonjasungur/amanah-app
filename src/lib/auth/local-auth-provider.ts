import { hashPassword, verifyPassword } from "./hash";
import type { AuthProvider, AuthResult, AuthSession, LoginInput, RegisterInput } from "./types";

const USERS_KEY = "amanah-auth-users";
const SESSION_KEY = "amanah-auth-session";

interface StoredUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
}

function readUsers(): StoredUser[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

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

function createToken(): string {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export class LocalAuthProvider implements AuthProvider {
  async register(input: RegisterInput): Promise<AuthResult> {
    const email = input.email.trim().toLowerCase();
    if (!email || !input.password || input.password.length < 6) {
      return { success: false, error: "E-Mail und Passwort (min. 6 Zeichen) erforderlich." };
    }

    const users = readUsers();
    if (users.some((u) => u.email === email)) {
      return { success: false, error: "Diese E-Mail ist bereits registriert." };
    }

    const user: StoredUser = {
      id: `user-${Date.now()}`,
      email,
      name: input.name.trim() || email.split("@")[0],
      passwordHash: await hashPassword(input.password),
      createdAt: new Date().toISOString(),
    };
    users.push(user);
    writeUsers(users);

    const session: AuthSession = {
      user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
      token: createToken(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
    writeSession(session);
    return { success: true, session };
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const email = input.email.trim().toLowerCase();
    const user = readUsers().find((u) => u.email === email);
    if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
      return { success: false, error: "E-Mail oder Passwort ungültig." };
    }

    const session: AuthSession = {
      user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
      token: createToken(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
    writeSession(session);
    return { success: true, session };
  }

  async logout(): Promise<void> {
    writeSession(null);
  }

  async getSession(): Promise<AuthSession | null> {
    return readSession();
  }
}

export const localAuthProvider = new LocalAuthProvider();
