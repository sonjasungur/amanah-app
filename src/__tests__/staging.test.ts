import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getDeploymentEnv, isRegistrationDomainAllowed } from "@/lib/deployment-env";
import { POST as registerPOST } from "@/app/api/auth/register/route";
import { resetRateLimits } from "@/lib/ai/rate-limit";
import { clearOutbox, readOutbox } from "@/lib/server/mailer";
import { resetServerRepository } from "@/lib/server/repository";
import { browserRequest } from "./session-helpers";
import { validateStagingEnv } from "../../scripts/validate-staging-env.mjs";

const env = (vars: Record<string, string>) => vars as unknown as NodeJS.ProcessEnv;
const KEY = Buffer.alloc(32, 7).toString("base64");

/** A complete, valid staging configuration with throwaway values. */
const STAGING = {
  NODE_ENV: "production",
  AMANAH_DEPLOYMENT_ENV: "staging",
  NEXT_PUBLIC_AMANAH_ENVIRONMENT: "staging",
  DATABASE_URL: "postgresql://amanah_staging:pw-7f3a9c@postgres:5432/amanah_staging",
  SESSION_SECRET: "s".repeat(64),
  AMANAH_DATA_KEYS: `stg1:${KEY}`,
  AMANAH_DATA_KEY_ACTIVE: "stg1",
  AMANAH_DATA_ENCRYPTION: "required",
  AMANAH_PUBLIC_BASE_URL: "https://staging.amanah.test",
  NEXT_PUBLIC_SITE_URL: "https://staging.amanah.test",
  NEXT_PUBLIC_AUTH_MODE: "api",
  NEXT_PUBLIC_STORAGE_MODE: "api",
  AMANAH_SERVER_STORAGE: "postgres",
  AMANAH_REGISTRATION_ALLOWED_DOMAINS: "staging.invalid",
  AMANAH_MAIL_TRANSPORT: "outbox",
  AMANAH_DEV_OUTBOX: "true",
  AMANAH_BILLING_MODE: "sandbox",
  AMANAH_SANDBOX_WEBHOOK_SECRET: "w".repeat(64),
};

describe("deployment environment", () => {
  it("labels staging separately from production", () => {
    expect(getDeploymentEnv(env({ NODE_ENV: "production", AMANAH_DEPLOYMENT_ENV: "staging" }))).toBe("staging");
    expect(getDeploymentEnv(env({ NODE_ENV: "production" }))).toBe("production");
    expect(getDeploymentEnv(env({ NODE_ENV: "test" }))).toBe("development");
  });

  it("restricts registration to allow-listed domains only when configured", () => {
    expect(isRegistrationDomainAllowed("a@gmail.com", env({}))).toBe(true);
    const e = env({ AMANAH_REGISTRATION_ALLOWED_DOMAINS: "staging.invalid, test.invalid" });
    expect(isRegistrationDomainAllowed("Pilot@Staging.Invalid", e)).toBe(true);
    expect(isRegistrationDomainAllowed("a@gmail.com", e)).toBe(false);
    expect(isRegistrationDomainAllowed("a@evil.staging.invalid", e)).toBe(false);
  });
});

describe("registration on staging", () => {
  beforeEach(() => {
    resetRateLimits();
    resetServerRepository();
    clearOutbox();
    globalThis.__amanahMemoryStore = undefined;
    vi.stubEnv("AMANAH_PUBLIC_REGISTRATION_ENABLED", "true");
    vi.stubEnv("AMANAH_MAIL_TRANSPORT", "outbox");
    vi.stubEnv("AMANAH_REGISTRATION_ALLOWED_DOMAINS", "staging.invalid");
  });
  afterEach(() => vi.unstubAllEnvs());

  const register = (email: string) =>
    registerPOST(
      browserRequest("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: "testpass1", name: "T" }),
      })
    );

  it("rejects real domains before anything is stored or mailed", async () => {
    expect((await register("someone@gmail.com")).status).toBe(400);
    expect(readOutbox()).toHaveLength(0);
    expect((await register("pilot-1@staging.invalid")).status).toBe(202);
    expect(readOutbox("pilot-1@staging.invalid")).toHaveLength(1);
  });
});

describe("staging env validation", () => {
  it("accepts a complete staging setup with dev outbox and sandbox, internal tools off", () => {
    const result = validateStagingEnv(env(STAGING));
    expect(result.errors).toEqual([]);
  });

  it.each([
    ["real mail provider", { AMANAH_MAIL_TRANSPORT: "brevo", AMANAH_MAIL_API_KEY: "k", AMANAH_MAIL_FROM: "a@b.de" }, "must not send real mail"],
    ["real registration domain", { AMANAH_REGISTRATION_ALLOWED_DOMAINS: "staging.invalid,gmail.com" }, "reserved domains"],
    ["no allow-list", { AMANAH_REGISTRATION_ALLOWED_DOMAINS: "" }, "AMANAH_REGISTRATION_ALLOWED_DOMAINS is required"],
    ["shared database", { DATABASE_URL: "postgresql://amanah:pw-7f3a9c@postgres:5432/amanah" }, "separate staging database"],
    ["external AI", { AMANAH_AI_ENABLED: "true" }, "External AI"],
    ["billing enforcement", { AMANAH_BILLING_ENFORCE: "true", AMANAH_PLUS_LAUNCH_AT: "2027-01-01" }, "AMANAH_BILLING_ENFORCE"],
    ["missing staging label", { AMANAH_DEPLOYMENT_ENV: "" }, "AMANAH_DEPLOYMENT_ENV"],
    ["no data keys", { AMANAH_DATA_KEYS: "" }, "AMANAH_DATA_KEYS"],
    ["internal editorial tools", { AMANAH_INTERNAL_TOOLS: "true" }, "AMANAH_INTERNAL_TOOLS must stay off on staging"],
  ])("refuses %s", (_label, override, message) => {
    const result = validateStagingEnv(env({ ...STAGING, ...override }));
    expect(result.valid).toBe(false);
    expect(result.errors.join(" ")).toContain(message);
  });
});

describe("staging compose file", () => {
  const compose = readFileSync("docker-compose.staging.yml", "utf8");

  it("is separate from production and binds the app to localhost only", () => {
    expect(compose).toContain("name: amanah-staging");
    expect(compose).toContain("amanah_pg_staging");
    expect(compose).not.toMatch(/amanah_pg_prod|container_name: amanah-app\b|gemeinsam1-prod/);
    expect(compose).toMatch(/"127\.0\.0\.1:\$\{STAGING_APP_PORT:-3201\}:3000"/);
  });

  it("keeps the database off the host network and internal tools off", () => {
    const postgres = compose.slice(compose.indexOf("  postgres:"), compose.indexOf("  app:"));
    expect(postgres).not.toMatch(/ports:/);
    expect(postgres).toContain("- staging_db");
    expect(postgres).not.toContain("staging_edge");
    expect(compose).toMatch(/staging_db:\n\s+name: amanah_staging_db\n\s+driver: bridge\n\s+internal: true/);
    expect(compose).toContain('AMANAH_INTERNAL_TOOLS: "false"');
    expect(compose).toContain('AMANAH_DEV_OUTBOX: "true"');
  });

  it("passes every security-relevant variable to the app", () => {
    for (const key of ["AMANAH_DATA_KEYS", "AMANAH_DATA_KEY_ACTIVE", "AMANAH_DATA_ENCRYPTION: required", "AMANAH_PUBLIC_BASE_URL", "AMANAH_REGISTRATION_ALLOWED_DOMAINS", "AMANAH_MAIL_TRANSPORT: outbox", "AMANAH_DEPLOYMENT_ENV: staging", "NEXT_PUBLIC_AMANAH_ENVIRONMENT: staging", "AMANAH_SANDBOX_WEBHOOK_SECRET"]) {
      expect(compose, key).toContain(key);
    }
  });
});
