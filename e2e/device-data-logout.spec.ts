/**
 * The browser keeps no folder of an account after logout, in other tabs, after going back, or for
 * the next account on the same device. Runs against an API-mode build (SECURITY_API_E2E=true, see
 * security-session.spec.ts); mails go to the in-memory outbox only, all data is synthetic.
 */
import { test, expect, type BrowserContext, type Page } from "@playwright/test";

test.skip(process.env.SECURITY_API_E2E !== "true", "Requires an API-mode build (SECURITY_API_E2E=true)");
test.describe.configure({ mode: "serial" });

const PASSWORD = "e2e-passwort-1";
const SECRET_A = "Geheim Konto A";
const emailA = `device-a-${Date.now()}@test.invalid`;
const emailB = `device-b-${Date.now()}@test.invalid`;

let context: BrowserContext;
let page: Page;

test.beforeEach(async ({}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop", "Browser storage behaviour is viewport-independent");
});

test.beforeAll(async ({ browser }, testInfo) => {
  context = await browser.newContext({ baseURL: testInfo.project.use.baseURL });
  page = await context.newPage();
});

test.afterAll(async () => {
  await context?.close();
});

async function verifyLink(email: string): Promise<string> {
  let link = "";
  await expect
    .poll(async () => {
      const res = await page.context().request.get(`/api/dev/outbox?to=${encodeURIComponent(email)}`);
      const { messages } = (await res.json()) as { messages: { kind: string; text: string }[] };
      link = messages.filter((m) => m.kind === "verify_email").at(-1)?.text.match(/https?:\/\/\S+token=\S+/)?.[0] ?? "";
      return link;
    })
    .not.toBe("");
  return link;
}

async function registerAndConsent(email: string) {
  await page.goto("/register");
  await page.getByPlaceholder("name@beispiel.de").fill(email);
  await page.getByPlaceholder("••••••••").fill(PASSWORD);
  await page.getByRole("button", { name: "Registrieren" }).click();
  await expect(page.getByTestId("auth-check-email")).toBeVisible();
  await page.goto(await verifyLink(email));
  await expect(page).toHaveURL(/\/dashboard/);
  await page.getByTestId("consent-checkbox").check();
  await page.getByTestId("consent-submit").click();
  await expect(page.getByTestId("consent-gate")).toHaveCount(0);
}

async function enterName(target: Page, name: string) {
  await target.goto("/dashboard/janazah");
  await expect(target.getByTestId("janazah-guided-flow")).toBeVisible();
  await target.getByTestId("janazah-fullName").locator("input").fill(name);
  await target.getByTestId("janazah-next-button").click();
}

const storageDump = (target: Page) => target.evaluate(() => JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage }));

async function logOut(target: Page) {
  await target.getByRole("button", { name: "Abmelden" }).first().click();
}

test("account A saves a folder; a second tab shows it", async () => {
  await registerAndConsent(emailA);
  await enterName(page, SECRET_A);
  await expect.poll(async () => (await (await page.context().request.get("/api/amanah")).json()).data?.janazahWishes?.fullName, { timeout: 10_000 }).toBe(SECRET_A);
  expect(await storageDump(page)).toContain(SECRET_A);

  const second = await context.newPage();
  await second.goto("/dashboard/janazah");
  await expect(second.getByTestId("janazah-fullName").locator("input")).toHaveValue(SECRET_A);
});

test("logout removes the folder from this browser and from the other tab", async () => {
  const second = context.pages()[1];
  await page.goto("/dashboard");
  await logOut(page);
  await expect(page).toHaveURL(/\/$/);
  expect(await storageDump(page)).not.toContain(SECRET_A);
  // The store may write back its empty defaults; nothing of the folder and no owner may remain.
  const kept = await page.evaluate(() => ({ folder: localStorage.getItem("amanah-ordner-data"), owner: localStorage.getItem("amanah-ordner-owner") }));
  expect(kept.owner).toBeNull();
  expect(kept.folder === null || JSON.parse(kept.folder).state.janazahWishes.fullName === "").toBe(true);

  // The other tab reloads on the logout and lands at the login, without the old folder in memory.
  await expect(second).toHaveURL(/\/login/, { timeout: 10_000 });
  await expect(second.getByText(SECRET_A)).toHaveCount(0);
  expect(await second.evaluate(() => document.body.innerHTML)).not.toContain(SECRET_A);
  expect(await storageDump(second)).not.toContain(SECRET_A);
  await second.close();
});

test("going back after logout shows nothing of the folder", async () => {
  await page.goBack();
  await expect(page).toHaveURL(/\/login|\/dashboard/);
  await expect.poll(() => page.evaluate(() => document.body.innerHTML)).not.toContain(SECRET_A);
  await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  expect(await storageDump(page)).not.toContain(SECRET_A);
});

test("the next account on this device starts empty and never receives A's folder", async () => {
  await registerAndConsent(emailB);
  await page.goto("/dashboard/janazah");
  await expect(page.getByTestId("janazah-fullName").locator("input")).toHaveValue("");
  await page.waitForTimeout(1_000);
  const accountB = await (await page.context().request.get("/api/amanah")).json();
  expect(JSON.stringify(accountB)).not.toContain(SECRET_A);
  expect(await storageDump(page)).not.toContain(SECRET_A);
});

test("a logout with a change the account did not receive asks first, and keeps it when declined", async ({ baseURL }) => {
  await enterName(page, "B wartet noch");
  await expect.poll(async () => (await (await page.context().request.get("/api/amanah")).json()).data?.janazahWishes?.fullName, { timeout: 10_000 }).toBe("B wartet noch");

  await page.route("**/api/amanah", (route) => (route.request().method() === "GET" ? route.continue() : route.fulfill({ status: 500, body: "{}" })));
  await enterName(page, "B nicht gesendet"); // the save of this change fails
  await page.waitForTimeout(800);

  // The question comes after the other tabs were asked; wait for it instead of assuming its timing.
  const declined = page.waitForEvent("dialog");
  await logOut(page);
  await (await declined).dismiss();
  await expect.poll(async () => (await context.cookies(baseURL)).some((c) => c.name.endsWith("amanah_session"))).toBe(true);
  expect(await storageDump(page)).toContain("B nicht gesendet");

  const accepted = page.waitForEvent("dialog");
  await logOut(page);
  await (await accepted).accept();
  await expect.poll(async () => (await context.cookies(baseURL)).some((c) => c.name.endsWith("amanah_session"))).toBe(false);
  expect(await storageDump(page)).not.toContain("B nicht gesendet");
  await page.unroute("**/api/amanah");
});

async function logIn(target: Page, email: string) {
  await target.goto("/login");
  await target.getByPlaceholder("name@beispiel.de").fill(email);
  await target.getByPlaceholder("••••••••").fill(PASSWORD);
  await target.getByRole("button", { name: "Anmelden" }).last().click();
  await expect(target).toHaveURL(/\/dashboard/);
}

const SECRET_TAB = "Nur im Tab";

test("while signed in the folder lives only in the tab; a new tab reads it from the account", async () => {
  await logIn(page, emailB);
  await enterName(page, SECRET_TAB);
  await expect.poll(async () => (await (await page.context().request.get("/api/amanah")).json()).data?.janazahWishes?.fullName, { timeout: 10_000 }).toBe(SECRET_TAB);

  const local = await page.evaluate(() => JSON.stringify({ ...localStorage }));
  expect(local).not.toContain(SECRET_TAB);
  expect(await page.evaluate(() => sessionStorage.getItem("amanah-ordner-data"))).toContain(SECRET_TAB);

  const fresh = await context.newPage();
  await fresh.goto("/dashboard/janazah");
  await expect(fresh.getByTestId("janazah-fullName").locator("input")).toHaveValue(SECRET_TAB);
  expect(await fresh.evaluate(() => JSON.stringify({ ...localStorage }))).not.toContain(SECRET_TAB);
  await fresh.close();
});

test("a logout asks first when another tab holds a change the account did not receive", async ({ baseURL }) => {
  const other = await context.newPage();
  await other.goto("/dashboard/janazah");
  await expect(other.getByTestId("janazah-fullName").locator("input")).toHaveValue(SECRET_TAB);
  await other.route("**/api/amanah", (route) => (route.request().method() === "GET" ? route.continue() : route.fulfill({ status: 500, body: "{}" })));
  await other.getByTestId("janazah-fullName").locator("input").fill("Im anderen Tab ungespeichert");
  await other.getByTestId("janazah-next-button").click();
  await other.waitForTimeout(800);

  await page.goto("/dashboard");
  const asked = page.waitForEvent("dialog");
  await logOut(page);
  const question = await asked;
  expect(question.message()).toContain("anderen Tab");
  await question.dismiss();
  expect((await context.cookies(baseURL)).some((c) => c.name.endsWith("amanah_session"))).toBe(true);

  await other.unroute("**/api/amanah");
  await other.close();
});

test("going back to a page kept in the back-forward cache after a logout elsewhere shows nothing", async () => {
  const shows: string[] = [];
  await page.addInitScript(() => {
    window.addEventListener("pageshow", (event) => {
      const log = JSON.parse(sessionStorage.getItem("e2e-pageshow") ?? "[]") as boolean[];
      sessionStorage.setItem("e2e-pageshow", JSON.stringify([...log, event.persisted]));
    });
  });
  await page.goto("/dashboard/janazah");
  await expect(page.getByTestId("janazah-fullName").locator("input")).toHaveValue(SECRET_TAB);
  await page.goto("/wissen"); // a full navigation; the dashboard may stay in the back-forward cache

  const other = await context.newPage();
  await other.goto("/dashboard");
  await logOut(other);
  await expect(other).toHaveURL(/\/$/);
  await other.close();

  await page.goBack();
  await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  expect(await page.evaluate(() => document.body.innerHTML)).not.toContain(SECRET_TAB);
  expect(await storageDump(page)).not.toContain(SECRET_TAB);
  shows.push(...((await page.evaluate(() => JSON.parse(sessionStorage.getItem("e2e-pageshow") ?? "[]"))) as string[]));
  test.info().annotations.push({ type: "bfcache", description: `pageshow persisted: ${JSON.stringify(shows)}` });
  console.log(`BFCACHE pageshow persisted: ${JSON.stringify(shows)}`);
});
