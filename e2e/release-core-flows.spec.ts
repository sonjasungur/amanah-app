/**
 * The account from start to end, as a release must deliver it: registration only with a confirmed
 * address, documents, family letter, password reset, export and deletion. Synthetic accounts only.
 * API-mode build on Postgres with the mail outbox and RELEASE_E2E=true.
 */
import { expect, test, type Browser, type Page } from "@playwright/test";

test.skip(process.env.RELEASE_E2E !== "true", "Requires an API-mode build on Postgres with the mail outbox");
test.setTimeout(120_000);

const FIRST_PASSWORD = "e2e-passwort-1";
const NEW_PASSWORD = "e2e-passwort-neu-2";

async function latestLink(page: Page, email: string, kind: string): Promise<string> {
  let link = "";
  await expect
    .poll(async () => {
      const res = await page.context().request.get(`/api/dev/outbox?to=${encodeURIComponent(email)}`);
      const { messages } = (await res.json()) as { messages: { kind: string; text: string }[] };
      link = messages.filter((m) => m.kind === kind).at(-1)?.text.match(/https?:\/\/\S+token=\S+/)?.[0] ?? "";
      return link;
    })
    .not.toBe("");
  return link;
}

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByPlaceholder("name@beispiel.de").fill(email);
  await page.getByPlaceholder("••••••••").fill(password);
  await page.getByRole("button", { name: "Anmelden" }).last().click();
}

async function freshPage(browser: Browser, baseURL: string | undefined, contextOptions: object) {
  const context = await browser.newContext({ ...contextOptions, baseURL });
  return context.newPage();
}

test("an account from registration to deletion", async ({ page, browser, baseURL, viewport, userAgent, isMobile, hasTouch }) => {
  const options = { viewport, userAgent, isMobile, hasTouch };
  const email = `release-${Date.now()}-${Math.floor(Math.random() * 1e6)}@${process.env.E2E_EMAIL_DOMAIN ?? "test.invalid"}`;
  const folder = async (p: Page) => (await (await p.context().request.get("/api/amanah")).json()).data;

  await test.step("registration needs a confirmed address", async () => {
    await page.goto("/register");
    await page.getByPlaceholder("name@beispiel.de").fill(email);
    await page.getByPlaceholder("••••••••").fill(FIRST_PASSWORD);
    await page.getByRole("button", { name: "Registrieren" }).click();
    await expect(page.getByTestId("auth-check-email")).toBeVisible();

    const early = await freshPage(browser, baseURL, options);
    await login(early, email, FIRST_PASSWORD);
    await expect(early.getByText("bestätige zuerst deine E-Mail-Adresse")).toBeVisible();
    expect((await early.context().request.get("/api/amanah")).status()).toBe(401);
    await early.context().close();

    await page.goto(await latestLink(page, email, "verify_email"));
    await expect(page).toHaveURL(/\/dashboard/);
    await page.getByTestId("consent-checkbox").check();
    await page.getByTestId("consent-submit").click();
    await expect(page.getByTestId("consent-gate")).toHaveCount(0);
  });

  await test.step("document list: neutral hints, entries are saved", async () => {
    await page.goto("/dashboard/dokumente");
    const testament = page.getByTestId("document-testament");
    await expect(testament).toContainText("Wo liegt es, und wer weiß davon?");
    await expect(testament).not.toContainText("notariell");
    await page.locator("#location-vorsorgevollmacht").fill("Ordner im Wohnzimmer");
    await expect.poll(async () => JSON.stringify((await folder(page)).documents)).toContain("Ordner im Wohnzimmer");
    await page.reload();
    await expect(page.locator("#location-vorsorgevollmacht")).toHaveValue("Ordner im Wohnzimmer");
  });

  await test.step("family letter: complete, without unreviewed statements", async () => {
    await page.goto("/dashboard/vollmacht");
    await page.goto("/dashboard/familie");
    await page.getByRole("button", { name: "Template-Brief erstellen" }).click();
    await expect.poll(async () => (await folder(page)).familyMessage.familyLetter).toContain("Liebe Familie");
    const letter = (await folder(page)).familyMessage.familyLetter as string;
    expect(letter).toContain("Mir ist wichtig: [bitte in eigenen Worten ergänzen]");
    expect(letter).not.toMatch(/zeitnahe Janazah|bevor der Nachlass|undefined/);
  });

  await test.step("password reset: the old password stops working", async () => {
    const reset = await freshPage(browser, baseURL, options);
    await reset.goto("/passwort-vergessen");
    await reset.locator('input[type="email"]').fill(email);
    await reset.getByRole("button", { name: "Link anfordern" }).click();
    await expect(reset.getByTestId("forgot-password-message")).toBeVisible();
    await reset.goto(await latestLink(reset, email, "reset_password"));
    await reset.locator('input[type="password"]').first().fill(NEW_PASSWORD);
    await reset.locator('input[type="password"]').last().fill(NEW_PASSWORD);
    await reset.getByRole("button", { name: "Passwort speichern" }).click();
    await expect(reset.getByTestId("reset-password-done")).toBeVisible();

    await login(reset, email, FIRST_PASSWORD);
    await expect(reset).toHaveURL(/\/login/);
    await login(reset, email, NEW_PASSWORD);
    await expect(reset).toHaveURL(/\/dashboard/);
    await expect.poll(async () => JSON.stringify((await folder(reset)).documents)).toContain("Ordner im Wohnzimmer");

    await test.step("export holds the own data", async () => {
      await reset.goto("/dashboard/einstellungen");
      await expect(reset.getByTestId("account-export-link")).toBeVisible();
      const res = await reset.context().request.get((await reset.getByTestId("account-export-link").getAttribute("href"))!);
      expect(res.status()).toBe(200);
      expect(JSON.stringify(await res.json())).toContain("Ordner im Wohnzimmer");
    });

    await test.step("deletion asks for the password, then the account is gone", async () => {
      await reset.getByTestId("account-delete-open").click();
      await reset.getByTestId("account-delete-password").fill("falsches-passwort");
      await reset.getByTestId("account-delete-confirm").click();
      await expect(reset.locator('[data-testid="account-controls"]')).toBeVisible();
      expect((await reset.context().request.get("/api/amanah")).status()).toBe(200);
      await reset.getByTestId("account-delete-password").fill(NEW_PASSWORD);
      await reset.getByTestId("account-delete-confirm").click();
      await expect.poll(async () => (await reset.context().request.get("/api/amanah")).status()).toBe(401);
      await login(reset, email, NEW_PASSWORD);
      await expect(reset).toHaveURL(/\/login/);
    });
    await reset.context().close();
  });
});
