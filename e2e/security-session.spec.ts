/**
 * Real cookie sessions against an API-mode build (memory server storage, no mocks).
 *
 * Build/run: see docs/strategy/06-sicherheit-und-tests.md — requires
 * NEXT_PUBLIC_AUTH_MODE=api NEXT_PUBLIC_STORAGE_MODE=api
 * NEXT_PUBLIC_AMANAH_PUBLIC_REGISTRATION_ENABLED=true AMANAH_PUBLIC_REGISTRATION_ENABLED=true
 * SESSION_SECRET=<32+ chars> and SECURITY_API_E2E=true.
 */
import { test, expect, request as playwrightRequest, type BrowserContext, type Page } from "@playwright/test";

test.skip(process.env.SECURITY_API_E2E !== "true", "Requires an API-mode build (SECURITY_API_E2E=true)");
test.describe.configure({ mode: "serial" });

const EMAIL = `e2e-${Date.now()}@test.invalid`;
const PASSWORD = "e2e-passwort-1";
let sessionCookie: { name: string; value: string } | null = null;
/** One browser session shared by the serial steps below. */
let context: BrowserContext;
let page: Page;

test.beforeEach(async ({}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop", "Server behaviour is viewport-independent; one registration only");
});

test.beforeAll(async ({ browser }, testInfo) => {
  context = await browser.newContext({ baseURL: testInfo.project.use.baseURL, acceptDownloads: true });
  page = await context.newPage();
});

test.afterAll(async () => {
  await context?.close();
});

test("registration sets an HttpOnly cookie and keeps no token in page storage", async ({ baseURL }) => {
  await page.goto("/register");
  await page.getByPlaceholder("name@beispiel.de").fill(EMAIL);
  await page.getByPlaceholder("••••••••").fill(PASSWORD);
  await page.getByRole("button", { name: "Registrieren" }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  const cookies = await page.context().cookies(baseURL);
  const cookie = cookies.find((c) => c.name.endsWith("amanah_session"));
  expect(cookie).toBeTruthy();
  expect(cookie!.httpOnly).toBe(true);
  expect(cookie!.sameSite).toBe("Lax");
  expect(cookie!.path).toBe("/");
  sessionCookie = { name: cookie!.name, value: cookie!.value };

  const pageVisible = await page.evaluate(() => ({ cookie: document.cookie, storage: JSON.stringify({ ...localStorage }) }));
  expect(pageVisible.cookie).not.toContain(cookie!.value);
  expect(pageVisible.storage).not.toContain(cookie!.value);
  expect(pageVisible.storage).not.toMatch(/"token"/);
});

test("folder data is saved on the server for this session", async () => {
  await page.goto("/dashboard/janazah");
  await expect(page.getByTestId("janazah-guided-flow")).toBeVisible();
  await page.getByTestId("janazah-fullName").locator("input").fill("Amina E2E");
  await page.getByTestId("janazah-next-button").click();

  await expect
    .poll(async () => {
      const res = await page.context().request.get("/api/amanah");
      return (await res.json()).data?.janazahWishes?.fullName;
    }, { timeout: 10_000 })
    .toBe("Amina E2E");
});

test("cross-origin writes are rejected even with a valid cookie", async () => {
  const res = await page.context().request.put("/api/amanah", {
    headers: { Origin: "https://evil.example", "Content-Type": "application/json" },
    data: { janazahWishes: { fullName: "Angreifer" } },
  });
  expect(res.status()).toBe(401);

  const forgedLogin = await page.context().request.post("/api/auth/login", {
    headers: { Origin: "https://evil.example" },
    data: { email: EMAIL, password: PASSWORD },
  });
  expect(forgedLogin.status()).toBe(403);
});

test("logout invalidates the server session; replaying the old cookie fails", async ({ baseURL }) => {
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Abmelden" }).first().click();
  await expect.poll(async () => (await page.context().cookies(baseURL)).some((c) => c.name.endsWith("amanah_session"))).toBe(false);

  const replay = await playwrightRequest.newContext({ baseURL, extraHTTPHeaders: { Cookie: `${sessionCookie!.name}=${sessionCookie!.value}` } });
  expect((await replay.get("/api/amanah")).status()).toBe(401);
  await replay.dispose();
});

test("account export downloads all data; deletion needs the password and removes the account", async ({ baseURL }) => {
  await page.goto("/login");
  await page.getByPlaceholder("name@beispiel.de").fill(EMAIL);
  await page.getByPlaceholder("••••••••").fill(PASSWORD);
  await page.getByRole("button", { name: "Anmelden" }).last().click();
  await expect(page).toHaveURL(/\/dashboard/);

  await page.goto("/dashboard/einstellungen");
  await expect(page.getByTestId("settings-account")).toBeVisible();
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByTestId("account-export-link").click()]);
  const exported = JSON.parse(await (await download.createReadStream()).toArray().then((c) => Buffer.concat(c).toString("utf8")));
  expect(exported.account.email).toBe(EMAIL);
  expect(exported.amanahData.janazahWishes.fullName).toBe("Amina E2E");
  expect(JSON.stringify(exported)).not.toMatch(/passwordHash|scrypt:/);

  await page.getByTestId("account-delete-open").click();
  await page.getByTestId("account-delete-password").fill("falsches-passwort");
  await page.getByTestId("account-delete-confirm").click();
  await expect(page.getByText("Passwort zur Bestätigung erforderlich.")).toBeVisible();

  await page.getByTestId("account-delete-password").fill(PASSWORD);
  await page.getByTestId("account-delete-confirm").click();
  await expect(page).toHaveURL(new RegExp(`${baseURL}/?$`));

  // Same-origin login attempt (a request without Origin is already rejected with 403 by the CSRF guard).
  const login = await page.context().request.post("/api/auth/login", {
    headers: { Origin: baseURL! },
    data: { email: EMAIL, password: PASSWORD },
  });
  expect(login.status()).toBe(401);
});
