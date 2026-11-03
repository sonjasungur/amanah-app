/**
 * A stored folder that cannot be decrypted: real servers on one database, one with the right key and
 * others with a wrong or without a key. Synthetic account only. API-mode build on Postgres with the
 * mail outbox and FOLDER_FAULT_E2E=true; the environment of the running server is inherited.
 */
import { spawn, type ChildProcess } from "node:child_process";
import { randomBytes } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import pg from "pg";

test.skip(process.env.FOLDER_FAULT_E2E !== "true", "Requires an API-mode build on Postgres with FOLDER_FAULT_E2E=true");
test.describe.configure({ mode: "serial" });
test.setTimeout(180_000);

const FAULT_PORT = 3098;
const FAULT = `http://127.0.0.1:${FAULT_PORT}`;
const FIELD = "#location-vorsorgevollmacht";
const VALUE = "Synthetisch im Wohnzimmer";
const PASSWORD = "e2e-passwort-1";

async function startFaultServer(keys: string): Promise<ChildProcess> {
  const kid = process.env.AMANAH_DATA_KEY_ACTIVE ?? "t";
  const env = { ...process.env, PORT: String(FAULT_PORT), AMANAH_DATA_KEYS: keys ? `${kid}:${keys}` : "", AMANAH_DATA_ENCRYPTION: "required", AMANAH_PUBLIC_BASE_URL: FAULT };
  const server = spawn("npx", ["next", "start", "-p", String(FAULT_PORT)], { env, stdio: "ignore", detached: true });
  await expect.poll(async () => fetch(`${FAULT}/api/health`).then((r) => r.status).catch(() => 0), { timeout: 60_000 }).toBeGreaterThan(0);
  return server;
}

async function stopFaultServer(server: ChildProcess) {
  // Not the graceful way: open connections of the test's browsers can keep it answering for long.
  if (server.pid) process.kill(-server.pid, "SIGKILL");
  await expect.poll(async () => fetch(`${FAULT}/api/health`).then(() => true).catch(() => false), { timeout: 20_000 }).toBe(false);
}

/** Every write the page itself sends to the folder. */
function watchWrites(page: Page): string[] {
  const writes: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/api/amanah" && request.method() !== "GET") writes.push(request.method());
  });
  return writes;
}

test("no path writes over a folder that cannot be decrypted", async ({ page, baseURL }) => {
  const email = `fault-${Date.now()}-${Math.floor(Math.random() * 1e6)}@test.invalid`;
  const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  const rowHash = async () => {
    const { rows } = await db.query("SELECT md5(a.data::text) AS hash FROM amanah_data a JOIN users u ON u.id = a.user_id WHERE u.email = $1", [email]);
    return rows[0]?.hash as string;
  };

  try {
    await test.step("create and read with the right key", async () => {
      await page.goto("/register");
      await page.getByPlaceholder("name@beispiel.de").fill(email);
      await page.getByPlaceholder("••••••••").fill(PASSWORD);
      await page.getByRole("button", { name: "Registrieren" }).click();
      await expect(page.getByTestId("auth-check-email")).toBeVisible();
      let link = "";
      await expect
        .poll(async () => {
          const { messages } = (await (await page.context().request.get(`/api/dev/outbox?to=${encodeURIComponent(email)}`)).json()) as { messages: { kind: string; text: string }[] };
          link = messages.filter((m) => m.kind === "verify_email").at(-1)?.text.match(/https?:\/\/\S+token=\S+/)?.[0] ?? "";
          return link;
        })
        .not.toBe("");
      await page.goto(link);
      await page.getByTestId("consent-checkbox").check();
      await page.getByTestId("consent-submit").click();
      await expect(page.getByTestId("consent-gate")).toHaveCount(0);
      await page.goto("/dashboard/dokumente");
      await page.locator(FIELD).fill(VALUE);
      await expect.poll(async () => JSON.stringify((await (await page.context().request.get("/api/amanah")).json()).data.documents)).toContain(VALUE);
      await expect.poll(rowHash).toBeTruthy();
    });
    const hash = await rowHash();

    for (const [name, key] of [
      ["wrong key", randomBytes(32).toString("base64")],
      ["no key", ""],
    ]) {
      await test.step(`${name}: browser and direct calls change nothing`, async () => {
        const server = await startFaultServer(key);
        try {
          const faulty = await page.context().newPage();
          const writes = watchWrites(faulty);
          // Signing in on this origin: the first read of the folder after a normal login.
          await faulty.goto(`${FAULT}/login?returnUrl=${encodeURIComponent("/dashboard/dokumente")}`);
          await faulty.getByPlaceholder("name@beispiel.de").fill(email);
          await faulty.getByPlaceholder("••••••••").fill(PASSWORD);
          await faulty.getByRole("button", { name: "Anmelden" }).last().click();
          await expect(faulty.getByTestId("folder-problem")).toBeVisible();
          await expect(faulty.getByTestId("folder-problem")).toContainText("nicht verändert");
          // No empty form that looks like a new start, nothing to type over.
          await expect(faulty.locator(FIELD)).toHaveCount(0);

          await faulty.getByTestId("folder-problem-retry").click();
          await expect(faulty.getByTestId("folder-problem")).toBeVisible();
          await faulty.waitForTimeout(1_500);
          await faulty.close({ runBeforeUnload: true });
          expect(writes).toEqual([]);

          const request = page.context().request;
          const headers = { Origin: FAULT, "Content-Type": "application/json" };
          for (const call of [
            () => request.get(`${FAULT}/api/amanah`),
            () => request.put(`${FAULT}/api/amanah`, { headers, data: {} }),
            () => request.patch(`${FAULT}/api/amanah`, { headers, data: { documents: [] } }),
            () => request.delete(`${FAULT}/api/amanah`, { headers }),
            () => request.get(`${FAULT}/api/account/export`),
          ]) {
            const response = await call();
            expect(response.status()).toBe(503);
            expect((await response.json()).code).toBe("folder_unreadable");
          }
          expect(await rowHash()).toBe(hash);
        } finally {
          await stopFaultServer(server);
        }
      });
    }

    await test.step("wrong key and an account without any data: found before the first save", async () => {
      const server = await startFaultServer(randomBytes(32).toString("base64"));
      const fresh = `fault-new-${Date.now()}-${Math.floor(Math.random() * 1e6)}@test.invalid`;
      const empty = await page.context().browser()!.newContext();
      try {
        // Created on the healthy server, without a folder row.
        const registered = await empty.request.post("/api/auth/register", { headers: { Origin: baseURL! }, data: { email: fresh, password: PASSWORD, name: "Leer" } });
        expect(registered.ok()).toBe(true);
        await db.query("UPDATE users SET email_verified_at = now() WHERE email = $1", [fresh]);
        const first = await empty.newPage();
        await first.goto(`${FAULT}/login?returnUrl=${encodeURIComponent("/dashboard/dokumente")}`);
        await first.getByPlaceholder("name@beispiel.de").fill(fresh);
        await first.getByPlaceholder("••••••••").fill(PASSWORD);
        await first.getByRole("button", { name: "Anmelden" }).last().click();
        await expect(first.getByTestId("folder-problem")).toBeVisible();
        await expect(first.locator(FIELD)).toHaveCount(0);
        const put = await empty.request.put(`${FAULT}/api/amanah`, { headers: { Origin: FAULT, "Content-Type": "application/json" }, data: {} });
        expect((await put.json()).code).toBe("folder_unreadable");
        const { rows } = await db.query("SELECT count(*)::int AS n FROM amanah_data a JOIN users u ON u.id = a.user_id WHERE u.email = $1", [fresh]);
        expect(rows[0].n).toBe(0);
      } finally {
        await empty.close();
        await stopFaultServer(server);
      }
    });

    await test.step("right key again: unchanged data, regular saving", async () => {
      await page.goto("/dashboard/dokumente");
      await expect(page.locator(FIELD)).toHaveValue(VALUE);
      expect(await rowHash()).toBe(hash);
      await page.locator(FIELD).fill(`${VALUE} geaendert`);
      await expect.poll(rowHash).not.toBe(hash);
      await page.reload();
      await expect(page.locator(FIELD)).toHaveValue(`${VALUE} geaendert`);
    });

    await test.step("a save rejected in an open page locks the page, and checking again brings it back", async () => {
      const before = await rowHash();
      let reject = true;
      await page.route(`${baseURL}/api/amanah`, async (route) => {
        if (reject) {
          await route.fulfill({ status: 503, json: { code: "folder_unreadable", error: "Nicht verändert." } });
        } else {
          await route.continue();
        }
      });
      await page.locator(FIELD).fill("Darf nicht ankommen");
      await expect(page.getByTestId("folder-problem")).toBeVisible();
      await expect(page.locator(FIELD)).toHaveCount(0);
      expect(await rowHash()).toBe(before);
      reject = false;
      await page.getByTestId("folder-problem-retry").click();
      await expect(page.getByTestId("folder-problem")).toHaveCount(0);
      await page.unroute(`${baseURL}/api/amanah`);
    });

    await test.step("any other failed read is no empty folder either", async () => {
      await page.reload();
      await expect(page.locator(FIELD)).toBeVisible();
      await page.locator(FIELD).fill(`${VALUE} stabil`);
      await expect.poll(async () => JSON.stringify((await (await page.context().request.get("/api/amanah")).json()).data.documents)).toContain("stabil");
      const before = await rowHash();
      let fail = true;
      await page.route(`${baseURL}/api/amanah`, (route) => (fail && route.request().method() === "GET" ? route.fulfill({ status: 500, body: "{}" }) : route.continue()));
      const writes = watchWrites(page);
      await page.reload();
      await expect(page.getByTestId("folder-problem")).toContainText("nicht geladen");
      await expect(page.locator(FIELD)).toHaveCount(0);
      await page.waitForTimeout(1_000);
      expect(writes).toEqual([]);
      fail = false;
      await page.getByTestId("folder-problem-retry").click();
      await expect(page.locator(FIELD)).toHaveValue(`${VALUE} stabil`);
      expect(await rowHash()).toBe(before);
      await page.unroute(`${baseURL}/api/amanah`);
    });
  } finally {
    await db.end();
  }
});
