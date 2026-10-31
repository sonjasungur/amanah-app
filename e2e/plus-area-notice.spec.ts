import { expect, test } from "@playwright/test";

/**
 * Vorsorge Plus hints (enforcement off): every Plus area shows an informational notice with the
 * 39 € test price and no buy button; free areas show none; the area itself stays usable.
 */
const PLUS_AREAS = ["/dashboard/dokumente", "/dashboard/personen", "/dashboard/janazah", "/dashboard/schulden-amanah", "/dashboard/pdf"];
const FREE_AREAS = ["/dashboard", "/dashboard/notfallkarte"];

for (const path of PLUS_AREAS) {
  test(`Plus notice on ${path}`, async ({ page }) => {
    await page.goto(path);
    const notice = page.getByTestId("plus-area-notice");
    await expect(notice).toBeVisible();
    await expect(notice).toContainText("39 € einmalig");
    await expect(notice).toContainText("vor der Einführung von Vorsorge Plus");
    await expect(notice.getByRole("button")).toHaveCount(0);
    await expect(page.locator("[data-testid^='plus-gate-']")).toHaveCount(0);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
  });
}

for (const path of FREE_AREAS) {
  test(`no Plus notice on free area ${path}`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator("main")).toBeVisible();
    await expect(page.getByTestId("plus-area-notice")).toHaveCount(0);
  });
}
