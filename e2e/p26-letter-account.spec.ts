/**
 * P2.6 family letter in account mode: saved to the account with all letter fields, there again in a
 * new browser session, ready in "Meine Dokumente". API-mode build, /api mocked by an in-memory
 * account (PHASE2_API_TESTS=true).
 */
import { test, expect, type BrowserContext } from "@playwright/test";

test.skip(process.env.PHASE2_API_TESTS !== "true", "Requires an API-mode build (PHASE2_API_TESTS=true)");

const SESSION = { token: "t-p26", expiresAt: new Date(Date.now() + 86_400_000).toISOString(), user: { id: "u-p26", email: "p26@amanah.test", name: "P26", createdAt: "2026-01-01T00:00:00.000Z" } };

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

test("the letter is stored in the account and is there again in a new session", async ({ browser }) => {
  const folder: { data: unknown } = { data: { schemaVersion: 3 } };
  const first = await browser.newContext();
  await account(first, folder);
  const page = await first.newPage();
  await page.goto("/dashboard/familie");
  await expect(page.getByTestId("letter-body")).toBeVisible({ timeout: 20_000 });
  await page.getByTestId("letter-greeting").fill("Meine Lieben,");
  await page.getByTestId("letter-body").fill("Kontotest: Ein Brief, der nach dem Abmelden wieder da sein muss.");
  await page.getByTestId("letter-closing").fill("In Liebe");
  await page.getByTestId("save-bar-save").click();
  await expect(page.getByTestId("save-bar")).toHaveAttribute("data-state", "gespeichert");
  const stored = JSON.stringify(folder.data);
  expect(stored).toContain("Kontotest: Ein Brief");
  expect(stored).toContain('"letterGreeting":"Meine Lieben,"');
  expect(await page.evaluate(() => JSON.stringify({ ...localStorage }))).not.toContain("Kontotest");
  await first.close();

  const second = await browser.newContext();
  await account(second, folder);
  const again = await second.newPage();
  await again.goto("/dashboard/familie");
  await expect(again.getByTestId("letter-body")).toHaveValue(/Kontotest: Ein Brief/, { timeout: 20_000 });
  await expect(again.getByTestId("letter-greeting")).toHaveValue("Meine Lieben,");
  await again.goto("/dashboard/pdf");
  await expect(again.getByTestId("export-familienbrief")).toContainText("Bereit");
  await second.close();
});
