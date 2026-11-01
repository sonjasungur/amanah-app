import { expect, test } from "@playwright/test";

/**
 * Vorsorge Plus hints (enforcement off): every Plus area shows an informational notice with the
 * 39 € test price and no buy button; free areas show none; the area itself stays usable.
 */
const PLUS_AREAS = ["/dashboard/dokumente", "/dashboard/personen", "/dashboard/janazah", "/dashboard/schulden-amanah", "/dashboard/pdf"];
const FREE_AREAS = ["/dashboard", "/dashboard/notfallkarte", "/dashboard/vermoegen"];

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

test.describe("with billing enforced and no Plus access", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/billing/status", (route) =>
      route.fulfill({ json: { enforced: true, entitlements: [], plusAccess: { allowed: false }, plusAccessByFeature: { pdf_exports: { allowed: false } } } }),
    );
  });

  test("the asset overview and its print stay usable", async ({ page }) => {
    await page.goto("/dashboard/vermoegen");
    const overview = page.getByTestId("asset-overview");
    await expect(async () => {
      await overview.getByLabel("Bezeichnung").fill("Girokonto");
      await expect(page.getByTestId("asset-add")).toBeEnabled({ timeout: 500 });
    }).toPass();
    await page.getByTestId("asset-add").click();
    await expect(page.getByTestId("asset-print")).toBeEnabled();
    await expect(page.locator("[data-testid^='plus-gate-']")).toHaveCount(0);
    await expect(page.getByTestId("plus-area-notice")).toHaveCount(0);
  });

  test("only the complete export is gated, the single exports are not", async ({ page }) => {
    await page.goto("/dashboard/pdf");
    await expect(page.getByTestId("export-full").getByTestId("plus-gate-pdf_exports")).toBeVisible();
    for (const id of ["notfallkarte", "janazah", "testament", "schulden", "familienbrief"]) {
      await expect(page.getByTestId(`export-${id}`).getByRole("button")).toBeEnabled();
    }
    await expect(page.getByTestId("export-vermoegen-link")).toHaveAttribute("href", "/dashboard/vermoegen");
    await expect(page.locator("[data-testid^='plus-gate-']")).toHaveCount(1);
  });
});
