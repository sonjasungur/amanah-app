/**
 * A change whose save is still on its way when the page is left must not be lost. The save request is
 * held in the browser, as a slow network or a busy device would, and the page is left meanwhile.
 * API-mode build (SECURITY_API_E2E=true, see security-session.spec.ts); synthetic account, outbox mail.
 */
import { expect, test, type Page } from "@playwright/test";

test.skip(process.env.SECURITY_API_E2E !== "true", "Requires an API-mode build (SECURITY_API_E2E=true)");

async function registerAndConsent(page: Page) {
  const email = `leave-${Date.now()}-${Math.floor(Math.random() * 1e6)}@test.invalid`;
  await page.goto("/register");
  await page.getByPlaceholder("name@beispiel.de").fill(email);
  await page.getByPlaceholder("••••••••").fill("e2e-passwort-1");
  await page.getByRole("button", { name: "Registrieren" }).click();
  await expect(page.getByTestId("auth-check-email")).toBeVisible();
  let link = "";
  await expect
    .poll(async () => {
      const { messages } = (await (await page.context().request.get(`/api/dev/outbox?to=${encodeURIComponent(email)}`)).json()) as {
        messages: { kind: string; text: string }[];
      };
      link = messages.filter((m) => m.kind === "verify_email").at(-1)?.text.match(/https?:\/\/\S+token=\S+/)?.[0] ?? "";
      return link;
    })
    .not.toBe("");
  await page.goto(link);
  await page.getByTestId("consent-checkbox").check();
  await page.getByTestId("consent-submit").click();
  await expect(page.getByTestId("consent-gate")).toHaveCount(0);
}

const accountName = async (page: Page) =>
  ((await (await page.context().request.get("/api/amanah")).json()) as { data: { emergencyCard: { name: string } } }).data.emergencyCard.name;

test("a change whose save is in flight when the page is left reaches the account and stays on screen", async ({ page }) => {
  await registerAndConsent(page);
  await page.goto("/dashboard/notfallkarte");
  const name = page.getByLabel("Name", { exact: true });
  await name.fill("Schon gespeichert");
  await expect.poll(() => accountName(page)).toBe("Schon gespeichert");

  await page.route("**/api/amanah", async (route) => {
    if (route.request().method() === "PUT") await new Promise((resolve) => setTimeout(resolve, 3_000));
    await route.continue().catch(() => undefined);
  });
  await name.fill("Waehrend des Speicherns verlassen");
  await page.waitForTimeout(700); // the save has started and is held
  await page.goto("/dashboard/vermoegen");
  await page.unroute("**/api/amanah");

  await expect.poll(() => accountName(page), { timeout: 10_000 }).toBe("Waehrend des Speicherns verlassen");
  await page.goto("/dashboard/notfallkarte");
  await expect(name).toHaveValue("Waehrend des Speicherns verlassen");
});
