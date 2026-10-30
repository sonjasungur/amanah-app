import { MIN_PASSWORD_LENGTH, PASSWORD_REQUIREMENT_ERROR } from "@/lib/auth/config";
import type { AmanahOrdnerData } from "@/lib/domain/types";
import { normalizeData } from "@/lib/domain/migration";
import type { RepositorySession, RepositoryUser, ServerRepository } from "./types";
import {
  getMemoryStore,
  createSessionToken,
} from "../memory-store";
import { hashPasswordServer, verifyPasswordServer } from "../crypto";
import { openFromStorage, sealForStorage } from "../data-encryption";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export class MemoryRepository implements ServerRepository {
  async registerUser(email: string, password: string, name: string): Promise<RepositoryUser | { error: string }> {
    const store = getMemoryStore();
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || password.length < MIN_PASSWORD_LENGTH) {
      return { error: PASSWORD_REQUIREMENT_ERROR };
    }
    if (store.usersByEmail.has(normalizedEmail)) {
      return { error: "Diese E-Mail ist bereits registriert." };
    }

    const user: RepositoryUser = {
      id: `user-${crypto.randomUUID()}`,
      email: normalizedEmail,
      name: name.trim() || normalizedEmail.split("@")[0],
      passwordHash: await hashPasswordServer(password),
      createdAt: new Date().toISOString(),
    };
    store.users.set(user.id, user);
    store.usersByEmail.set(normalizedEmail, user.id);
    return user;
  }

  async authenticateUser(email: string, password: string): Promise<RepositoryUser | null> {
    const store = getMemoryStore();
    const userId = store.usersByEmail.get(normalizeEmail(email));
    if (!userId) return null;
    const user = store.users.get(userId);
    if (!user) return null;
    return (await verifyPasswordServer(password, user.passwordHash)) ? user : null;
  }

  async createSession(userId: string): Promise<RepositorySession> {
    const store = getMemoryStore();
    const session: RepositorySession = {
      token: createSessionToken(),
      userId,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
    store.sessions.set(session.token, session);
    return session;
  }

  async getSessionByToken(token: string): Promise<RepositorySession | null> {
    const store = getMemoryStore();
    const session = store.sessions.get(token);
    if (!session) return null;
    if (new Date(session.expiresAt) < new Date()) {
      store.sessions.delete(token);
      return null;
    }
    return session;
  }

  async deleteSession(token: string): Promise<void> {
    getMemoryStore().sessions.delete(token);
  }

  async getUserById(userId: string): Promise<RepositoryUser | null> {
    return getMemoryStore().users.get(userId) ?? null;
  }

  async getAmanahData(userId: string): Promise<AmanahOrdnerData | null> {
    const stored = getMemoryStore().amanahData.get(userId);
    return stored ? normalizeData(openFromStorage<Partial<AmanahOrdnerData>>(stored, userId)) : null;
  }

  async saveAmanahData(userId: string, data: AmanahOrdnerData): Promise<AmanahOrdnerData> {
    const normalized = normalizeData(data);
    const saved = { ...normalized, lastSaved: new Date().toISOString() };
    // Same storage boundary as Postgres: sealed when keys are configured.
    getMemoryStore().amanahData.set(userId, sealForStorage(saved, userId) as AmanahOrdnerData);
    return saved;
  }

  async patchAmanahData(userId: string, partial: Partial<AmanahOrdnerData>): Promise<AmanahOrdnerData> {
    const existing = (await this.getAmanahData(userId)) ?? normalizeData({});
    return this.saveAmanahData(userId, normalizeData({ ...existing, ...partial }));
  }

  async deleteAmanahData(userId: string): Promise<void> {
    getMemoryStore().amanahData.delete(userId);
  }

  async deleteUser(userId: string): Promise<void> {
    const store = getMemoryStore();
    const user = store.users.get(userId);
    for (const [token, session] of store.sessions) {
      if (session.userId === userId) store.sessions.delete(token);
    }
    store.amanahData.delete(userId);
    store.users.delete(userId);
    if (user) store.usersByEmail.delete(user.email);
  }

  async checkConnection(): Promise<boolean> {
    return true;
  }
}

export const memoryRepository = new MemoryRepository();
