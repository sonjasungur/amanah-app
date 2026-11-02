/**
 * The change history in a real account. API-mode build with AMANAH_DATA_HISTORY=true and
 * DATA_HISTORY_E2E=true; setup as in security-session.spec.ts. Synthetic data only.
 */
import { expect, test, type Page } from "@playwright/test";

test.skip(process.env.DATA_HISTORY_E2E !== "true", "Requires an API-mode build with the history switched on");

const PASSWORD = "e2e-passwort-1";

async function register(page: Page) {
  const email = `hist-${Date.now()}-${Math.floor(Math.random() * 1e6)}@test.invalid`;
  await page.goto("/register");
  await page.getByPlaceholder("name@beispiel.de").fill(email);
  await page.getByPlaceholder("••••••••").fill(PASSWORD);
  await page.getByRole("button", { name: "Registrieren" }).click();
  await expect(page.getByTestId("auth-check-email")).toBeVisible();
  let link = "";
  await expect
    .poll(async () => {
      const res = await page.context().request.get(`/api/dev/outbox?to=${encodeURIComponent(email)}`);
      const { messages } = (await res.json()) as { messages: { kind: string; text: string }[] };
      link = messages.filter((m) => m.kind === "verify_email").at(-1)?.text.match(/https?:\/\/\S+token=\S+/)?.[0] ?? "";
      return link;
    })
    .not.toBe("");
  await page.goto(link);
  await expect(page).toHaveURL(/\/dashboard/);
  await page.getByTestId("consent-checkbox").check();
  await page.getByTestId("consent-submit").click();
  await expect(page.getByTestId("consent-gate")).toHaveCount(0);
}

/** A real same-origin request from the page, as the app itself sends it. */
const browserFetch = (page: Page, method: string, url: string, data?: unknown) =>
  page.evaluate(
    async ({ method, url, data }) => {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: data === undefined ? undefined : JSON.stringify(data) });
      return { status: res.status, body: await res.json().catch(() => null) };
    },
    { method, url, data },
  );

const descriptions = async (page: Page) =>
  ((await (await page.context().request.get("/api/amanah")).json()).data.assets as { description: string }[]).map((a) => a.description);

async function assetChangedOnce(page: Page) {
  await page.goto("/dashboard/vermoegen");
  const overview = page.getByTestId("asset-overview");
  await expect(async () => {
    await overview.getByLabel("Bezeichnung").fill("Girokonto");
    await expect(page.getByTestId("asset-add")).toBeEnabled({ timeout: 500 });
  }).toPass();
  await page.getByTestId("asset-add").click();
  await expect.poll(() => descriptions(page)).toEqual(["Girokonto"]);
  await page.getByRole("button", { name: "Girokonto bearbeiten" }).click();
  await overview.getByLabel("Bezeichnung").fill("Tagesgeld");
  await page.getByTestId("asset-add").click();
  await expect.poll(() => descriptions(page)).toEqual(["Tagesgeld"]);
}

test("view, confirm and restore an earlier state, then undo it", async ({ page }) => {
  await register(page);
  await assetChangedOnce(page);

  await page.goto("/dashboard/verlauf");
  await expect(page.getByTestId("history-list")).toContainText("Vermögensübersicht");
  await page.getByRole("button", { name: /ansehen$/ }).click();
  await expect(page.getByTestId("history-version")).toContainText("Girokonto");

  await page.getByTestId("history-restore").click();
  await expect(page.getByTestId("history-confirm-submit")).toBeDisabled();
  await expect.poll(() => descriptions(page)).toEqual(["Tagesgeld"]);
  await page.getByTestId("history-confirm-check").check();
  await page.getByTestId("history-confirm-submit").click();
  await expect(page.getByTestId("history-notice")).toContainText("Wiederhergestellt");
  await expect.poll(() => descriptions(page)).toEqual(["Girokonto"]);

  await page.goto("/dashboard/vermoegen");
  await expect(page.getByTestId("asset-list")).toContainText("Girokonto");
  await page.waitForTimeout(800);
  expect(await descriptions(page)).toEqual(["Girokonto"]);

  await page.goto("/dashboard/verlauf");
  await page.getByRole("button", { name: /ansehen$/ }).first().click();
  await expect(page.getByTestId("history-version")).toContainText("Tagesgeld");
  await page.getByTestId("history-restore").click();
  await page.getByTestId("history-confirm-check").check();
  await page.getByTestId("history-confirm-submit").click();
  await expect.poll(() => descriptions(page)).toEqual(["Tagesgeld"]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)).toBe(false);
});

test("deleting asks first and keeps the current data; another account sees nothing", async ({ page, browser, baseURL }) => {
  await register(page);
  await assetChangedOnce(page);
  await page.goto("/dashboard/verlauf");
  const list = await (await page.context().request.get("/api/amanah/history")).json();
  const id = list.versions[0].id as string;

  const other = await browser.newContext({ baseURL });
  const otherPage = await other.newPage();
  await register(otherPage);
  await otherPage.goto("/dashboard/verlauf");
  await expect(otherPage.getByTestId("history-empty")).toBeVisible();
  expect((await browserFetch(otherPage, "GET", `/api/amanah/history/${id}`)).status).toBe(404);
  expect((await browserFetch(otherPage, "DELETE", `/api/amanah/history/${id}`)).status).toBe(404);
  expect((await browserFetch(otherPage, "POST", `/api/amanah/history/${id}/restore`, { confirmed: true })).status).toBe(404);
  await other.close();

  await page.getByTestId("history-delete-all").click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Abbrechen" }).click();
  await expect(page.getByTestId("history-list")).toBeVisible();
  await page.getByTestId("history-delete-all").click();
  await page.getByTestId("history-delete-submit").click();
  await expect(page.getByTestId("history-empty")).toBeVisible();
  expect(await descriptions(page)).toEqual(["Tagesgeld"]);
});
