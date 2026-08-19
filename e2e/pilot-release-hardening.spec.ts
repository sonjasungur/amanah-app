import { test, expect, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const DIR = "/tmp/amanah-pilot-release-hardening";

const VIEWPORTS = [
  { name: "390x844", width: 390, height: 844 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "1440x900", width: 1440, height: 900 },
];

async function shot(page: Page, name: string) {
  await mkdir(DIR, { recursive: true });
  await page.screenshot({ path: `${DIR}/${name}.png`, fullPage: true });
}

for (const vp of VIEWPORTS) {
  test.describe(`pilot release screenshots ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test("not-found", async ({ page }) => {
      await page.goto("/nicht-vorhanden");
      await expect(page.getByText(/Seite nicht gefunden|Page not found/i)).toBeVisible();
      await shot(page, `not-found-${vp.name}`);
    });

    test("controlled-error-state", async ({ page }) => {
      await page.goto("/dashboard/unbekannt");
      await expect(page.getByText(/Seite nicht gefunden|Page not found/i)).toBeVisible();
      await shot(page, `controlled-error-state-${vp.name}`);
    });

    test("wissen-reviewed-only-empty", async ({ page }) => {
      await page.goto("/wissen");
      await expect(page.getByText(/Wissensbereich in Vorbereitung/i)).toBeVisible();
      await shot(page, `wissen-reviewed-only-${vp.name}`);
    });

    test("bestatter-empty", async ({ page }) => {
      await page.goto("/bestatter");
      await expect(page.getByText(/In Vorbereitung/i)).toBeVisible();
      await shot(page, `bestatter-empty-${vp.name}`);
    });

    test("family-ai-no-consent", async ({ page }) => {
      await page.goto("/dashboard/familie");
      const refineButton = page.getByRole("button", { name: /Mit Assistent verfeinern/i });
      if (await refineButton.count()) {
        await refineButton.click();
        await expect(page.getByTestId("family-ai-consent-required")).toBeVisible();
      }
      await shot(page, `family-ai-no-consent-${vp.name}`);
    });

    test("family-ai-disabled-state", async ({ page }) => {
      await page.goto("/dashboard/familie");
      await shot(page, `family-ai-disabled-${vp.name}`);
    });
  });
}
