import { defineConfig, devices } from "@playwright/test";

/**
 * Locked features with their development flags on, for this machine only: local auth and storage,
 * own build folder, own port, no reuse of a running server. Build first with `npm run build:e2e:flags`.
 */
const PORT = "3097";
const baseURL = `http://127.0.0.1:${PORT}`;
const chromiumExecutable = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;

export default defineConfig({
  testDir: "./e2e-flags",
  fullyParallel: true,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  outputDir: "test-results/flags",
  reporter: [["list"]],
  use: {
    baseURL,
    screenshot: "only-on-failure",
    ...(chromiumExecutable ? { launchOptions: { executablePath: chromiumExecutable } } : {}),
  },
  projects: [
    { name: "chromium-desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "chromium-mobile", use: { ...devices["Pixel 5"] } },
  ],
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      AMANAH_E2E_DIST_DIR: ".next-e2e-flags",
      NEXT_PUBLIC_AMANAH_TESTAMENT_PREPARATION: "true",
      NEXT_PUBLIC_AMANAH_INHERITANCE_HINTS: "true",
      NEXT_PUBLIC_AUTH_MODE: "local",
      NEXT_PUBLIC_STORAGE_MODE: "local",
    },
  },
});
