#!/usr/bin/env node
/**
 * Encrypts legacy plaintext rows in amanah_data and re-wraps rows to the active key.
 *
 * Default is a dry run (counts only). Writing requires BOTH:
 *   --apply   and   AMANAH_REENCRYPT_CONFIRM=yes
 * Never run against production without a backup and owner approval.
 * Optional: AMANAH_REENCRYPT_USER_IDS="id1,id2" limits the run to these users.
 * Output contains counts and row ids only — no plaintext, no keys.
 *
 * Requires Node >= 22.18 / 24 (native TypeScript type stripping for the shared module).
 */
import pg from "pg";

const { parseKeyring, reencryptStoredValue } = await import("../src/lib/server/data-encryption.ts");

const apply = process.argv.includes("--apply");
if (apply && process.env.AMANAH_REENCRYPT_CONFIRM !== "yes") {
  console.error("✗ --apply requires AMANAH_REENCRYPT_CONFIRM=yes");
  process.exit(2);
}

const keyring = parseKeyring(process.env);
if (!keyring) {
  console.error("✗ AMANAH_DATA_KEYS is not set");
  process.exit(2);
}

// Plain SQL via pg: only one table is touched, independent of the generated Prisma client.
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5_000 });
await client.connect();
const counts = { encrypt_plaintext: 0, rewrap: 0, unchanged: 0, failed: 0 };
try {
  const onlyUsers = process.env.AMANAH_REENCRYPT_USER_IDS?.split(",").map((s) => s.trim()).filter(Boolean);
  const { rows } = onlyUsers?.length
    ? await client.query("SELECT id, user_id, data FROM amanah_data WHERE user_id = ANY($1)", [onlyUsers])
    : await client.query("SELECT id, user_id, data FROM amanah_data");
  for (const row of rows) {
    try {
      const { action, value } = reencryptStoredValue(row.data, row.user_id, keyring);
      counts[action] += 1;
      if (apply && action !== "unchanged") {
        await client.query("UPDATE amanah_data SET data = $1, updated_at = now() WHERE id = $2", [JSON.stringify(value), row.id]);
      }
    } catch {
      counts.failed += 1;
      console.error(`✗ row ${row.id}: could not be processed (wrong key or damaged data)`);
    }
  }
  console.log(`${apply ? "applied" : "dry run"} · active key ${keyring.active} ·`, JSON.stringify(counts));
  process.exitCode = counts.failed > 0 ? 1 : 0;
} finally {
  await client.end();
}
