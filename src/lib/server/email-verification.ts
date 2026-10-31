import { NextResponse } from "next/server";
import type { RepositoryUser, ServerRepository } from "./repository/types";

/**
 * E-mail confirmation states.
 * - verified: address confirmed.
 * - unverified: new account, must confirm before the first login.
 * - legacy_grace: account predates confirmation; full access until the deadline.
 * - legacy_overdue: deadline passed; the user can still read, export and delete, but not write.
 */
export type EmailVerificationStatus = "verified" | "unverified" | "legacy_grace" | "legacy_overdue";

export interface EmailVerificationInfo {
  status: EmailVerificationStatus;
  /** Only for legacy accounts. */
  deadline: string | null;
}

export const DEFAULT_LEGACY_GRACE_DAYS = 60;
const MAX_LEGACY_GRACE_DAYS = 365;
const DAY_MS = 24 * 60 * 60 * 1000;

export function legacyGraceDays(env: NodeJS.ProcessEnv = process.env): number {
  const raw = env.AMANAH_LEGACY_VERIFICATION_GRACE_DAYS?.trim();
  if (!raw) return DEFAULT_LEGACY_GRACE_DAYS;
  const days = Number(raw);
  if (!Number.isInteger(days) || days < 0 || days > MAX_LEGACY_GRACE_DAYS) return DEFAULT_LEGACY_GRACE_DAYS;
  return days;
}

export function emailVerificationInfo(
  user: Pick<RepositoryUser, "emailVerifiedAt" | "emailVerificationLegacyAt">,
  now: Date = new Date(),
  env: NodeJS.ProcessEnv = process.env
): EmailVerificationInfo {
  if (user.emailVerifiedAt) return { status: "verified", deadline: null };
  if (!user.emailVerificationLegacyAt) return { status: "unverified", deadline: null };
  const deadline = new Date(new Date(user.emailVerificationLegacyAt).getTime() + legacyGraceDays(env) * DAY_MS);
  return {
    status: now < deadline ? "legacy_grace" : "legacy_overdue",
    deadline: deadline.toISOString(),
  };
}

/** New accounts must confirm first; legacy accounts may log in so they keep their data. */
export function mayLogIn(info: EmailVerificationInfo): boolean {
  return info.status !== "unverified";
}

export function mayWriteFolder(info: EmailVerificationInfo): boolean {
  return info.status === "verified" || info.status === "legacy_grace";
}

/** Purchases need a confirmed address for receipts and support. */
export function mayPurchase(info: EmailVerificationInfo): boolean {
  return info.status === "verified";
}

export const VERIFICATION_REQUIRED_RESPONSE = {
  error: "Bitte bestätige zuerst deine E-Mail-Adresse. Lesen, Export und Löschen bleiben möglich.",
  code: "email_verification_required",
} as const;

/** Returns a 403 response when the user may not write folder data, otherwise null. */
export async function folderWriteBlocked(repo: ServerRepository, userId: string): Promise<NextResponse | null> {
  const user = await repo.getUserById(userId);
  if (user && mayWriteFolder(emailVerificationInfo(user))) return null;
  return NextResponse.json(VERIFICATION_REQUIRED_RESPONSE, { status: 403 });
}
