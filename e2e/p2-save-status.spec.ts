/**
 * P2: the save status names the real cause and loses nothing. API-mode build, all /api calls mocked
 * (PHASE2_API_TESTS=true), like phase2-failure-paths.spec.ts. No real account, no real data.
 */
import { test, expect, type Page, type Route } from "@playwright/test";

test.skip(process.env.PHASE2_API_TESTS !== "true", "Requires an API-mode build (PHASE2_API_TESTS=true)");

const SESSION = {
  token: "test-token-p2",
  expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
  user: { id: "test-user-p2", email: "p2@amanah.test", name: "P2", createdAt: "2026-01-01T00:00:00.000Z" },
};

async function signedIn(page: Page, onPut: (route: Route, n: number) => Promise<void>) {
  await page.addInitScript((s) => localStorage.setItem("amanah-auth-session", JSON.stringify(s)), SESSION);
  await page.route("**/api/auth/me", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ session: SESSION }) }));
  await page.route("**/api/consent", (r) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: { sensitive_folder_storage: { granted: true } }, history: [] }) }),
  );
  let n = 0;
  await page.route("**/api/amanah", async (route) => {
    if (route.request().method() === "GET") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: { schemaVersion: 3 }, writeScope: "full" }) });
    if (route.request().method() === "PUT") return onPut(route, ++n);
    return route.continue();
  });
  await page.goto("/dashboard/notfallkarte");
  await expect(page.getByLabel("Name", { exact: true })).toBeVisible({ timeout: 20_000 });
}

const ok = (route: Route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ notStored: [] }) });
const status = (page: Page) => page.getByTestId("save-status-indicator").first();

test("missing consent is named, the input stays", async ({ page }) => {
  await signedIn(page, (route) => route.fulfill({ status: 403, contentType: "application/json", body: JSON.stringify({ code: "consent_required", error: "x" }) }));
  await page.getByLabel("Name", { exact: true }).fill("Vor der Einwilligung");
  await expect(page.getByTestId("save-status-error")).toContainText("fehlt deine Einwilligung");
  await expect(status(page)).toContainText("Speicherung fehlgeschlagen");
  await expect(status(page)).not.toContainText("Sicher in deinem Konto");
  await expect(page.getByLabel("Name", { exact: true })).toHaveValue("Vor der Einwilligung");
});

test("an expired session is named, the input stays", async ({ page }) => {
  await signedIn(page, (route) => route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ error: "Nicht angemeldet." }) }));
  await page.getByLabel("Name", { exact: true }).fill("Sitzung abgelaufen");
  await expect(page.getByTestId("save-status-error")).toContainText("Anmeldung ist abgelaufen");
});

test("without network: shown as such, then sent again by itself and confirmed", async ({ page }) => {
  await signedIn(page, (route, n) => (n === 1 ? route.abort("internetdisconnected") : ok(route)));
  await page.getByLabel("Name", { exact: true }).fill("Offline erfasst");
  await expect(page.getByTestId("save-status-error")).toContainText("Keine Verbindung");
  await expect(status(page)).toContainText("Sicher in deinem Konto gespeichert", { timeout: 15_000 });
  await expect(page.getByLabel("Name", { exact: true })).toHaveValue("Offline erfasst");
});

test("a slow save is 'not yet synced' until the account confirms it", async ({ page }) => {
  // Every save waits until released; after that the account answers at once.
  let released = false;
  const waiting: (() => void)[] = [];
  const release = () => {
    released = true;
    waiting.splice(0).forEach((go) => go());
  };
  await signedIn(page, (route) => (released ? ok(route) : new Promise<void>((done) => waiting.push(() => void ok(route).then(done)))));
  await page.getByLabel("Name", { exact: true }).fill("Langsam");
  await expect(status(page)).toContainText("Noch nicht synchronisiert");
  await expect(status(page)).not.toContainText("Sicher in deinem Konto");
  release();
  await expect(status(page)).toContainText("Sicher in deinem Konto gespeichert");
});
