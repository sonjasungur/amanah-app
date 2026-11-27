import { expect, test } from "@playwright/test";

/**
 * Contact form (owner order 23.11.2026) against an API-mode build with the in-memory outbox, no real mail.
 * Same setup as security-session.spec.ts (SESSION_SECRET, AMANAH_MAIL_TRANSPORT=outbox, AMANAH_INTERNAL_TOOLS=true).
 */
test.skip(process.env.SECURITY_API_E2E !== "true", "Requires an API-mode build (SECURITY_API_E2E=true)");

test.describe("contact form", () => {
  test("footer leads to the form; a message reaches the imprint address with Reply-To; wrong input is explained", async ({ page }) => {
    await page.goto("/");
    await page.locator("footer").getByRole("link", { name: "Kontakt" }).click();
    await expect(page).toHaveURL(/\/kontakt/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Kontakt");
    await expect(page.getByTestId("contact-privacy")).toContainText("nicht in der App gespeichert");

    await page.getByLabel("E-Mail-Adresse für die Antwort").fill("kein-at");
    await page.getByLabel("Deine Nachricht").fill("Eine Frage zum Vorsorge-Check.");
    await page.getByTestId("contact-submit").click();
    await expect(page.getByText("Bitte gib eine gültige E-Mail-Adresse an")).toBeVisible();

    const sender = `e2e-${Date.now()}@example.org`;
    await page.getByLabel("E-Mail-Adresse für die Antwort").fill(sender);
    await page.getByLabel(/^Name/).fill("E2E Test");
    await page.getByLabel("Worum geht es?").selectOption("fehler");
    await page.getByTestId("contact-submit").click();
    await expect(page.getByTestId("contact-sent")).toContainText("Danke für deine Nachricht.");

    const { messages } = (await (await page.request.get("/api/dev/outbox")).json()) as { messages: { kind: string; replyTo?: string; subject: string; to: string; text: string }[] };
    const mail = messages.filter((m) => m.kind === "contact" && m.replyTo === sender).at(-1);
    expect(mail?.subject).toBe("Kontaktformular Wasiyya: Fehler melden");
    expect(mail?.to).toContain("@");
    expect(mail?.text).toContain("Eine Frage zum Vorsorge-Check.");
    expect(messages.some((m) => m.to === sender)).toBe(false);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  });

  test("imprint offers the form as a second contact route", async ({ page }) => {
    await page.goto("/impressum");
    await page.getByRole("link", { name: "Kontaktformular öffnen" }).click();
    await expect(page).toHaveURL(/\/kontakt/);
  });
});
