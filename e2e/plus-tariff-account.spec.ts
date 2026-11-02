/**
 * Plus purchase and refund with synthetic accounts in the browser, while Plus is enforced.
 * API-mode build with AMANAH_BILLING_ENFORCE=true, AMANAH_PLUS_LAUNCH_AT in the past,
 * AMANAH_BILLING_MODE=sandbox and PLUS_TARIFF_E2E=true. No real payment.
 */
import { expect, test, type Page } from "@playwright/test";

test.skip(process.env.PLUS_TARIFF_E2E !== "true", "Requires an API-mode build with Plus enforced and the sandbox");

const PASSWORD = "e2e-passwort-1";

async function register(page: Page): Promise<string> {
  const email = `plus-${Date.now()}-${Math.floor(Math.random() * 1e6)}@test.invalid`;
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

const folder = async (page: Page) =>
  (await (await page.context().request.get("/api/amanah")).json()) as {
    data: { janazahWishes: { fullName: string }; emergencyCard: { name: string } };
    writeScope: string;
  };

async function fillJanazah(page: Page, name: string) {
  await page.goto("/dashboard/janazah?schritt=0");
  await expect(async () => {
    await page.getByTestId("janazah-fullName").locator("input").fill(name);
    await expect(page.getByTestId("save-status-indicator").locator("visible=true").first()).toBeVisible({ timeout: 2000 });
    await page.waitForTimeout(600);
  }).toPass();
}

test("buying unlocks paid areas, a refund closes them, and nothing stored is lost", async ({ page }) => {
  await register(page);
  expect((await folder(page)).writeScope).toBe("free_sections");

  await fillJanazah(page, "Vor dem Kauf");
  await expect(page.getByTestId("save-status-partial").locator("visible=true").first()).toBeVisible();
  expect((await folder(page)).data.janazahWishes.fullName).toBe("");

  await page.goto("/dashboard/notfallkarte");
  await expect(async () => {
    await page.getByLabel("Name", { exact: true }).fill("Amina Test");
    await expect.poll(async () => (await folder(page)).data.emergencyCard.name, { timeout: 2000 }).toBe("Amina Test");
  }).toPass();

  await page.goto("/dashboard/einstellungen");
  await expect(page.getByTestId("billing-controls")).toContainText("nicht gebucht");
  await page.getByTestId("billing-buy-sandbox").click();
  await expect(page).toHaveURL(/\/kasse\/sandbox\?ref=sbx_/);
  await expect(page.getByText("TESTMODUS – es findet keine echte Zahlung statt.")).toBeVisible();
  const ref = new URL(page.url()).searchParams.get("ref")!;
  await page.getByTestId("sandbox-pay-success").click();
  await expect(page.getByTestId("sandbox-result")).toHaveText("Status: paid");
  expect((await folder(page)).writeScope).toBe("full");

  await fillJanazah(page, "Mit Plus");
  await expect.poll(async () => (await folder(page)).data.janazahWishes.fullName).toBe("Mit Plus");
  await expect(page.getByTestId("save-status-partial")).toHaveCount(0);

  const refund = await page.evaluate(async (purchase) => {
    const res = await fetch("/api/billing/sandbox/complete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ref: purchase, outcome: "refund" }) });
    return { status: res.status, body: await res.json() };
  }, ref);
  expect(refund.status).toBe(200);
  expect(refund.body.status).toBe("refunded");
  expect((await folder(page)).writeScope).toBe("free_sections");

  await fillJanazah(page, "Nach der Erstattung");
  await expect(page.getByTestId("save-status-partial").locator("visible=true").first()).toBeVisible();
  const after = await folder(page);
  expect(after.data.janazahWishes.fullName).toBe("Mit Plus");
  expect(after.data.emergencyCard.name).toBe("Amina Test");

  const exported = await (await page.context().request.get("/api/account/export")).json();
  expect(exported.amanahData.janazahWishes.fullName).toBe("Mit Plus");
  expect(exported.purchases[0].status).toBe("refunded");

  await page.goto("/dashboard/notfallkarte");
  await expect(async () => {
    await page.getByLabel("Name", { exact: true }).fill("Amina Neu");
    await expect.poll(async () => (await folder(page)).data.emergencyCard.name, { timeout: 2000 }).toBe("Amina Neu");
  }).toPass();
});

test("the check continues after a reload and on another device", async ({ page, browser, baseURL }) => {
  const email = await register(page);
  await page.goto("/check");
  await expect(page.getByTestId("check-loading")).toBeHidden({ timeout: 8000 });
  await page.getByTestId("check-start").click();
  await page.getByTestId("check-answer-yes").click();
  await expect(page.getByTestId("check-progress-label")).toContainText("Frage 2");
  await page.getByTestId("check-answer-no").click();
  await expect(page.getByTestId("check-progress-label")).toContainText("Frage 3");

  await page.reload();
  await expect(page.getByTestId("check-loading")).toBeHidden({ timeout: 8000 });
  await expect(page.getByTestId("check-progress-label")).toContainText("Frage 3");

  const account = async () => (await (await page.context().request.get("/api/amanah")).json()).data.checkProgress;
  await expect.poll(async () => (await account()).answers).toEqual({ convert: true, "family-muslim": false });

  const other = await browser.newContext({ baseURL });
  const device = await other.newPage();
  await device.goto("/login");
  await device.getByPlaceholder("name@beispiel.de").fill(email);
  await device.getByPlaceholder("••••••••").fill(PASSWORD);
  await device.getByRole("button", { name: "Anmelden" }).last().click();
  await expect(device).toHaveURL(/\/dashboard/);
  await device.goto("/check");
  await expect(device.getByTestId("check-loading")).toBeHidden({ timeout: 8000 });
  await expect(async () => {
    await expect(device.getByTestId("check-progress-label")).toContainText("Frage 3", { timeout: 500 });
  }).toPass();
  await device.getByTestId("check-answer-yes").click();
  await expect(device.getByTestId("check-progress-label")).toContainText("Frage 4");
  await expect.poll(async () => Object.keys((await account()).answers).length).toBe(3);
  await other.close();
});

test("large folders: a warning near the limit, a clear refusal above it, and no input lost", async ({ page }) => {
  test.setTimeout(120_000);
  await register(page);
  await page.goto("/dashboard/notfallkarte");
  await expect(page.getByLabel("Name", { exact: true })).toBeVisible();
  // Real text has spaces: browsers need minutes to wrap one single word of this size.
  const big = (mib: number) => "Erdnuss, ".repeat(Math.floor((mib * 1024 * 1024) / 9));
  const fillAllergies = async (text: string) => {
    await page.getByLabel("Allergien").fill(text);
  };
  await fillAllergies(big(1.8));
  await expect(page.getByTestId("save-status-near-limit").locator("visible=true").first()).toBeVisible({ timeout: 15_000 });
  await expect.poll(async () => (await folder(page)).data.emergencyCard.name).toBe("");

  await fillAllergies(big(2.2));
  await expect(page.getByTestId("save-status-error").locator("visible=true").first()).toContainText("in diesem Browser erhalten", { timeout: 15_000 });
  await expect(page.getByLabel("Allergien")).toHaveValue(big(2.2));
  const stored = await (await page.context().request.get("/api/amanah")).json();
  expect(stored.data.emergencyCard.allergies.length).toBe(big(1.8).length);

  await fillAllergies("kurz");
  await expect.poll(async () => (await (await page.context().request.get("/api/amanah")).json()).data.emergencyCard.allergies).toBe("kurz");
  await expect(page.getByTestId("save-status-error")).toHaveCount(0);
});
