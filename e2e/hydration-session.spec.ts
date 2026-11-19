/**
 * The session hint lies in the browser only. Pages must not render differently from the server
 * because of it (React error 418). Runs in every build.
 */
import { expect, test } from "@playwright/test";

const PAGES = ["/", "/check", "/wissen", "/dashboard", "/dashboard/notfallkarte", "/dashboard/janazah", "/dashboard/einstellungen", "/dashboard/pdf"];
const SESSION = {
  user: { id: "hydration-test", email: "hydration@test.invalid", name: "Test" },
  expiresAt: "2099-01-01T00:00:00.000Z",
};

test("a stored session hint causes no hydration mismatch", async ({ page }) => {
  test.setTimeout(60_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(`${page.url()}: ${error.message.slice(0, 120)}`));
  await page.addInitScript((session) => localStorage.setItem("amanah-auth-session", JSON.stringify(session)), SESSION);
  for (const path of PAGES) {
    await page.goto(path);
    await page.waitForTimeout(400);
  }
  expect(errors).toEqual([]);
});
