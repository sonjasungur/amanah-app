export type ProductionEnvValidation = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

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

const UNSAFE_AI_PROVIDERS = new Set(["openai-without-key"]);

export function isPlaceholderValue(value: string | undefined): boolean {
  if (!value || !value.trim()) return true;
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(value.trim()));
}

export function validateProductionEnv(
  env: NodeJS.ProcessEnv = process.env
): ProductionEnvValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

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

  if (env.POSTGRES_PASSWORD && isPlaceholderValue(env.POSTGRES_PASSWORD)) {
    errors.push("POSTGRES_PASSWORD still contains a placeholder value");
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

  if (UNSAFE_AI_PROVIDERS.has(aiProvider)) {
    errors.push(`Unsafe AI provider configuration: ${aiProvider}`);
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

export function getPublicEnvironmentLabel(): string {
  return process.env.NODE_ENV === "production" ? "production" : "development";
}

export function sanitizeEnvForLogs(env: NodeJS.ProcessEnv = process.env): Record<string, string> {
  const keys = [
    "NODE_ENV",
    "NEXT_PUBLIC_AUTH_MODE",
    "NEXT_PUBLIC_STORAGE_MODE",
    "AMANAH_SERVER_STORAGE",
    "AMANAH_AI_PROVIDER",
    "AMANAH_AI_ENABLED",
    "AMANAH_KNOWLEDGE_RETRIEVAL",
  ];
  const out: Record<string, string> = {};
  for (const key of keys) {
    if (env[key] !== undefined) out[key] = String(env[key]);
  }
  if (env.DATABASE_URL) out.DATABASE_URL = "[set]";
  if (env.SESSION_SECRET) out.SESSION_SECRET = "[set]";
  if (env.OPENAI_API_KEY) out.OPENAI_API_KEY = "[set]";
  return out;
}
