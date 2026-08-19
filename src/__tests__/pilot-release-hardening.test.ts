import { readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { getAiConsent, revokeAiConsent, setAiConsent } from "@/lib/ai/consent-client";

const ROOT = join(process.cwd());

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

describe("family message consent hardening", () => {
  it("family page no longer hardcodes consentGranted: true", () => {
    const file = read("src/app/dashboard/familie/page.tsx");
    expect(file).not.toContain("consentGranted: true");
    expect(file).toContain("getAiConsent()");
  });

  it("checks consent before triggering fetch", () => {
    const file = read("src/app/dashboard/familie/page.tsx");
    expect(file).toContain("if (!consentGranted)");
    expect(file).toContain("setConsentMissing(true)");
    expect(file).toContain("body: JSON.stringify({");
  });

  it("stores and revokes consent in localStorage", () => {
    localStorage.removeItem("amanah-ai-consent");
    expect(getAiConsent()).toBeNull();
    setAiConsent("granted");
    expect(getAiConsent()).toBe("granted");
    revokeAiConsent();
    expect(getAiConsent()).toBeNull();
  });
});

describe("controlled public error pages", () => {
  it("has app not-found page with actions", () => {
    const file = read("src/app/not-found.tsx");
    expect(file).toContain('href="/"');
    expect(file).toContain('href="/dashboard"');
    expect(file).toContain("error.notFound.title");
  });

  it("has app error boundary with retry and safe links", () => {
    const file = read("src/app/error.tsx");
    expect(file).toContain("unstable_retry");
    expect(file).toContain("error.runtime.retry");
    expect(file).toContain('href="/"');
    expect(file).toContain('href="/dashboard"');
  });
});

describe("public content hardening", () => {
  it("production knowledge only includes reviewed entries", () => {
    const entries = read("src/lib/knowledge/entries.ts");
    expect(entries).toContain('return getAllEntries().filter((e) => e.reviewedStatus === "reviewed");');
  });

  it("public wissen page uses reviewed-only topic source", () => {
    const wissen = read("src/app/wissen/page.tsx");
    expect(wissen).toContain("getPublicWissenTopics");
    expect(wissen).toContain("Wissensbereich in Vorbereitung");
  });

  it("public bestatter data remains empty", () => {
    const bestatterData = read("src/lib/mock/funeral-partners.ts");
    expect(bestatterData).toContain("funeralPartners: FuneralPartner[] = []");
    const bestatterPage = read("src/app/bestatter/page.tsx");
    expect(bestatterPage).toContain("In Vorbereitung");
    expect(bestatterPage).toContain("keine Einträge");
  });
});

describe("deployment source safety checks", () => {
  it("has explicit GitHub remote URL validation script", () => {
    const script = read("scripts/verify-deploy-remote.sh");
    expect(script).toContain("github.com/sonjasungur/amanah-app");
    expect(script).toContain("Refusing deployment");
  });

  it("runs remote validation from deploy preflight", () => {
    const preflight = read("scripts/deploy-preflight.sh");
    expect(preflight).toContain("./scripts/verify-deploy-remote.sh");
  });
});

describe("release validator modes", () => {
  const baseEnv = {
    ...process.env,
    NEXT_PUBLIC_AUTH_MODE: "api",
    NEXT_PUBLIC_STORAGE_MODE: "api",
    AMANAH_SERVER_STORAGE: "postgres",
    AMANAH_PUBLIC_REGISTRATION_ENABLED: "false",
    NEXT_PUBLIC_AMANAH_PUBLIC_REGISTRATION_ENABLED: "false",
    AMANAH_AI_ENABLED: "false",
    NEXT_PUBLIC_AMANAH_AI_ENABLED: "false",
    NEXT_PUBLIC_SITE_URL: "https://example.test",
    NEXT_PUBLIC_APP_URL: "https://example.test",
    DATABASE_URL: "postgresql://amanah:supersecretlongpass@postgres:5432/amanah?schema=public",
    SESSION_SECRET: "x".repeat(40),
    POSTGRES_PASSWORD: "supersecretlongpass",
  };

  it("private-review mode passes with safe technical env values", () => {
    const res = spawnSync("node", ["scripts/validate-release.mjs", "--mode=private-review"], {
      cwd: ROOT,
      env: baseEnv,
      encoding: "utf8",
    });
    expect(res.status).toBe(0);
  });

  it("public-pilot mode fails while legal placeholders remain", () => {
    const res = spawnSync("node", ["scripts/validate-release.mjs", "--mode=public-pilot"], {
      cwd: ROOT,
      env: baseEnv,
      encoding: "utf8",
    });
    expect(res.status).not.toBe(0);
    expect(`${res.stdout}\n${res.stderr}`).toContain("Impressum placeholders");
  });
});
