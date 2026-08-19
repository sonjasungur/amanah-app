import { test, expect } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

const SCREENSHOT_DIR = "/tmp/amanah-professional-core-phase2-acceptance";

const VIEWPORTS = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
];

function screenshotPath(name: string): string {
  return path.join(SCREENSHOT_DIR, `${name}.png`);
}

test.beforeAll(() => {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
});

// ---------------------------------------------------------------------------
// Janazah flow: all 5 steps
// ---------------------------------------------------------------------------
test.describe("janazah guided flow screenshots", () => {
  for (let step = 0; step < 5; step++) {
    test(`janazah step ${step + 1} (index ${step})`, async ({ page }) => {
      for (const vp of VIEWPORTS) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(`/dashboard/janazah?schritt=${step}`);
        await page.waitForLoadState("networkidle");
        await expect(page.getByTestId("janazah-guided-flow")).toBeVisible({ timeout: 10_000 });
        await expect(page.getByTestId("janazah-step-progress")).toBeVisible({ timeout: 5_000 });
        await page.screenshot({
          path: screenshotPath(`janazah-step${step + 1}-${vp.name}-${vp.width}x${vp.height}`),
          fullPage: false,
        });
      }
    });
  }
});

// ---------------------------------------------------------------------------
// Janazah vorschau
// ---------------------------------------------------------------------------
test("janazah-vorschau screenshots", async ({ page }) => {
  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto("/dashboard/janazah/vorschau");
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("janazah-preview")).toBeVisible({ timeout: 10_000 });
    // Verify updated button label
    const downloadBtn = page.getByTestId("janazah-preview-download");
    await expect(downloadBtn).toBeVisible();
    await expect(downloadBtn).toContainText("PDF-Vorschau öffnen");
    await page.screenshot({
      path: screenshotPath(`janazah-vorschau-${vp.name}-${vp.width}x${vp.height}`),
      fullPage: false,
    });
  }
});

// ---------------------------------------------------------------------------
// PDF export page
// ---------------------------------------------------------------------------
test("pdf-export screenshots", async ({ page }) => {
  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto("/dashboard/pdf");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: screenshotPath(`pdf-export-${vp.name}-${vp.width}x${vp.height}`),
      fullPage: false,
    });
  }
});

// ---------------------------------------------------------------------------
// Settings page (local mode)
// ---------------------------------------------------------------------------
test("settings-local screenshots", async ({ page }) => {
  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto("/dashboard/einstellungen");
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("settings-storage-location")).toBeVisible({ timeout: 10_000 });
    await page.screenshot({
      path: screenshotPath(`settings-local-${vp.name}-${vp.width}x${vp.height}`),
      fullPage: false,
    });
  }
});

// ---------------------------------------------------------------------------
// Settings delete confirmation
// ---------------------------------------------------------------------------
test("settings-delete-confirm screenshots", async ({ page }) => {
  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto("/dashboard/einstellungen");
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("settings-delete-data-button")).toBeVisible({ timeout: 10_000 });
    await page.getByTestId("settings-delete-data-button").click();
    await expect(page.getByTestId("settings-delete-data-confirm")).toBeVisible({ timeout: 5_000 });
    await page.screenshot({
      path: screenshotPath(`settings-delete-confirm-${vp.name}-${vp.width}x${vp.height}`),
      fullPage: false,
    });
  }
});

// ---------------------------------------------------------------------------
// Settings: AI section (disabled by default)
// ---------------------------------------------------------------------------
test("ai-disabled screenshots", async ({ page }) => {
  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto("/dashboard/einstellungen");
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("settings-ai-section")).toBeVisible({ timeout: 10_000 });
    await page.screenshot({
      path: screenshotPath(`ai-disabled-${vp.name}-${vp.width}x${vp.height}`),
      fullPage: false,
    });
  }
});

// ---------------------------------------------------------------------------
// Dashboard showing settings nav link
// ---------------------------------------------------------------------------
test("settings-nav-visible screenshots", async ({ page }) => {
  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    // On desktop, the nav link is visible in sidebar
    if (vp.width >= 1024) {
      await expect(page.getByTestId("nav-settings-link")).toBeVisible({ timeout: 10_000 });
    }
    await page.screenshot({
      path: screenshotPath(`settings-nav-visible-${vp.name}-${vp.width}x${vp.height}`),
      fullPage: false,
    });
  }
});
