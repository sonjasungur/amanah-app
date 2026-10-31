import { MIN_PASSWORD_LENGTH, PASSWORD_REQUIREMENT_ERROR } from "@/lib/auth/config";
import type { AmanahOrdnerData } from "@/lib/domain/types";
import { SCHEMA_VERSION } from "@/lib/domain/schema";
import { normalizeData } from "@/lib/domain/migration";
import { prisma } from "../prisma";
import { openFromStorage, sealForStorage } from "../data-encryption";
import {
  generateSessionToken,
  hashPasswordServer,
  hashSessionToken,
  normalizeEmail,
  verifyPasswordServer,
} from "../crypto";
import type {
  AuthTokenPurpose,
  PurchaseStatus,
  RepositoryConsent,
  RepositoryPurchase,
  RepositorySession,
  RepositoryUser,
  ServerRepository,
} from "./types";
import { Prisma } from "@prisma/client";

const SESSION_DAYS = 30;

export class PostgresRepository implements ServerRepository {
  async registerUser(email: string, password: string, name: string): Promise<RepositoryUser | { error: string }> {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || password.length < MIN_PASSWORD_LENGTH) {
      return { error: PASSWORD_REQUIREMENT_ERROR };
    }

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return { error: "Diese E-Mail ist bereits registriert." };
    }

    const passwordHash = await hashPasswordServer(password);
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: name.trim() || normalizedEmail.split("@")[0],
        passwordHash,
      },
    });

    return toRepositoryUser(user);
  }

  async authenticateUser(email: string, password: string): Promise<RepositoryUser | null> {
    const user = await prisma.user.findUnique({ where: { email: normalizeEmail(email) } });
    if (!user) return null;
    const valid = await verifyPasswordServer(password, user.passwordHash);
    return valid ? toRepositoryUser(user) : null;
  }

  async createSession(userId: string): Promise<RepositorySession> {
    const token = generateSessionToken();
    const tokenHash = hashSessionToken(token);
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

    await prisma.session.create({
      data: { tokenHash, userId, expiresAt },
    });

    return { token, userId, expiresAt: expiresAt.toISOString() };
  }

  async getSessionByToken(token: string): Promise<RepositorySession | null> {
    const tokenHash = hashSessionToken(token);
    const session = await prisma.session.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
    if (!session) return null;
    if (session.expiresAt < new Date()) {
      await prisma.session.delete({ where: { id: session.id } });
      return null;
    }
    return {
      token,
      userId: session.userId,
      expiresAt: session.expiresAt.toISOString(),
    };
  }

  async deleteSession(token: string): Promise<void> {
    const tokenHash = hashSessionToken(token);
    await prisma.session.deleteMany({ where: { tokenHash } });
  }

  async getUserById(userId: string): Promise<RepositoryUser | null> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    return user ? toRepositoryUser(user) : null;
  }

  async getAmanahData(userId: string): Promise<AmanahOrdnerData | null> {
    const row = await prisma.amanahData.findUnique({ where: { userId } });
    if (!row) return null;
    return normalizeData(openFromStorage<Partial<AmanahOrdnerData>>(row.data, userId));
  }

  async saveAmanahData(userId: string, data: AmanahOrdnerData): Promise<AmanahOrdnerData> {
    const normalized = normalizeData(data);
    const payload = { ...normalized, lastSaved: new Date().toISOString() };
    const stored = sealForStorage(payload, userId) as object;

    await prisma.amanahData.upsert({
      where: { userId },
      create: {
        userId,
        schemaVersion: SCHEMA_VERSION,
        data: stored,
      },
      update: {
        schemaVersion: SCHEMA_VERSION,
        data: stored,
      },
    });

    return payload;
  }

  async patchAmanahData(userId: string, partial: Partial<AmanahOrdnerData>): Promise<AmanahOrdnerData> {
    const existing = (await this.getAmanahData(userId)) ?? normalizeData({});
    return this.saveAmanahData(userId, normalizeData({ ...existing, ...partial }));
  }

  async deleteAmanahData(userId: string): Promise<void> {
    await prisma.amanahData.deleteMany({ where: { userId } });
  }

  async findUserByEmail(email: string): Promise<RepositoryUser | null> {
    const user = await prisma.user.findUnique({ where: { email: normalizeEmail(email) } });
    return user ? toRepositoryUser(user) : null;
  }

  async markEmailVerified(userId: string): Promise<void> {
    await prisma.user.updateMany({ where: { id: userId, emailVerifiedAt: null }, data: { emailVerifiedAt: new Date() } });
  }

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const passwordHash = await hashPasswordServer(newPassword);
    await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
      prisma.session.deleteMany({ where: { userId } }),
    ]);
  }

  async createAuthToken(userId: string, purpose: AuthTokenPurpose, tokenHash: string, expiresAt: Date): Promise<void> {
    await prisma.authToken.create({ data: { userId, purpose, tokenHash, expiresAt } });
  }

  async consumeAuthToken(tokenHash: string, purpose: AuthTokenPurpose): Promise<string | null> {
    // Conditional update = atomic single use, even under concurrent requests.
    const token = await prisma.authToken.findUnique({ where: { tokenHash } });
    if (!token || token.purpose !== purpose) return null;
    const { count } = await prisma.authToken.updateMany({
      where: { id: token.id, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    });
    return count === 1 ? token.userId : null;
  }

  async invalidateAuthTokens(userId: string, purpose: AuthTokenPurpose): Promise<void> {
    await prisma.authToken.updateMany({ where: { userId, purpose, usedAt: null }, data: { usedAt: new Date() } });
  }

  async listConsents(userId: string): Promise<RepositoryConsent[]> {
    const rows = await prisma.consentRecord.findMany({ where: { userId }, orderBy: { grantedAt: "asc" } });
    return rows.map(toRepositoryConsent);
  }

  async grantConsent(userId: string, purpose: string, textVersion: string): Promise<RepositoryConsent> {
    return toRepositoryConsent(await prisma.consentRecord.create({ data: { userId, purpose, textVersion } }));
  }

  async revokeConsent(userId: string, purpose: string): Promise<void> {
    await prisma.consentRecord.updateMany({ where: { userId, purpose, revokedAt: null }, data: { revokedAt: new Date() } });
  }

  async createPurchase(input: Omit<RepositoryPurchase, "id" | "createdAt">): Promise<RepositoryPurchase> {
    return toRepositoryPurchase(await prisma.purchase.create({ data: input }));
  }

  async getPurchaseByRef(providerRef: string): Promise<RepositoryPurchase | null> {
    const row = await prisma.purchase.findUnique({ where: { providerRef } });
    return row ? toRepositoryPurchase(row) : null;
  }

  async transitionPurchase(providerRef: string, from: PurchaseStatus[], to: PurchaseStatus): Promise<boolean> {
    const { count } = await prisma.purchase.updateMany({ where: { providerRef, status: { in: from } }, data: { status: to } });
    return count === 1;
  }

  async listPurchases(userId: string): Promise<RepositoryPurchase[]> {
    const rows = await prisma.purchase.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
    return rows.map(toRepositoryPurchase);
  }

  async recordPaymentEvent(eventId: string, provider: string, type: string, providerRef: string): Promise<boolean> {
    try {
      await prisma.paymentEvent.create({ data: { id: eventId, provider, type, providerRef } });
      return true;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return false;
      throw e;
    }
  }

  async deleteUser(userId: string): Promise<void> {
    // Sessions and amanah_data cascade (onDelete: Cascade); explicit for clarity.
    await prisma.$transaction([
      prisma.session.deleteMany({ where: { userId } }),
      prisma.authToken.deleteMany({ where: { userId } }),
      prisma.consentRecord.deleteMany({ where: { userId } }),
      prisma.amanahData.deleteMany({ where: { userId } }),
      prisma.user.deleteMany({ where: { id: userId } }),
    ]);
  }

  async checkConnection(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}

function toRepositoryUser(user: {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: Date;
  emailVerifiedAt: Date | null;
  emailVerificationLegacyAt: Date | null;
}): RepositoryUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    passwordHash: user.passwordHash,
    createdAt: user.createdAt.toISOString(),
    emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
    emailVerificationLegacyAt: user.emailVerificationLegacyAt?.toISOString() ?? null,
  };
}

function toRepositoryPurchase(row: {
  id: string;
  userId: string | null;
  productId: string;
  provider: string;
  providerRef: string;
  status: string;
  amountCents: number;
  currency: string;
  createdAt: Date;
}): RepositoryPurchase {
  return { ...row, status: row.status as PurchaseStatus, createdAt: row.createdAt.toISOString() };
}

function toRepositoryConsent(row: {
  id: string;
  purpose: string;
  textVersion: string;
  grantedAt: Date;
  revokedAt: Date | null;
}): RepositoryConsent {
  return {
    id: row.id,
    purpose: row.purpose,
    textVersion: row.textVersion,
    grantedAt: row.grantedAt.toISOString(),
    revokedAt: row.revokedAt?.toISOString() ?? null,
  };
}

export const postgresRepository = new PostgresRepository();
