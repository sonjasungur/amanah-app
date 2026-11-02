#!/usr/bin/env node
/**
 * Removes history versions past their retention, for accounts that no longer write.
 *
 * Default is a dry run (count only). Deleting requires BOTH:
 *   --apply   and   AMANAH_PURGE_CONFIRM=yes
 * Not scheduled anywhere yet. Output contains counts only.
 */
import pg from "pg";

const RETENTION_DAYS = 90;

const apply = process.argv.includes("--apply");
if (apply && process.env.AMANAH_PURGE_CONFIRM !== "yes") {
  console.error("✗ --apply requires AMANAH_PURGE_CONFIRM=yes");
  process.exit(2);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5_000 });
await client.connect();
try {
  const where = `created_at < now() - make_interval(days => ${RETENTION_DAYS})`;
  const { rows } = await client.query(`SELECT count(*)::int AS expired FROM amanah_data_versions WHERE ${where}`);
  if (apply) await client.query(`DELETE FROM amanah_data_versions WHERE ${where}`);
  console.log(`${apply ? "deleted" : "dry run"} · expired versions: ${rows[0].expired}`);
} finally {
  await client.end();
}
