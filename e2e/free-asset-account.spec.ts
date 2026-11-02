/**
 * The free asset overview in a real account while Plus is enforced. API-mode build plus
 * AMANAH_BILLING_ENFORCE=true, AMANAH_PLUS_LAUNCH_AT in the past and FREE_ASSET_E2E=true;
 * setup as in security-session.spec.ts. Synthetic data, mails in the in-memory outbox only.
 */
import { expect, test, type Page } from "@playwright/test";

test.skip(process.env.FREE_ASSET_E2E !== "true", "Requires an API-mode build with Plus enforced (FREE_ASSET_E2E=true)");

const PASSWORD = "e2e-passwort-1";

async function registerFreeAccount(page: Page): Promise<string> {
  const email = `free-${Date.now()}-${Math.floor(Math.random() * 1e6)}@test.invalid`;
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
  return email;
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

const stored = async (page: Page) => (await (await page.context().request.get("/api/amanah")).json()) as { data: { assets: { description: string }[]; familyMessage: { familyLetter: string }; janazahWishes: { fullName: string }; emergencyCard: { name: string }; checkProgress: { answers: Record<string, boolean> } }; writeScope: string };

test("a free account creates, edits, prints, deletes and exports assets in the account", async ({ page }) => {
  await registerFreeAccount(page);
  expect((await stored(page)).writeScope).toBe("free_sections");

  await page.goto("/dashboard/vermoegen");
  const overview = page.getByTestId("asset-overview");
  await expect(page.getByTestId("plus-area-notice")).toHaveCount(0);
  await expect(page.locator("[data-testid^='plus-gate-']")).toHaveCount(0);
  await expect(async () => {
    await overview.getByLabel("Bezeichnung").fill("Girokonto");
    await expect(page.getByTestId("asset-add")).toBeEnabled({ timeout: 500 });
  }).toPass();
  await page.getByTestId("asset-add").click();
  await expect.poll(async () => (await stored(page)).data.assets.map((a) => a.description)).toEqual(["Girokonto"]);
  await expect(page.getByTestId("save-status-partial")).toHaveCount(0);

  await page.getByRole("button", { name: "Girokonto bearbeiten" }).click();
  await overview.getByLabel("Bezeichnung").fill("Tagesgeld");
  await page.getByTestId("asset-add").click();
  await expect.poll(async () => (await stored(page)).data.assets.map((a) => a.description)).toEqual(["Tagesgeld"]);

  await page.emulateMedia({ media: "print" });
  await expect(page.getByTestId("asset-print-view")).toContainText("Tagesgeld");
  await page.emulateMedia({ media: "screen" });

  const exported = await (await page.context().request.get("/api/account/export")).json();
  expect(exported.format).toBe("amanah-account-export@2");
  expect(exported.amanahData.assets[0].description).toBe("Tagesgeld");

  await page.getByRole("button", { name: "Tagesgeld entfernen" }).click();
  await expect.poll(async () => (await stored(page)).data.assets).toEqual([]);
});

test("emergency card, check and bookmarks reach the account and a second device", async ({ page, browser, baseURL }) => {
  const email = await registerFreeAccount(page);

  await page.goto("/dashboard/notfallkarte");
  await expect(page.getByTestId("plus-area-notice")).toHaveCount(0);
  await expect(async () => {
    await page.getByLabel("Name", { exact: true }).fill("Amina Test");
    await expect
      .poll(async () => (await stored(page)).data.emergencyCard.name, { timeout: 2000 })
      .toBe("Amina Test");
  }).toPass();
  await expect(page.getByTestId("save-status-partial")).toHaveCount(0);

  await page.goto("/check");
  await expect(page.getByTestId("check-loading")).toBeHidden({ timeout: 8000 });
  await page.getByTestId("check-start").click();
  await page.getByTestId("check-answer-yes").click();
  await expect
    .poll(async () => Object.keys((await stored(page)).data.checkProgress.answers).length, { timeout: 5000 })
    .toBe(1);

  // No article is published, so the bookmark button cannot be reached: the same write the button causes.
  // This write bypasses the open page, so the page must have finished saving first.
  await page.waitForTimeout(800);
  expect((await browserFetch(page, "PATCH", "/api/amanah", { knowledgeBookmarks: ["artikel-a"] })).status).toBe(200);

  const fresh = await browser.newContext({ baseURL });
  const other = await fresh.newPage();
  await other.goto("/login");
  await other.getByPlaceholder("name@beispiel.de").fill(email);
  await other.getByPlaceholder("••••••••").fill(PASSWORD);
  await other.getByRole("button", { name: "Anmelden" }).last().click();
  await expect(other).toHaveURL(/\/dashboard/);
  await other.goto("/dashboard/notfallkarte");
  await expect(other.getByLabel("Name", { exact: true })).toHaveValue("Amina Test");
  const local = await other.evaluate(() => localStorage.getItem("amanah-ordner-data") ?? "");
  expect(local).toContain("artikel-a");
  expect(JSON.parse(local).state.checkProgress.index).toBeGreaterThan(0);
  await fresh.close();

  const exported = await (await page.context().request.get("/api/account/export")).json();
  expect(exported.amanahData.emergencyCard.name).toBe("Amina Test");
  expect(exported.amanahData.knowledgeBookmarks).toEqual(["artikel-a"]);
  expect(Object.keys(exported.amanahData.checkProgress.answers)).toHaveLength(1);

  // A paid area stays closed.
  const paid = await browserFetch(page, "PATCH", "/api/amanah", { familyMessage: { familyLetter: "Plus" } });
  expect(paid.body.notStored).toEqual(["familyMessage"]);
});

test("other areas stay in the browser, are named as such, and the data survives a new login", async ({ page, browser, baseURL }) => {
  const email = await registerFreeAccount(page);
  await page.goto("/dashboard/vermoegen");
  const overview = page.getByTestId("asset-overview");
  await expect(async () => {
    await overview.getByLabel("Bezeichnung").fill("Depot");
    await expect(page.getByTestId("asset-add")).toBeEnabled({ timeout: 500 });
  }).toPass();
  await page.getByTestId("asset-add").click();
  await expect.poll(async () => (await stored(page)).data.assets.length).toBe(1);

  await page.goto("/dashboard/janazah?schritt=0");
  await expect(async () => {
    await page.getByTestId("janazah-fullName").locator("input").fill("Nur im Browser");
    await expect(page.getByTestId("save-status-partial").locator("visible=true").first()).toBeVisible({ timeout: 2000 });
  }).toPass();
  expect((await stored(page)).data.janazahWishes.fullName).toBe("");

  const fresh = await browser.newContext({ baseURL });
  const other = await fresh.newPage();
  await other.goto("/login");
  await other.getByPlaceholder("name@beispiel.de").fill(email);
  await other.getByPlaceholder("••••••••").fill(PASSWORD);
  await other.getByRole("button", { name: "Anmelden" }).last().click();
  await expect(other).toHaveURL(/\/dashboard/);
  await other.goto("/dashboard/vermoegen");
  await expect(other.getByTestId("asset-list")).toContainText("Depot");
  await fresh.close();

  await page.goto("/dashboard/janazah?schritt=0");
  await expect(page.getByTestId("janazah-fullName").locator("input")).toHaveValue("Nur im Browser");
});
