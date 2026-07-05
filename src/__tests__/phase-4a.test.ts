import { describe, it, expect, beforeEach } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  validateProductionEnv,
  isPlaceholderValue,
  sanitizeEnvForLogs,
  getPublicEnvironmentLabel,
} from "@/lib/server/production-config";
import { GET as healthGET } from "@/app/api/health/route";

const root = join(process.cwd());

describe("Production config validation", () => {
  const validEnv: NodeJS.ProcessEnv = {
    NODE_ENV: "production",
    DATABASE_URL: "postgresql://amanah:supersecretlongpass@postgres:5432/amanah",
    SESSION_SECRET: "a".repeat(32),
    POSTGRES_PASSWORD: "supersecretlongpass",
    NEXT_PUBLIC_AUTH_MODE: "api",
    NEXT_PUBLIC_STORAGE_MODE: "api",
    AMANAH_SERVER_STORAGE: "postgres",
    AMANAH_AI_PROVIDER: "rules",
    NEXT_PUBLIC_SITE_URL: "https://amanah.de",
  };

  it("accepts valid production env", () => {
    const r = validateProductionEnv(validEnv);
    expect(r.valid).toBe(true);
    expect(r.errors).toHaveLength(0);
  });

  it("rejects placeholder DATABASE_URL", () => {
    const r = validateProductionEnv({
      ...validEnv,
      DATABASE_URL: "postgresql://amanah:REPLACE_WITH_STRONG_DB_PASSWORD@postgres:5432/amanah",
    });
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes("DATABASE_URL"))).toBe(true);
  });

  it("rejects short SESSION_SECRET", () => {
    const r = validateProductionEnv({ ...validEnv, SESSION_SECRET: "short" });
    expect(r.valid).toBe(false);
  });

  it("rejects openai without key", () => {
    const r = validateProductionEnv({
      ...validEnv,
      AMANAH_AI_PROVIDER: "openai",
      OPENAI_API_KEY: "",
    });
    expect(r.valid).toBe(false);
  });

  it("detects placeholder values", () => {
    expect(isPlaceholderValue("change-me-local-only")).toBe(true);
    expect(isPlaceholderValue("https://amanah.de")).toBe(false);
  });

  it("sanitizeEnvForLogs hides secrets", () => {
    const out = sanitizeEnvForLogs({
      ...validEnv,
      OPENAI_API_KEY: "sk-test-should-not-appear",
    });
    expect(out.OPENAI_API_KEY).toBe("[set]");
    expect(JSON.stringify(out)).not.toContain("sk-test");
    expect(out.DATABASE_URL).toBe("[set]");
  });
});

describe("Health endpoint production safety", () => {
  beforeEach(() => {
    delete process.env.AMANAH_SERVER_STORAGE;
    delete process.env.DATABASE_URL;
  });

  it("includes environment without secrets", async () => {
    const res = await healthGET();
    const body = await res.json();
    expect(body.environment).toBeDefined();
    expect(JSON.stringify(body)).not.toMatch(/sk-[a-zA-Z0-9]{10,}/);
    expect(JSON.stringify(body)).not.toMatch(/postgresql:\/\//i);
  });
});

describe("Production deployment artifacts", () => {
  const required = [
    "Dockerfile",
    "docker-compose.prod.yml",
    ".env.production.example",
    "deploy/Caddyfile.example",
    "deploy/Caddyfile",
    "scripts/deploy-preflight.sh",
    "scripts/backup-postgres.sh",
    "scripts/prod-smoke-test.sh",
    "scripts/validate-production-env.mjs",
    "docs/DEPLOY_HETZNER.md",
    "docs/LAUNCH_CHECKLIST.md",
    "docs/ENVIRONMENT.md",
  ];

  it.each(required)("exists: %s", (file) => {
    expect(existsSync(join(root, file))).toBe(true);
  });
});

describe("getPublicEnvironmentLabel", () => {
  it("returns development by default in tests", () => {
    expect(getPublicEnvironmentLabel()).toBe("development");
  });
});
