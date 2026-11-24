import { getDeploymentEnv } from "@/lib/deployment-env";

/**
 * Staging only (owner 24.11.2026): one-tap login as the acceptance account, so the owner does not need
 * a second password behind the staging basic auth. Active only when all of these hold:
 * - the deployment is staging (AMANAH_DEPLOYMENT_ENV / NEXT_PUBLIC_AMANAH_ENVIRONMENT),
 * - AMANAH_STAGING_DIRECT_LOGIN names exactly one address on the reserved .invalid test domain,
 *   so it can never point at a real person's account.
 * Production validation refuses the variable, and the production compose files do not pass it on.
 */
export function stagingDirectLoginEmail(env: NodeJS.ProcessEnv = process.env): string | null {
  if (getDeploymentEnv(env) !== "staging") return null;
  const value = env.AMANAH_STAGING_DIRECT_LOGIN?.trim().toLowerCase() ?? "";
  if (!/^[a-z0-9._+-]+@[a-z0-9.-]+\.invalid$/.test(value)) return null;
  return value;
}
