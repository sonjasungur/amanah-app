import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${process.env.PLAYWRIGHT_PORT ?? "3099"}`;
/** The protected HTTPS access to staging (scripts/staging-https.sh). */
const protectedAccess = process.env.E2E_BASIC_PASSWORD
  ? { ignoreHTTPSErrors: true, httpCredentials: { username: "tester", password: process.env.E2E_BASIC_PASSWORD } }
  : {};

/** Browser profiles of phones. Emulation only: real devices stay a separate check (docs/strategy/43). */
export default defineConfig({
  testDir: ".",
  testMatch: ["e2e-mobile/*.spec.ts", "e2e/release-core-flows.spec.ts"],
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  outputDir: process.env.PLAYWRIGHT_OUTPUT_DIR ?? "test-results-mobile",
  reporter: [["list"]],
  use: { baseURL, screenshot: "only-on-failure", ...protectedAccess },
  projects: [
    { name: "iphone-webkit", use: { ...devices["iPhone 13"] } },
    { name: "android-chromium", use: { ...devices["Pixel 7"] } },
  ],
});
