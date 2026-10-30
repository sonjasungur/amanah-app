/**
 * AMANAH_BILLING_MODE: "disabled" (default) | "sandbox". There is no live mode in the code —
 * a real provider needs owner approval, contracts and legal texts first.
 * AMANAH_BILLING_ENFORCE: "true" gates Plus features behind a paid purchase (default off).
 */
export type BillingMode = "disabled" | "sandbox";

export function getBillingMode(env: NodeJS.ProcessEnv = process.env): BillingMode {
  return env.AMANAH_BILLING_MODE === "sandbox" ? "sandbox" : "disabled";
}

export function isBillingEnforced(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.AMANAH_BILLING_ENFORCE === "true";
}

export function getSandboxWebhookSecret(env: NodeJS.ProcessEnv = process.env): string {
  const secret = env.AMANAH_SANDBOX_WEBHOOK_SECRET?.trim();
  if (secret && secret.length >= 32) return secret;
  if (env.NODE_ENV === "production") throw new Error("AMANAH_SANDBOX_WEBHOOK_SECRET must be set (32+ chars) for sandbox billing.");
  return "sandbox-dev-secret-not-for-production-use-0000";
}
