/**
 * Accounts from before e-mail confirmation, against an API-mode build on a throwaway Postgres.
 * Same build as security-session.spec.ts plus DATABASE_URL of that throwaway database in the
 * test runner, so the spec can mark its own synthetic accounts as legacy (as the migration does).
 */
import { test, expect, type Page } from "@playwright/test";
import { Client } from "pg";

/** Plain SQL: the generated Prisma 7 client is ESM and cannot be loaded by the spec runner. */
async function sql(text: string, values: unknown[]): Promise<void> {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query(text, values);
  } finally {
    await client.end();
  }
}

test.skip(
  process.env.SECURITY_API_E2E !== "true" || !process.env.DATABASE_URL,
  "Requires an API-mode build on Postgres (SECURITY_API_E2E=true, DATABASE_URL)"
);
test.describe.configure({ mode: "serial" });

const PASSWORD = "e2e-passwort-alt-1";
const DAY = 24 * 60 * 60 * 1000;

test.beforeEach(async ({}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop", "Server behaviour is viewport-independent");
});

/** Registers through the API and marks the account as the legacy migration would. */
async function legacyAccount(page: Page, markedDaysAgo: number): Promise<string> {
  const email = `e2e-legacy-${Date.now()}-${markedDaysAgo}@test.invalid`;
  const res = await page.context().request.post("/api/auth/register", {
    headers: { Origin: test.info().project.use.baseURL! },
    data: { email, password: PASSWORD, name: "Altkonto" },
  });
  expect(res.status()).toBe(202);
  await sql(`UPDATE users SET email_verified_at = NULL, email_verification_legacy_at = $2 WHERE email = $1`, [
    email,
    new Date(Date.now() - markedDaysAgo * DAY),
  ]);
  return email;
}

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByPlaceholder("name@beispiel.de").fill(email);
  await page.getByPlaceholder("••••••••").fill(PASSWORD);
  await page.getByRole("button", { name: "Anmelden" }).last().click();
  await expect(page).toHaveURL(/\/dashboard/);
}

async function linkFromOutbox(page: Page, email: string): Promise<string> {
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

test.afterAll(async () => {
  await sql(`DELETE FROM users WHERE email LIKE 'e2e-legacy-%'`, []);
});

test("legacy account in the grace period logs in, keeps working and confirms from the notice", async ({ page }) => {
  const email = await legacyAccount(page, 1);
  await login(page, email);
  const notice = page.getByTestId("email-verification-notice");
  await expect(notice).toHaveAttribute("data-status", "legacy_grace");
  await expect(notice).toContainText("bis zum");

  await page.getByTestId("email-verification-send").click();
  await expect(page.getByTestId("email-verification-sent")).toBeVisible();
  await page.goto(await linkFromOutbox(page, email));
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByTestId("email-verification-notice")).toHaveCount(0);
});

test("after the deadline the data stays readable and exportable, saving waits for confirmation", async ({ page }) => {
  const email = await legacyAccount(page, 400);
  await login(page, email);
  await expect(page.getByTestId("email-verification-notice")).toHaveAttribute("data-status", "legacy_overdue");

  const origin = { Origin: test.info().project.use.baseURL! };
  const { CONSENT_PURPOSES } = await import("../src/lib/consent/purposes");
  const consent = await page.context().request.post("/api/consent", {
    headers: origin,
    data: { purpose: "sensitive_folder_storage", version: CONSENT_PURPOSES.sensitive_folder_storage.version, confirmed: true },
  });
  expect(consent.status()).toBe(201);
  expect((await page.context().request.get("/api/amanah")).status()).toBe(200);
  expect((await page.context().request.get("/api/account/export")).status()).toBe(200);
  const write = await page.context().request.patch("/api/amanah", { headers: origin, data: { notes: "neu" } });
  expect(write.status()).toBe(403);
  expect((await write.json()).code).toBe("email_verification_required");
});
