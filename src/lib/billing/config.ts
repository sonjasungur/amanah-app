/**
 * AMANAH_BILLING_MODE: "disabled" (default) | "sandbox" | "stripe_test". There is no live mode in
 * the code — real payments need owner approval, contracts and legal texts first. "stripe_test"
 * talks to Stripe's test mode only and refuses live keys (docs/strategy/25-stripe-einrichtung.md).
 * AMANAH_BILLING_ENFORCE: "true" gates Plus features behind a paid purchase (default off).
 */
export type BillingMode = "disabled" | "sandbox" | "stripe_test";

export function getBillingMode(env: NodeJS.ProcessEnv = process.env): BillingMode {
  if (env.AMANAH_BILLING_MODE === "sandbox") return "sandbox";
  if (env.AMANAH_BILLING_MODE === "stripe_test") return "stripe_test";
  return "disabled";
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

/** Secret or restricted test keys only. Anything else — above all a live key — is refused. */
const STRIPE_TEST_KEY = /^(sk|rk)_test_[A-Za-z0-9]{10,}$/;
const STRIPE_LIVE_KEY = /^(sk|rk|pk)_live_/;
const STRIPE_WEBHOOK_SECRET = /^whsec_[A-Za-z0-9]{10,}$/;

export class StripeConfigError extends Error {}

export function isStripeLiveKey(value: string | undefined): boolean {
  return STRIPE_LIVE_KEY.test(value?.trim() ?? "");
}

export interface StripeTestConfig {
  secretKey: string;
  webhookSecret: string;
}

export function getStripeTestConfig(env: NodeJS.ProcessEnv = process.env): StripeTestConfig {
  const secretKey = env.AMANAH_STRIPE_SECRET_KEY?.trim() ?? "";
  const webhookSecret = env.AMANAH_STRIPE_WEBHOOK_SECRET?.trim() ?? "";
  if (isStripeLiveKey(secretKey)) throw new StripeConfigError("Stripe live keys are not allowed: only test mode is implemented.");
  if (!STRIPE_TEST_KEY.test(secretKey)) throw new StripeConfigError("AMANAH_STRIPE_SECRET_KEY must be a Stripe test key (sk_test_… or rk_test_…).");
  if (!STRIPE_WEBHOOK_SECRET.test(webhookSecret)) throw new StripeConfigError("AMANAH_STRIPE_WEBHOOK_SECRET must be the endpoint signing secret (whsec_…).");
  return { secretKey, webhookSecret };
}
