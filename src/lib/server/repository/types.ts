import type { AmanahOrdnerData } from "@/lib/domain/types";

export interface RepositoryUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
}

export interface RepositorySession {
  token: string;
  userId: string;
  expiresAt: string;
}

export interface ServerRepository {
  registerUser(email: string, password: string, name: string): Promise<RepositoryUser | { error: string }>;
  authenticateUser(email: string, password: string): Promise<RepositoryUser | null>;
  createSession(userId: string): Promise<RepositorySession>;
  getSessionByToken(token: string): Promise<RepositorySession | null>;
  deleteSession(token: string): Promise<void>;
  getUserById(userId: string): Promise<RepositoryUser | null>;
  getAmanahData(userId: string): Promise<AmanahOrdnerData | null>;
  saveAmanahData(userId: string, data: AmanahOrdnerData): Promise<AmanahOrdnerData>;
  patchAmanahData(userId: string, partial: Partial<AmanahOrdnerData>): Promise<AmanahOrdnerData>;
  checkConnection?(): Promise<boolean>;
}
