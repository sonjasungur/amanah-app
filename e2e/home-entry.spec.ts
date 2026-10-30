import { test, expect } from "@playwright/test";

const ENTRIES = [
  { id: "wissen", href: "/wissen", text: "Dauerhaft kostenlos, ohne Registrierung" },
  { id: "vorsorge", href: "/check", text: "Meine Vorsorge" },
  { id: "testament", href: "/dashboard/testament", text: "erstellt kein Testament" },
  { id: "janazah", href: "/dashboard/janazah", text: "Janazah" },
];

test.describe("Homepage entry points", () => {
  test("shows the four entry points with their targets and no overflow", async ({ page }, testInfo) => {
    await page.goto("/");
    const section = page.getByTestId("home-entry-points");
    await expect(section).toBeVisible();
    for (const entry of ENTRIES) {
      const link = page.getByTestId(`home-entry-${entry.id}`);
      await expect(link).toHaveAttribute("href", entry.href);
      await expect(link).toContainText(entry.text);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)).toBe(false);
    await section.screenshot({ path: testInfo.outputPath(`home-entry-${testInfo.project.name}.png`) });
  });

  test("knowledge entry opens the free knowledge centre without an account", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("home-entry-wissen").click();
    await expect(page).toHaveURL(/\/wissen$/);
    await expect(page.getByRole("heading", { level: 1, name: "Islamisches Wissen" })).toBeVisible();
  });
});
