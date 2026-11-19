import { test, expect } from "@playwright/test";

const AREAS = [
  { name: "Islamisches Wissen", href: "/wissen" },
  { name: "Meine Vorsorge", href: "/dashboard" },
  { name: "Mein Testament", href: "/dashboard/testament" },
  { name: "Janazah", href: "/dashboard/janazah" },
  { name: "Mein Konto", href: "/dashboard/einstellungen" },
];

test.describe("Main navigation", () => {
  test("shows the five main areas and marks the current one", async ({ page }, testInfo) => {
    await page.goto("/dashboard/janazah");
    const toggle = page.getByTestId("site-mobile-nav-toggle");
    if (await toggle.isVisible()) await toggle.click();
    for (const area of AREAS) {
      await expect(page.getByRole("link", { name: area.name, exact: true }).first()).toHaveAttribute("href", area.href);
    }
    const current = page.locator('header a[aria-current="page"]');
    if ((await current.count()) > 0) await expect(current.first()).toHaveText("Janazah");
    await page.locator("header").first().screenshot({ path: testInfo.outputPath(`header-${testInfo.project.name}.png`) });
  });

  for (const width of [1024, 1280, 1440]) {
    test(`header does not overflow at ${width}px`, async ({ page, isMobile }) => {
      test.skip(isMobile, "desktop widths only");
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/");
      expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)).toBe(false);
      const header = await page.locator("header").first().boundingBox();
      expect(header!.height).toBeLessThan(90);
      await page.locator("header").first().screenshot({ path: test.info().outputPath(`header-${width}.png`) });
    });
  }
});
