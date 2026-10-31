#!/usr/bin/env node
/**
 * Production env validation for deploy scripts (no TypeScript runtime required).
 * Keep in sync with src/lib/server/production-config.ts
 */

const PLACEHOLDER_PATTERNS = [
  /change-me/i,
  /replace_with/i,
  /example\.com/i,
  /your[_-]?secret/i,
  /dev-only/i,
  /local-only/i,
  /in-production/i,
  /amanah_dev_password/i,
];

export function isPlaceholderValue(value) {
  if (!value || !String(value).trim()) return true;
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(String(value).trim()));
}

export function validateProductionEnv(env = process.env) {
  const errors = [];
  const warnings = [];

  if (env.NODE_ENV !== "production") {
    warnings.push("NODE_ENV is not production");
  }

  if (!env.DATABASE_URL?.trim()) {
    errors.push("DATABASE_URL is required");
  } else if (isPlaceholderValue(env.DATABASE_URL)) {
    errors.push("DATABASE_URL still contains a placeholder value");
  }

  const sessionSecret = env.SESSION_SECRET?.trim() || env.AUTH_SECRET?.trim();
  if (!sessionSecret) {
    errors.push("SESSION_SECRET (or AUTH_SECRET) is required");
  } else if (sessionSecret.length < 32) {
    errors.push("SESSION_SECRET must be at least 32 characters");
  } else if (isPlaceholderValue(sessionSecret)) {
    errors.push("SESSION_SECRET still contains a placeholder value");
  }

  // Data encryption at rest (see src/lib/server/data-encryption.ts)
  const dataKeys = env.AMANAH_DATA_KEYS?.trim();
  if (!dataKeys) {
    errors.push("AMANAH_DATA_KEYS is required in production (data encryption at rest)");
  } else {
    const entries = dataKeys.split(",").map((e) => e.trim().split(":"));
    if (entries.some(([kid, b64]) => !kid || !b64 || Buffer.from(b64, "base64").length !== 32)) {
      errors.push("AMANAH_DATA_KEYS must be kid:base64 entries with 32-byte keys");
    }
    const active = env.AMANAH_DATA_KEY_ACTIVE?.trim();
    if (active && !entries.some(([kid]) => kid === active)) {
      errors.push("AMANAH_DATA_KEY_ACTIVE is not in AMANAH_DATA_KEYS");
    }
  }
  if (env.AMANAH_DATA_ENCRYPTION === "optional") {
    errors.push("AMANAH_DATA_ENCRYPTION=optional is not allowed in production");
  }

  if (env.POSTGRES_PASSWORD && isPlaceholderValue(env.POSTGRES_PASSWORD)) {
    errors.push("POSTGRES_PASSWORD still contains a placeholder value");
  }

  if (env.AMANAH_BILLING_MODE === "sandbox") {
    errors.push("AMANAH_BILLING_MODE=sandbox is not allowed in production (no live payments are implemented)");
  }
  if (env.AMANAH_BILLING_MODE === "stripe_test") {
    errors.push("AMANAH_BILLING_MODE=stripe_test is not allowed in production (Stripe test mode is for staging only)");
  }
  // Live keys are refused everywhere until a live mode is implemented and approved (docs 25).
  for (const name of ["AMANAH_STRIPE_SECRET_KEY", "AMANAH_STRIPE_PUBLISHABLE_KEY"]) {
    if (/^(sk|rk|pk)_live_/.test(env[name]?.trim() ?? "")) {
      errors.push(`${name} is a Stripe live key — only test mode is implemented`);
    }
  }
  if (env.AMANAH_BILLING_ENFORCE === "true" && !env.AMANAH_PLUS_LAUNCH_AT?.trim()) {
    errors.push("AMANAH_BILLING_ENFORCE=true needs AMANAH_PLUS_LAUNCH_AT so existing accounts keep their features");
  }
  if (env.AMANAH_MAIL_TRANSPORT === "brevo" || env.AMANAH_MAIL_TRANSPORT === "postmark") {
    if (!env.AMANAH_MAIL_API_KEY?.trim() || isPlaceholderValue(env.AMANAH_MAIL_API_KEY)) {
      errors.push("AMANAH_MAIL_API_KEY is required for the configured mail provider");
    }
    if (!env.AMANAH_MAIL_FROM?.trim() || isPlaceholderValue(env.AMANAH_MAIL_FROM)) {
      errors.push("AMANAH_MAIL_FROM is required for the configured mail provider");
    }
  }
  if (env.AMANAH_MAIL_TRANSPORT === "outbox") {
    errors.push("AMANAH_MAIL_TRANSPORT=outbox is for development only");
  }
  if (env.AMANAH_INTERNAL_TOOLS === "true") {
    errors.push("AMANAH_INTERNAL_TOOLS must not be enabled in production");
  }
  if (env.AMANAH_DEV_OUTBOX === "true") {
    errors.push("AMANAH_DEV_OUTBOX must not be enabled in production");
  }
  if (!env.AMANAH_PUBLIC_BASE_URL?.trim() && !env.NEXT_PUBLIC_SITE_URL?.trim() && !env.NEXT_PUBLIC_APP_URL?.trim()) {
    errors.push("AMANAH_PUBLIC_BASE_URL (or NEXT_PUBLIC_SITE_URL) is required for links in e-mails");
  }
  if ((env.AMANAH_MAIL_TRANSPORT ?? "disabled") === "disabled") {
    warnings.push("No mail transport configured: registration, e-mail confirmation and password reset are unavailable");
  }

  if (env.NEXT_PUBLIC_AUTH_MODE !== "api") {
    errors.push("NEXT_PUBLIC_AUTH_MODE must be api in production");
  }

  if (env.NEXT_PUBLIC_STORAGE_MODE !== "api") {
    errors.push("NEXT_PUBLIC_STORAGE_MODE must be api in production");
  }

  if (env.AMANAH_SERVER_STORAGE !== "postgres") {
    errors.push("AMANAH_SERVER_STORAGE must be postgres in production");
  }

  const aiProvider = (env.AMANAH_AI_PROVIDER || env.AI_PROVIDER || "rules").toLowerCase();
  if (aiProvider === "openai" && !env.OPENAI_API_KEY?.trim()) {
    errors.push("AMANAH_AI_PROVIDER=openai requires OPENAI_API_KEY");
  }

  if (aiProvider !== "rules" && aiProvider !== "mock") {
    warnings.push(`AI provider is '${aiProvider}' — ensure consent gating is enabled`);
  }

  if (!env.NEXT_PUBLIC_SITE_URL?.trim() && !env.NEXT_PUBLIC_APP_URL?.trim()) {
    warnings.push("NEXT_PUBLIC_SITE_URL or NEXT_PUBLIC_APP_URL should be set");
  } else if (isPlaceholderValue(env.NEXT_PUBLIC_SITE_URL || env.NEXT_PUBLIC_APP_URL)) {
    warnings.push("Public site URL still uses example.com placeholder");
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function sanitizeEnvForLogs(env = process.env) {
  const keys = [
    "NODE_ENV",
    "NEXT_PUBLIC_AUTH_MODE",
    "NEXT_PUBLIC_STORAGE_MODE",
    "AMANAH_SERVER_STORAGE",
    "AMANAH_AI_PROVIDER",
    "AMANAH_AI_ENABLED",
    "AMANAH_KNOWLEDGE_RETRIEVAL",
    "AMANAH_BILLING_MODE",
  ];
  const out = {};
  for (const key of keys) {
    if (env[key] !== undefined) out[key] = String(env[key]);
  }
  if (env.DATABASE_URL) out.DATABASE_URL = "[set]";
  if (env.SESSION_SECRET) out.SESSION_SECRET = "[set]";
  if (env.AMANAH_DATA_KEYS) out.AMANAH_DATA_KEYS = "[set]";
  if (env.OPENAI_API_KEY) out.OPENAI_API_KEY = "[set]";
  if (env.AMANAH_STRIPE_SECRET_KEY) out.AMANAH_STRIPE_SECRET_KEY = "[set]";
  if (env.AMANAH_STRIPE_WEBHOOK_SECRET) out.AMANAH_STRIPE_WEBHOOK_SECRET = "[set]";
  return out;
}

if (process.argv[1]?.endsWith("validate-production-env.mjs")) {
  const result = validateProductionEnv(process.env);
  for (const w of result.warnings) console.log("⚠", w);
  for (const e of result.errors) console.error("✗", e);
  console.log("Env summary:", JSON.stringify(sanitizeEnvForLogs(process.env)));
  process.exit(result.valid ? 0 : 1);
}
