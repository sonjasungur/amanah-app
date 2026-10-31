import { isBillingEnforced } from "./config";
import { featuresByTier, type PlanFeature } from "./plan-matrix";

/**
 * Who may use Vorsorge Plus features.
 * - not_enforced: enforcement is off (default) — everyone keeps everything.
 * - existing_account: account created before AMANAH_PLUS_LAUNCH_AT keeps the features that
 *   existed before the launch (availableBeforeLaunch) — no surprise removal, but no automatic
 *   claim to Plus features added later.
 * - purchase: a paid Vorsorge Plus purchase.
 * Without a launch date, enforcement grandfathers every existing account.
 */
export type PlusAccessReason = "not_enforced" | "existing_account" | "purchase" | "none";

export interface PlusAccess {
  allowed: boolean;
  reason: PlusAccessReason;
}

export function plusLaunchDate(env: NodeJS.ProcessEnv = process.env): Date | null {
  const raw = env.AMANAH_PLUS_LAUNCH_AT?.trim();
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function resolvePlusAccess(
  input: { accountCreatedAt: string | null; paidPlus: boolean; feature?: PlanFeature },
  env: NodeJS.ProcessEnv = process.env
): PlusAccess {
  if (!isBillingEnforced(env)) return { allowed: true, reason: "not_enforced" };
  if (input.paidPlus) return { allowed: true, reason: "purchase" };
  if (input.accountCreatedAt && (input.feature?.availableBeforeLaunch ?? true)) {
    const launch = plusLaunchDate(env);
    if (!launch || new Date(input.accountCreatedAt) < launch) return { allowed: true, reason: "existing_account" };
  }
  return { allowed: false, reason: "none" };
}

/** Access per Plus feature, for the status API and the client hints. */
export function resolvePlusAccessByFeature(
  input: { accountCreatedAt: string | null; paidPlus: boolean },
  env: NodeJS.ProcessEnv = process.env
): Record<string, PlusAccess> {
  return Object.fromEntries(featuresByTier("plus").map((feature) => [feature.id, resolvePlusAccess({ ...input, feature }, env)]));
}
