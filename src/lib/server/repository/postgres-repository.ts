import type { AmanahOrdnerData } from "@/lib/domain/types";
import { SCHEMA_VERSION } from "@/lib/domain/schema";
import { normalizeData } from "@/lib/domain/migration";
import { prisma } from "../prisma";
import {
  generateSessionToken,
  hashPasswordServer,
  hashSessionToken,
  normalizeEmail,
  verifyPasswordServer,
} from "../crypto";
import type { RepositorySession, RepositoryUser, ServerRepository } from "./types";

const SESSION_DAYS = 30;

export class PostgresRepository implements ServerRepository {
  async registerUser(email: string, password: string, name: string): Promise<RepositoryUser | { error: string }> {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || password.length < 6) {
      return { error: "E-Mail und Passwort (min. 6 Zeichen) erforderlich." };
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
    return normalizeData(row.data as Partial<AmanahOrdnerData>);
  }

  async saveAmanahData(userId: string, data: AmanahOrdnerData): Promise<AmanahOrdnerData> {
    const normalized = normalizeData(data);
    const payload = { ...normalized, lastSaved: new Date().toISOString() };

    await prisma.amanahData.upsert({
      where: { userId },
      create: {
        userId,
        schemaVersion: SCHEMA_VERSION,
        data: payload as object,
      },
      update: {
        schemaVersion: SCHEMA_VERSION,
        data: payload as object,
      },
    });

    return payload;
  }

  async patchAmanahData(userId: string, partial: Partial<AmanahOrdnerData>): Promise<AmanahOrdnerData> {
    const existing = (await this.getAmanahData(userId)) ?? normalizeData({});
    return this.saveAmanahData(userId, normalizeData({ ...existing, ...partial }));
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

function toRepositoryUser(user: { id: string; email: string; name: string; passwordHash: string; createdAt: Date }): RepositoryUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    passwordHash: user.passwordHash,
    createdAt: user.createdAt.toISOString(),
  };
}

export const postgresRepository = new PostgresRepository();
