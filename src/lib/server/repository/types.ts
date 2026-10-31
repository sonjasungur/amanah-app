import type { AmanahOrdnerData } from "@/lib/domain/types";

export interface RepositoryUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
  /** null until the e-mail address is confirmed. */
  emailVerifiedAt?: string | null;
  /** Set for accounts that existed before e-mail confirmation; they log in during a grace period. */
  emailVerificationLegacyAt?: string | null;
}

export interface RepositoryConsent {
  id: string;
  purpose: string;
  textVersion: string;
  grantedAt: string;
  revokedAt: string | null;
}

export type AuthTokenPurpose = "verify_email" | "reset_password";

export type PurchaseStatus = "pending" | "paid" | "failed" | "refunded";

export interface RepositoryPurchase {
  id: string;
  userId: string | null;
  productId: string;
  provider: string;
  providerRef: string;
  status: PurchaseStatus;
  amountCents: number;
  currency: string;
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
  deleteAmanahData(userId: string): Promise<void>;
  /** Removes the user, all sessions and all stored data (Art. 17 DSGVO). */
  deleteUser(userId: string): Promise<void>;
  findUserByEmail(email: string): Promise<RepositoryUser | null>;
  markEmailVerified(userId: string): Promise<void>;
  /** Sets a new password and revokes every session of the user. */
  updatePassword(userId: string, newPassword: string): Promise<void>;
  /** Stores only the hash of the token. */
  createAuthToken(userId: string, purpose: AuthTokenPurpose, tokenHash: string, expiresAt: Date): Promise<void>;
  /** Atomically marks a valid, unused, unexpired token as used and returns its user. */
  consumeAuthToken(tokenHash: string, purpose: AuthTokenPurpose): Promise<string | null>;
  invalidateAuthTokens(userId: string, purpose: AuthTokenPurpose): Promise<void>;
  listConsents(userId: string): Promise<RepositoryConsent[]>;
  grantConsent(userId: string, purpose: string, textVersion: string): Promise<RepositoryConsent>;
  revokeConsent(userId: string, purpose: string): Promise<void>;
  createPurchase(input: Omit<RepositoryPurchase, "id" | "createdAt">): Promise<RepositoryPurchase>;
  getPurchaseByRef(providerRef: string): Promise<RepositoryPurchase | null>;
  /** Conditional status change; returns false if the purchase was not in one of `from`. */
  transitionPurchase(providerRef: string, from: PurchaseStatus[], to: PurchaseStatus): Promise<boolean>;
  listPurchases(userId: string): Promise<RepositoryPurchase[]>;
  /** Stores a provider event id; returns false if it was already processed (idempotency). */
  recordPaymentEvent(eventId: string, provider: string, type: string, providerRef: string): Promise<boolean>;
  checkConnection?(): Promise<boolean>;
}
