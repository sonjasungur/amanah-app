#!/usr/bin/env node
/**
 * Visual acceptance screenshots — requires production build running on PLAYWRIGHT_PORT (default 3099).
 */
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

const PORT = process.env.PLAYWRIGHT_PORT ?? "3099";
const BASE = `http://127.0.0.1:${PORT}`;
const OUT = join(process.cwd(), "docs", "screenshots", new Date().toISOString().slice(0, 10));
const CHROME = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;

const DESKTOP_PAGES = [
  "/",
  "/check",
  "/wissen",
  "/wissen/notfallkarte",
  "/wissen/vorsorgevollmacht",
  "/wissen/janazah-wuensche",
  "/wissen/testament-erbe",
  "/wissen/digitaler-nachlass",
  "/wissen/sadaqa-jariya",
  "/wissen/barzakh",
  "/wissen/akhira-vorsorge",
];

function slugFromPath(path) {
  return path.replace(/\//g, "_").replace(/^_/, "") || "home";
}

async function shot(page, name) {
  await page.screenshot({ path: join(OUT, `${name}.png`), fullPage: true });
  console.log(`saved ${name}.png`);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch(
    CHROME ? { executablePath: CHROME } : {}
  );

  // Desktop
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    for (const path of DESKTOP_PAGES) {
      await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
      await shot(page, `${slugFromPath(path)}-desktop`);
    }
    await context.close();
  }

  // Mobile 390×844
  {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();

    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
    await shot(page, "home-mobile-390");

    await page.goto(`${BASE}/check`, { waitUntil: "networkidle" });
    await page.getByTestId("check-loading").waitFor({ state: "hidden", timeout: 8000 });
    await shot(page, "check-intro-mobile-390");

    await page.getByTestId("check-start").click();
    await page.waitForSelector('[data-testid="check-question-text"]', { timeout: 8000 });
    await shot(page, "check-question-mobile-390");

    await page.goto(`${BASE}/check`, { waitUntil: "networkidle" });
    await page.evaluate(() => {
      sessionStorage.setItem(
        "amanah-check-progress-v3",
        JSON.stringify({ index: 2, answers: { convert: true, married: false }, phase: "questions" })
      );
    });
    await page.reload({ waitUntil: "networkidle" });
    await page.getByTestId("check-loading").waitFor({ state: "hidden", timeout: 8000 });
    await page.waitForSelector('[data-testid="check-question-text"]', { timeout: 8000 });
    await shot(page, "check-resumed-mobile-390");

    await page.goto(`${BASE}/wissen`, { waitUntil: "networkidle" });
    await shot(page, "wissen-mobile-390");

    await page.goto(`${BASE}/wissen/notfallkarte`, { waitUntil: "networkidle" });
    await shot(page, "wissen-notfallkarte-mobile-390");

    await page.goto(`${BASE}/wissen/janazah-wuensche`, { waitUntil: "networkidle" });
    await shot(page, "wissen-janazah-wuensche-mobile-390");

    await page.goto(`${BASE}/wissen/testament-erbe`, { waitUntil: "networkidle" });
    await shot(page, "wissen-testament-erbe-mobile-390");

    // Source disclosure open
    await page.getByRole("button", { name: /Janazah beschleunigen|Qur'an|Hadith/i }).first().click();
    await shot(page, "wissen-testament-erbe-sources-open-mobile-390");

    await page.goto(`${BASE}/wissen/janazah-wuensche`, { waitUntil: "networkidle" });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);
    await shot(page, "wissen-janazah-cta-mobile-390");

    await context.close();
  }

  await browser.close();
  console.log(`Screenshots in ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
