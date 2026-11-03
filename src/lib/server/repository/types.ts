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

/** Metadata only: listing a version never returns its content. */
export interface RepositoryDataVersion {
  id: string;
  changeType: string;
  /** Empty when a version can no longer be read, e.g. after losing a key. */
  sections: string[];
  createdAt: string;
}

export interface RepositoryDataVersionExport extends RepositoryDataVersion {
  prior: Record<string, unknown> | null;
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
  /** Removes the folder and its whole history. */
  deleteAmanahData(userId: string): Promise<void>;
  /** Throws DataEncryptionError when a stored folder exists but cannot be opened. */
  assertFolderReadable(userId: string): Promise<void>;
  /** Newest first, without expired versions. */
  listDataVersions(userId: string): Promise<RepositoryDataVersion[]>;
  /** One version with its content, for its owner. Null when it is not this user's or expired. */
  getDataVersion(userId: string, versionId: string): Promise<RepositoryDataVersionExport | null>;
  /** What the history holds, for the account export (Art. 15/20 DSGVO). Expired versions are deleted first. */
  exportDataVersions(userId: string): Promise<RepositoryDataVersionExport[]>;
  /** Only ever called on an explicit user action. Null when the version is not this user's or expired. */
  restoreDataVersion(userId: string, versionId: string, allowedSections?: readonly string[]): Promise<AmanahOrdnerData | null>;
  deleteDataVersions(userId: string): Promise<void>;
  /** Deletes this version and all older ones, so that the remaining ones stay complete. False when it is not this user's. */
  deleteDataVersionsUpTo(userId: string, versionId: string): Promise<boolean>;
  /** Removes versions past their retention for all accounts; returns how many. */
  purgeExpiredDataVersions(now?: Date): Promise<number>;
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
  /** Only where a database survives the ledger's checks; see deletion-gate.ts. */
  setDeletionLedgerAnchor?(anchor: { epoch: number; seq: number }): Promise<void>;
}
