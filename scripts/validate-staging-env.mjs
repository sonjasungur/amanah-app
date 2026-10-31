#!/usr/bin/env node
/**
 * Staging env validation: every production rule, except that the dev outbox, sandbox billing
 * and internal tools are allowed — plus rules that keep staging synthetic and closed:
 * no real mail provider, registration only for reserved test domains, a database of its own,
 * no external AI. See docs/strategy/22-staging-und-pilot.md.
 *
 *   set -a; source .env.staging; set +a; node scripts/validate-staging-env.mjs
 */
import { sanitizeEnvForLogs, validateProductionEnv } from "./validate-production-env.mjs";

/** RFC 2606 / RFC 6761: never resolvable, so no real mailbox can be registered. */
const RESERVED_TLDS = [".invalid", ".test", ".example"];

const ALLOWED_IN_STAGING = [
  "AMANAH_MAIL_TRANSPORT=outbox",
  "AMANAH_BILLING_MODE=sandbox",
  "AMANAH_BILLING_MODE=stripe_test",
  "AMANAH_INTERNAL_TOOLS must not",
];

function databaseName(url) {
  try {
    return new URL(url).pathname.replace(/^\//, "");
  } catch {
    return "";
  }
}

export function validateStagingEnv(env = process.env) {
  const base = validateProductionEnv(env);
  const errors = base.errors.filter((e) => !ALLOWED_IN_STAGING.some((allowed) => e.includes(allowed)));
  const warnings = [...base.warnings];

  if (env.AMANAH_DEPLOYMENT_ENV !== "staging") errors.push("AMANAH_DEPLOYMENT_ENV must be staging");
  if (env.NEXT_PUBLIC_AMANAH_ENVIRONMENT !== "staging") {
    errors.push("NEXT_PUBLIC_AMANAH_ENVIRONMENT must be staging (banner, noindex)");
  }

  const mail = env.AMANAH_MAIL_TRANSPORT ?? "disabled";
  if (mail !== "outbox" && mail !== "disabled") {
    errors.push("Staging must not send real mail: AMANAH_MAIL_TRANSPORT must be outbox or disabled");
  }

  const domains = (env.AMANAH_REGISTRATION_ALLOWED_DOMAINS ?? "")
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
  if (domains.length === 0) {
    errors.push("AMANAH_REGISTRATION_ALLOWED_DOMAINS is required on staging (reserved test domains only)");
  } else if (!domains.every((d) => RESERVED_TLDS.some((tld) => d.endsWith(tld)))) {
    errors.push(`AMANAH_REGISTRATION_ALLOWED_DOMAINS may only contain reserved domains (${RESERVED_TLDS.join(", ")})`);
  }

  if (!/staging/i.test(databaseName(env.DATABASE_URL ?? ""))) {
    errors.push("DATABASE_URL must point to a separate staging database (name contains 'staging')");
  }
  if (env.AMANAH_AI_ENABLED === "true" || env.NEXT_PUBLIC_AMANAH_AI_ENABLED === "true") {
    errors.push("External AI must stay off on staging");
  }
  if (env.AMANAH_BILLING_ENFORCE === "true") {
    errors.push("AMANAH_BILLING_ENFORCE must stay off until the owner approves the Plus split");
  }
  if (env.AMANAH_BILLING_MODE === "sandbox" && (env.AMANAH_SANDBOX_WEBHOOK_SECRET?.trim().length ?? 0) < 32) {
    errors.push("AMANAH_SANDBOX_WEBHOOK_SECRET (32+ chars) is required for sandbox billing");
  }
  if (env.AMANAH_BILLING_MODE === "stripe_test") {
    if (!/^(sk|rk)_test_[A-Za-z0-9]{10,}$/.test(env.AMANAH_STRIPE_SECRET_KEY?.trim() ?? "")) {
      errors.push("AMANAH_STRIPE_SECRET_KEY must be a Stripe test key (sk_test_… or rk_test_…) of the Amanah account");
    }
    if (!/^whsec_[A-Za-z0-9]{10,}$/.test(env.AMANAH_STRIPE_WEBHOOK_SECRET?.trim() ?? "")) {
      errors.push("AMANAH_STRIPE_WEBHOOK_SECRET (whsec_…) of the staging webhook endpoint is required");
    }
    warnings.push("Stripe: use the test keys of the separate Amanah account, never keys of another business (docs 25)");
  }
  warnings.push("Use data keys, session secret and database credentials that differ from production");

  return { valid: errors.length === 0, errors, warnings };
}

if (process.argv[1]?.endsWith("validate-staging-env.mjs")) {
  const result = validateStagingEnv(process.env);
  for (const w of result.warnings) console.log("⚠", w);
  for (const e of result.errors) console.error("✗", e);
  console.log("Env summary:", JSON.stringify(sanitizeEnvForLogs(process.env)));
  process.exit(result.valid ? 0 : 1);
}
