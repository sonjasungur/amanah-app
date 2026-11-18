/**
 * P2.5-A: the storage consent ends its waiting state also without a connection, and a confirmed
 * grant opens the folder. API-mode build, /api calls mocked (PHASE2_API_TESTS=true).
 */
import { test, expect } from "@playwright/test";

test.skip(process.env.PHASE2_API_TESTS !== "true", "Requires an API-mode build (PHASE2_API_TESTS=true)");

const SESSION = { token: "t-p25", expiresAt: new Date(Date.now() + 86_400_000).toISOString(), user: { id: "u-p25", email: "p25@amanah.test", name: "P25", createdAt: "2026-01-01T00:00:00.000Z" } };

test("consent: no connection → message and button usable again; then granted → folder opens", async ({ page }) => {
  await page.addInitScript((s) => localStorage.setItem("amanah-auth-session", JSON.stringify(s)), SESSION);
  await page.route("**/api/auth/me", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ session: SESSION }) }));
  await page.route("**/api/amanah", (r) => (r.request().method() === "GET" ? r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: { schemaVersion: 3 }, writeScope: "full" }) }) : r.fulfill({ status: 200, contentType: "application/json", body: "{}" })));
  let posts = 0;
  await page.route("**/api/consent", async (r) => {
    if (r.request().method() === "GET") return r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: { sensitive_folder_storage: { granted: false } } }) });
    posts += 1;
    if (posts === 1) return r.abort("internetdisconnected");
    return r.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ consent: {} }) });
  });
  await page.goto("/dashboard/notfallkarte");
  await expect(page.getByTestId("consent-gate")).toBeVisible({ timeout: 20_000 });
  await page.getByTestId("consent-checkbox").check();
  await page.getByTestId("consent-submit").click();
  await expect(page.getByTestId("consent-error")).toContainText("Keine Verbindung");
  await expect(page.getByTestId("consent-submit")).toBeEnabled();
  await page.getByTestId("consent-submit").click();
  await expect(page.getByTestId("consent-gate")).toHaveCount(0);
  await expect(page.getByLabel("Name", { exact: true })).toBeVisible();
  await page.waitForLoadState("networkidle");
  expect(posts).toBe(2);
});
