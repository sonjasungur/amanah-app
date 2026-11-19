import { test, expect } from "@playwright/test";

const PAGES = ["/", "/wissen", "/check", "/dashboard", "/dashboard/janazah", "/dashboard/pdf", "/dashboard/einstellungen", "/dashboard/personen", "/login", "/preise"];

test("security headers include a CSP and no page triggers a CSP violation", async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { __csp: string[] }).__csp = [];
    document.addEventListener("securitypolicyviolation", (e) => {
      (window as unknown as { __csp: string[] }).__csp.push(`${e.violatedDirective} ${e.blockedURI}`);
    });
  });
  for (const path of PAGES) {
    const res = await page.goto(path);
    expect(res?.headers()["content-security-policy"], path).toContain("frame-ancestors 'none'");
    await page.waitForLoadState("networkidle");
    const violations = await page.evaluate(() => (window as unknown as { __csp: string[] }).__csp);
    expect(violations, path).toEqual([]);
  }
});
