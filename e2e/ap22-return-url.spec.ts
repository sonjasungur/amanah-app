/**
 * AP22 EA-04.4: back to the chosen area after registration, sign-in and the e-mail confirmation.
 * Local-mode build (npm run build:e2e): registration signs in at once; the confirmation answer is mocked.
 */
import { expect, test } from "@playwright/test";

const TARGET = "/dashboard/notfallkarte";
const SESSION = { token: "t-ap22", expiresAt: new Date(Date.now() + 86_400_000).toISOString(), user: { id: "u-ap22", email: "ap22@amanah.test", name: "AP22", createdAt: "2026-01-01T00:00:00.000Z" } };

test("registration from a protected area returns there", async ({ page }) => {
  await page.goto(`/register?returnUrl=${encodeURIComponent(TARGET)}`);
  await expect(page.locator(`a[href="/login?returnUrl=${encodeURIComponent(TARGET)}"]`)).toBeVisible();
  await expect(async () => {
    await page.getByPlaceholder("name@beispiel.de").fill(`ap22-${Date.now()}@test.invalid`);
    await page.getByPlaceholder("••••••••").fill("e2e-passwort-1");
    await page.getByRole("button", { name: "Registrieren" }).click();
    await expect(page).toHaveURL(new RegExp(`${TARGET}$`), { timeout: 5_000 });
  }).toPass({ timeout: 30_000 });
});

test("the e-mail confirmation page goes back to the area named in the link", async ({ page }) => {
  await page.route("**/api/auth/verify-email", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ session: SESSION }) }));
  await page.goto(`/konto/bestaetigen?token=${"a".repeat(32)}&returnUrl=${encodeURIComponent(TARGET)}`);
  await expect(page).toHaveURL(new RegExp(`${TARGET}$`), { timeout: 20_000 });
});

test("a foreign or protocol-relative target is ignored", async ({ page }) => {
  await page.route("**/api/auth/verify-email", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ session: SESSION }) }));
  await page.goto(`/konto/bestaetigen?token=${"b".repeat(32)}&returnUrl=${encodeURIComponent("//evil.example/x")}`);
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20_000 });
});
