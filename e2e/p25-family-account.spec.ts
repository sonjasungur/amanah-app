/**
 * P2.5-D in account mode: the family conversation goes to the account with the folder and comes back
 * in a new browser session. API-mode build, /api calls mocked by an in-memory account (PHASE2_API_TESTS=true).
 */
import { test, expect, type BrowserContext } from "@playwright/test";

test.skip(process.env.PHASE2_API_TESTS !== "true", "Requires an API-mode build (PHASE2_API_TESTS=true)");

const SESSION = { token: "t-p25d", expiresAt: new Date(Date.now() + 86_400_000).toISOString(), user: { id: "u-p25d", email: "p25d@amanah.test", name: "P25D", createdAt: "2026-01-01T00:00:00.000Z" } };

async function account(context: BrowserContext, folder: { data: unknown }) {
  await context.addInitScript((s) => localStorage.setItem("amanah-auth-session", JSON.stringify(s)), SESSION);
  await context.route("**/api/auth/me", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ session: SESSION }) }));
  await context.route("**/api/consent", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: { sensitive_folder_storage: { granted: true } }, history: [] }) }));
  await context.route("**/api/amanah", async (route) => {
    const method = route.request().method();
    if (method === "GET") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: folder.data, writeScope: "full" }) });
    if (method === "PUT") {
      folder.data = JSON.parse(route.request().postData() ?? "{}");
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ notStored: [] }) });
    }
    return route.continue();
  });
}

test("a recorded talk is stored in the account and is there again in a new session", async ({ browser }) => {
  const folder: { data: unknown } = { data: { schemaVersion: 3 } };
  const first = await browser.newContext();
  await account(first, folder);
  const page = await first.newPage();
  await page.goto("/dashboard/familiengespraech");
  await expect(page.getByTestId("talk-add")).toBeVisible({ timeout: 20_000 });
  await page.getByTestId("talk-add").click();
  await page.getByTestId("talk-open").fill("Konto-Test: Grabstelle klären");
  await page.getByTestId("save-bar-save").click();
  await expect(page.getByTestId("save-bar")).toHaveAttribute("data-state", "gespeichert");
  expect(JSON.stringify(folder.data)).toContain("Konto-Test: Grabstelle klären");
  // Nothing of it stays in the browser profile.
  expect(await page.evaluate(() => JSON.stringify({ ...localStorage }))).not.toContain("Konto-Test");
  await first.close();

  const second = await browser.newContext();
  await account(second, folder);
  const again = await second.newPage();
  await again.goto("/dashboard/familiengespraech");
  await expect(again.getByTestId("talk-open")).toHaveValue("Konto-Test: Grabstelle klären", { timeout: 20_000 });
  await second.close();
});
