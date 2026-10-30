import { MIN_PASSWORD_LENGTH, PASSWORD_REQUIREMENT_ERROR } from "@/lib/auth/config";
import type { AmanahOrdnerData } from "@/lib/domain/types";
import { normalizeData } from "@/lib/domain/migration";
import type {
  AuthTokenPurpose,
  PurchaseStatus,
  RepositoryConsent,
  RepositoryPurchase,
  RepositorySession,
  RepositoryUser,
  ServerRepository,
} from "./types";
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
      emailVerifiedAt: null,
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
    this.deleteSessionsFor(userId);
    for (const [hash, token] of store.authTokens) {
      if (token.userId === userId) store.authTokens.delete(hash);
    }
    store.consents = store.consents.filter((c) => c.userId !== userId);
    // Purchases are kept anonymised (possible retention duties).
    for (const p of store.purchases) if (p.userId === userId) p.userId = null;
    store.amanahData.delete(userId);
    store.users.delete(userId);
    if (user) store.usersByEmail.delete(user.email);
  }

  private deleteSessionsFor(userId: string): void {
    const store = getMemoryStore();
    for (const [token, session] of store.sessions) {
      if (session.userId === userId) store.sessions.delete(token);
    }
  }

  async findUserByEmail(email: string): Promise<RepositoryUser | null> {
    const store = getMemoryStore();
    const id = store.usersByEmail.get(normalizeEmail(email));
    return id ? store.users.get(id) ?? null : null;
  }

  async markEmailVerified(userId: string): Promise<void> {
    const user = getMemoryStore().users.get(userId);
    if (user && !user.emailVerifiedAt) user.emailVerifiedAt = new Date().toISOString();
  }

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const user = getMemoryStore().users.get(userId);
    if (!user) return;
    user.passwordHash = await hashPasswordServer(newPassword);
    this.deleteSessionsFor(userId);
  }

  async createAuthToken(userId: string, purpose: AuthTokenPurpose, tokenHash: string, expiresAt: Date): Promise<void> {
    getMemoryStore().authTokens.set(tokenHash, { userId, purpose, expiresAt: expiresAt.toISOString(), usedAt: null });
  }

  async consumeAuthToken(tokenHash: string, purpose: AuthTokenPurpose): Promise<string | null> {
    const token = getMemoryStore().authTokens.get(tokenHash);
    if (!token || token.purpose !== purpose || token.usedAt || new Date(token.expiresAt) < new Date()) return null;
    token.usedAt = new Date().toISOString();
    return token.userId;
  }

  async invalidateAuthTokens(userId: string, purpose: AuthTokenPurpose): Promise<void> {
    const now = new Date().toISOString();
    for (const token of getMemoryStore().authTokens.values()) {
      if (token.userId === userId && token.purpose === purpose && !token.usedAt) token.usedAt = now;
    }
  }

  async listConsents(userId: string): Promise<RepositoryConsent[]> {
    return getMemoryStore()
      .consents.filter((c) => c.userId === userId)
      .map(toConsent);
  }

  async grantConsent(userId: string, purpose: string, textVersion: string): Promise<RepositoryConsent> {
    const record = { id: crypto.randomUUID(), userId, purpose, textVersion, grantedAt: new Date().toISOString(), revokedAt: null };
    getMemoryStore().consents.push(record);
    return toConsent(record);
  }

  async createPurchase(input: Omit<RepositoryPurchase, "id" | "createdAt">): Promise<RepositoryPurchase> {
    const purchase = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    getMemoryStore().purchases.push(purchase);
    return { ...purchase };
  }

  async getPurchaseByRef(providerRef: string): Promise<RepositoryPurchase | null> {
    const p = getMemoryStore().purchases.find((x) => x.providerRef === providerRef);
    return p ? { ...p } : null;
  }

  async transitionPurchase(providerRef: string, from: PurchaseStatus[], to: PurchaseStatus): Promise<boolean> {
    const p = getMemoryStore().purchases.find((x) => x.providerRef === providerRef);
    if (!p || !from.includes(p.status)) return false;
    p.status = to;
    return true;
  }

  async listPurchases(userId: string): Promise<RepositoryPurchase[]> {
    return getMemoryStore().purchases.filter((p) => p.userId === userId).map((p) => ({ ...p }));
  }

  async recordPaymentEvent(eventId: string): Promise<boolean> {
    const events = getMemoryStore().paymentEvents;
    if (events.has(eventId)) return false;
    events.add(eventId);
    return true;
  }

  async revokeConsent(userId: string, purpose: string): Promise<void> {
    const now = new Date().toISOString();
    for (const c of getMemoryStore().consents) {
      if (c.userId === userId && c.purpose === purpose && !c.revokedAt) c.revokedAt = now;
    }
  }

  async checkConnection(): Promise<boolean> {
    return true;
  }
}

function toConsent(c: RepositoryConsent & { userId: string }): RepositoryConsent {
  return { id: c.id, purpose: c.purpose, textVersion: c.textVersion, grantedAt: c.grantedAt, revokedAt: c.revokedAt };
}

export const memoryRepository = new MemoryRepository();
