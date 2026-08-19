import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

const OUTPUT_DIR = "/tmp/amanah-professional-core-phase2-final-acceptance";

const VIEWPORTS = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
];

function screenshotPath(name: string) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  return path.join(OUTPUT_DIR, `${name}.png`);
}

for (const vp of VIEWPORTS) {
  test.describe(`Screenshots @ ${vp.name} (${vp.width}x${vp.height})`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test(`janazah-step1-${vp.name}`, async ({ page }) => {
      await page.goto("/dashboard/janazah?schritt=0");
      await page.waitForSelector('[data-testid="janazah-guided-flow"]');
      await page.screenshot({ path: screenshotPath(`janazah-step1-${vp.name}`), fullPage: true });
    });

    test(`janazah-step1-english-${vp.name}`, async ({ page }) => {
      await page.goto("/dashboard/janazah?schritt=0");
      await page.waitForSelector('[data-testid="janazah-guided-flow"]');
      // Try locale switcher; fall back to document lang attribute
      const switcher = page.locator('[data-testid="locale-switcher"], select[name="locale"]').first();
      if (await switcher.count() > 0) {
        await switcher.selectOption("en");
        await page.waitForTimeout(300);
      } else {
        await page.evaluate(() => { document.documentElement.lang = "en"; });
      }
      await page.screenshot({ path: screenshotPath(`janazah-step1-english-${vp.name}`), fullPage: true });
    });

    test(`janazah-saving-${vp.name}`, async ({ page }) => {
      await page.goto("/dashboard/janazah?schritt=0");
      await page.waitForSelector('[data-testid="janazah-guided-flow"]');
      // Fill field to trigger saving state
      await page.getByTestId("janazah-fullName").locator("input").fill("Saving State Test");
      // Capture quickly before debounce settles
      await page.screenshot({ path: screenshotPath(`janazah-saving-${vp.name}`), fullPage: true });
    });

    test(`janazah-save-error-${vp.name}`, async ({ page }) => {
      await page.goto("/dashboard/janazah?schritt=0");
      await page.waitForSelector('[data-testid="janazah-guided-flow"]');
      // Mock localStorage to simulate save error
      await page.evaluate(() => {
        const orig = localStorage.setItem.bind(localStorage);
        localStorage.setItem = (key: string, value: string) => {
          if (key === "amanah-ordner") throw new Error("Storage quota exceeded");
          orig(key, value);
        };
      });
      await page.getByTestId("janazah-fullName").locator("input").fill("Error State Test");
      await page.waitForTimeout(700);
      await page.screenshot({ path: screenshotPath(`janazah-save-error-${vp.name}`), fullPage: true });
    });

    test(`janazah-preview-${vp.name}`, async ({ page }) => {
      await page.goto("/dashboard/janazah/vorschau");
      await page.waitForSelector('[data-testid="janazah-preview"]');
      await page.screenshot({ path: screenshotPath(`janazah-preview-${vp.name}`), fullPage: true });
    });

    test(`pdf-page-${vp.name}`, async ({ page }) => {
      await page.goto("/dashboard/pdf");
      await page.waitForLoadState("networkidle");
      await page.screenshot({ path: screenshotPath(`pdf-page-${vp.name}`), fullPage: true });
    });

    test(`settings-local-${vp.name}`, async ({ page }) => {
      await page.goto("/dashboard/einstellungen");
      await page.waitForSelector('[data-testid="settings-storage-location"]');
      await page.screenshot({ path: screenshotPath(`settings-local-${vp.name}`), fullPage: true });
    });

    test(`settings-delete-confirm-${vp.name}`, async ({ page }) => {
      await page.goto("/dashboard/einstellungen");
      await page.waitForSelector('[data-testid="settings-delete-data-button"]');
      await page.getByTestId("settings-delete-data-button").click();
      await expect(page.getByTestId("settings-delete-data-confirm")).toBeVisible();
      await page.screenshot({ path: screenshotPath(`settings-delete-confirm-${vp.name}`), fullPage: true });
    });

    test(`settings-ai-disabled-${vp.name}`, async ({ page }) => {
      await page.goto("/dashboard/einstellungen");
      await page.waitForSelector('[data-testid="settings-ai-section"]');
      await page.screenshot({ path: screenshotPath(`settings-ai-disabled-${vp.name}`), fullPage: true });
    });

    test(`ai-consent-interface-${vp.name}`, async ({ page }) => {
      await page.goto("/dashboard/einstellungen");
      await page.waitForSelector('[data-testid="settings-ai-consent-status"]');
      await page.screenshot({ path: screenshotPath(`ai-consent-interface-${vp.name}`), fullPage: true });
    });

    test(`janazah-vorschau-english-${vp.name}`, async ({ page }) => {
      await page.goto("/dashboard/janazah/vorschau");
      await page.waitForSelector('[data-testid="janazah-preview"]');
      await page.evaluate(() => { document.documentElement.lang = "en"; });
      await page.screenshot({ path: screenshotPath(`janazah-vorschau-english-${vp.name}`), fullPage: true });
    });

    test(`pdf-save-or-print-${vp.name}`, async ({ page }) => {
      await page.goto("/dashboard/pdf");
      await page.waitForLoadState("networkidle");
      await page.screenshot({ path: screenshotPath(`pdf-save-or-print-${vp.name}`), fullPage: true });
    });
  });
}
