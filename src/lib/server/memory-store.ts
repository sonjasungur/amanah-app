import { MIN_PASSWORD_LENGTH, PASSWORD_REQUIREMENT_ERROR } from "@/lib/auth/config";
import type { AmanahOrdnerData } from "@/lib/domain/types";
import { normalizeData } from "@/lib/domain/migration";
import { hashPasswordSync } from "@/lib/auth/hash";
import { generateSessionToken } from "./crypto";

export interface StoredUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
  emailVerifiedAt?: string | null;
}

export interface StoredConsent {
  id: string;
  userId: string;
  purpose: string;
  textVersion: string;
  grantedAt: string;
  revokedAt: string | null;
}

export interface StoredAuthToken {
  userId: string;
  purpose: string;
  expiresAt: string;
  usedAt: string | null;
}

export interface StoredSession {
  token: string;
  userId: string;
  expiresAt: string;
}

interface MemoryStoreState {
  users: Map<string, StoredUser>;
  usersByEmail: Map<string, string>;
  sessions: Map<string, StoredSession>;
  amanahData: Map<string, AmanahOrdnerData>;
  consents: StoredConsent[];
  /** keyed by token hash */
  authTokens: Map<string, StoredAuthToken>;
  purchases: import("./repository/types").RepositoryPurchase[];
  paymentEvents: Set<string>;
}

declare global {
  var __amanahMemoryStore: MemoryStoreState | undefined;
}

function createStore(): MemoryStoreState {
  return {
    users: new Map(),
    usersByEmail: new Map(),
    sessions: new Map(),
    amanahData: new Map(),
    consents: [],
    authTokens: new Map(),
    purchases: [],
    paymentEvents: new Set(),
  };
}

export function getMemoryStore(): MemoryStoreState {
  if (!globalThis.__amanahMemoryStore) {
    globalThis.__amanahMemoryStore = createStore();
  }
  return globalThis.__amanahMemoryStore;
}

export function createSessionToken(): string {
  return `srv-${generateSessionToken()}`;
}

export async function registerUser(email: string, password: string, name: string): Promise<StoredUser | { error: string }> {
  const store = getMemoryStore();
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || password.length < MIN_PASSWORD_LENGTH) {
    return { error: PASSWORD_REQUIREMENT_ERROR };
  }
  if (store.usersByEmail.has(normalizedEmail)) {
    return { error: "Diese E-Mail ist bereits registriert." };
  }

  const user: StoredUser = {
    id: `user-${Date.now()}`,
    email: normalizedEmail,
    name: name.trim() || normalizedEmail.split("@")[0],
    passwordHash: hashPasswordSync(password),
    createdAt: new Date().toISOString(),
  };
  store.users.set(user.id, user);
  store.usersByEmail.set(normalizedEmail, user.id);
  return user;
}

export async function authenticateUser(email: string, password: string): Promise<StoredUser | null> {
  const store = getMemoryStore();
  const userId = store.usersByEmail.get(email.trim().toLowerCase());
  if (!userId) return null;
  const user = store.users.get(userId);
  if (!user) return null;
  const hash = hashPasswordSync(password);
  return hash === user.passwordHash ? user : null;
}

export function createSession(userId: string): StoredSession {
  const store = getMemoryStore();
  const session: StoredSession = {
    token: createSessionToken(),
    userId,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };
  store.sessions.set(session.token, session);
  return session;
}

export function getSessionByToken(token: string): StoredSession | null {
  const store = getMemoryStore();
  const session = store.sessions.get(token);
  if (!session) return null;
  if (new Date(session.expiresAt) < new Date()) {
    store.sessions.delete(token);
    return null;
  }
  return session;
}

export function deleteSession(token: string): void {
  getMemoryStore().sessions.delete(token);
}

export function getUserById(userId: string): StoredUser | null {
  return getMemoryStore().users.get(userId) ?? null;
}

export function getAmanahData(userId: string): AmanahOrdnerData | null {
  return getMemoryStore().amanahData.get(userId) ?? null;
}

export function saveAmanahData(userId: string, data: AmanahOrdnerData): AmanahOrdnerData {
  const normalized = normalizeData(data);
  getMemoryStore().amanahData.set(userId, { ...normalized, lastSaved: new Date().toISOString() });
  return getMemoryStore().amanahData.get(userId)!;
}

export function patchAmanahData(userId: string, partial: Partial<AmanahOrdnerData>): AmanahOrdnerData {
  const existing = getAmanahData(userId) ?? normalizeData({});
  const merged = normalizeData({ ...existing, ...partial });
  return saveAmanahData(userId, merged);
}

export function getDatabaseStatus(): "not_configured" | "configured" {
  return process.env.DATABASE_URL ? "configured" : "not_configured";
}
