/**
 * Staging one-tap login as the acceptance account (owner 24.11.2026): only on staging, only for a
 * reserved .invalid address, refused by production validation, not passed on by production compose.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { stagingDirectLoginEmail } from "@/lib/server/staging-direct-login";
import { validateProductionEnv } from "@/lib/server/production-config";

const env = (e: Record<string, string>) => e as unknown as NodeJS.ProcessEnv;
const ACCOUNT = "abnahme-owner@staging.invalid";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("staging direct login", () => {
  it("is active only on staging with a .invalid address", () => {
    expect(stagingDirectLoginEmail(env({ AMANAH_DEPLOYMENT_ENV: "staging", AMANAH_STAGING_DIRECT_LOGIN: ` ${ACCOUNT.toUpperCase()} ` }))).toBe(ACCOUNT);
    expect(stagingDirectLoginEmail(env({ NODE_ENV: "production", AMANAH_STAGING_DIRECT_LOGIN: ACCOUNT }))).toBeNull();
    expect(stagingDirectLoginEmail(env({ NODE_ENV: "development", AMANAH_STAGING_DIRECT_LOGIN: ACCOUNT }))).toBeNull();
    for (const bad of ["contact@mscisystems.com", "a@staging.invalid,b@staging.invalid", "x@invalid.de", ""]) {
      expect(stagingDirectLoginEmail(env({ AMANAH_DEPLOYMENT_ENV: "staging", AMANAH_STAGING_DIRECT_LOGIN: bad }))).toBeNull();
    }
  });

  it("is refused in production and checked on staging", async () => {
    expect(validateProductionEnv(env({ AMANAH_STAGING_DIRECT_LOGIN: ACCOUNT })).errors.join(" ")).toContain("AMANAH_STAGING_DIRECT_LOGIN must not be set in production");
    const { validateProductionEnv: validateScript } = (await import("../../scripts/validate-production-env.mjs")) as unknown as { validateProductionEnv: (e: Record<string, string>) => { errors: string[] } };
    expect(validateScript({ AMANAH_STAGING_DIRECT_LOGIN: ACCOUNT }).errors.join(" ")).toContain("AMANAH_STAGING_DIRECT_LOGIN must not be set in production");
    const { validateStagingEnv } = (await import("../../scripts/validate-staging-env.mjs")) as unknown as { validateStagingEnv: (e: Record<string, string>) => { errors: string[] } };
    expect(validateStagingEnv({ AMANAH_STAGING_DIRECT_LOGIN: ACCOUNT }).errors.join(" ")).not.toContain("AMANAH_STAGING_DIRECT_LOGIN");
    expect(validateStagingEnv({ AMANAH_STAGING_DIRECT_LOGIN: "contact@mscisystems.com" }).errors.join(" ")).toContain("AMANAH_STAGING_DIRECT_LOGIN must be a single address");
  });

  it("is passed on only by the staging compose file", () => {
    expect(readFileSync("docker-compose.staging.yml", "utf8")).toContain("AMANAH_STAGING_DIRECT_LOGIN: ${AMANAH_STAGING_DIRECT_LOGIN:-}");
    for (const f of ["docker-compose.prod.yml", "deploy/production/docker-compose.release.yml"]) {
      expect(readFileSync(f, "utf8")).not.toContain("AMANAH_STAGING_DIRECT_LOGIN");
    }
  });

  it("route answers 404 outside staging, even when the variable is set", async () => {
    vi.stubEnv("AMANAH_DEPLOYMENT_ENV", "");
    vi.stubEnv("NEXT_PUBLIC_AMANAH_ENVIRONMENT", "");
    vi.stubEnv("AMANAH_STAGING_DIRECT_LOGIN", ACCOUNT);
    const { GET, POST } = await import("@/app/api/dev/staging-login/route");
    expect((await GET()).status).toBe(404);
    const post = new Request("http://127.0.0.1:3000/api/dev/staging-login", { method: "POST", headers: { origin: "http://127.0.0.1:3000" } });
    expect((await POST(post)).status).toBe(404);
  });

  it("route on staging refuses cross-origin and reports the account", async () => {
    vi.stubEnv("AMANAH_DEPLOYMENT_ENV", "staging");
    vi.stubEnv("AMANAH_STAGING_DIRECT_LOGIN", ACCOUNT);
    const { GET, POST } = await import("@/app/api/dev/staging-login/route");
    const get = await GET();
    expect(get.status).toBe(200);
    expect(await get.json()).toEqual({ available: true, email: ACCOUNT });
    const cross = new Request("http://127.0.0.1:3000/api/dev/staging-login", { method: "POST", headers: { origin: "https://evil.example" } });
    expect((await POST(cross)).status).toBe(403);
  });
});
