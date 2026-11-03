/**
 * Mobile browser profiles: narrow views, menu, forms, dialogs, downloads. Emulation is no substitute
 * for real devices (docs/strategy/43). API-mode build with MOBILE_E2E=true.
 */
import { expect, test, type Page } from "@playwright/test";

test.skip(process.env.MOBILE_E2E !== "true", "Requires an API-mode build with the mail outbox");
test.setTimeout(120_000);

const PUBLIC_PAGES = ["/", "/wissen", "/check", "/preise", "/login", "/register", "/passwort-vergessen", "/akuter-todesfall", "/konvertierte", "/patientenverfuegung", "/datenschutz", "/impressum"];
const ACCOUNT_PAGES = ["/dashboard", "/dashboard/notfallkarte", "/dashboard/vermoegen", "/dashboard/dokumente", "/dashboard/familie", "/dashboard/janazah", "/dashboard/einstellungen", "/dashboard/pdf"];

async function noSidewaysScroll(page: Page, path: string) {
  await page.goto(path);
  await page.waitForTimeout(300);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, `${path}: ${overflow}px zu breit`).toBeLessThanOrEqual(1);
}

test("public pages fit, also at 320 pixels, and the menu works", async ({ page }) => {
  for (const path of PUBLIC_PAGES) await noSidewaysScroll(page, path);
  await page.setViewportSize({ width: 320, height: 640 });
  for (const path of PUBLIC_PAGES) await noSidewaysScroll(page, path);

  await page.goto("/");
  const toggle = page.getByTestId("site-mobile-nav-toggle");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
});

test("the logged-in area: forms stay reachable, dialog and download work", async ({ page }) => {
  const email = `mobile-${Date.now()}-${Math.floor(Math.random() * 1e6)}@test.invalid`;
  await page.goto("/register");
  await page.getByPlaceholder("name@beispiel.de").fill(email);
  await page.getByPlaceholder("••••••••").fill("e2e-passwort-1");
  await page.getByRole("button", { name: "Registrieren" }).click();
  await expect(page.getByTestId("auth-check-email")).toBeVisible();
  let link = "";
  await expect
    .poll(async () => {
      const { messages } = (await (await page.context().request.get(`/api/dev/outbox?to=${encodeURIComponent(email)}`)).json()) as { messages: { kind: string; text: string }[] };
      link = messages.filter((m) => m.kind === "verify_email").at(-1)?.text.match(/https?:\/\/\S+token=\S+/)?.[0] ?? "";
      return link;
    })
    .not.toBe("");
  await page.goto(link);
  await expect(page).toHaveURL(/\/dashboard/);
  await page.getByTestId("consent-checkbox").check();
  await page.getByTestId("consent-submit").click();
  await expect(page.getByTestId("consent-gate")).toHaveCount(0);

  for (const path of ACCOUNT_PAGES) await noSidewaysScroll(page, path);

  await page.goto("/dashboard/notfallkarte");
  const field = page.locator("textarea:visible").last();
  await field.scrollIntoViewIfNeeded();
  await field.fill("Mobiltest");
  await expect(field).toBeInViewport();
  await expect(field).toHaveValue("Mobiltest");

  await page.goto("/dashboard/einstellungen");
  const download = page.waitForEvent("download", { timeout: 15_000 }).catch(() => null);
  await page.getByTestId("account-export-link").click();
  const file = await download;
  if (file) expect(file.suggestedFilename()).toMatch(/\.json$/);
  else expect((await page.context().request.get("/api/account/export")).status()).toBe(200);
  await page.goto("/dashboard/einstellungen");

  await page.getByTestId("account-delete-open").click();
  await expect(page.getByTestId("account-delete-password")).toBeInViewport();
  await expect(page.getByTestId("account-delete-confirm")).toBeVisible();
});
