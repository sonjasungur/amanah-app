#!/usr/bin/env node
/**
 * Read only: how many stored folders fall into which size class. Output contains counts only,
 * no ids, no content. Sizes are as stored: encrypted rows are about a third larger than the data.
 */
import pg from "pg";

const client = new pg.Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5_000 });
await client.connect();
try {
  await client.query("BEGIN READ ONLY");
  const { rows } = await client.query(`
    SELECT count(*)::int AS total,
           count(*) FILTER (WHERE size <= 1048576)::int AS "bis 1 MiB",
           count(*) FILTER (WHERE size > 1048576 AND size <= 2097152)::int AS "1 bis 2 MiB",
           count(*) FILTER (WHERE size > 2097152 AND size <= 2796203)::int AS "2 bis 2,67 MiB (verschlüsselt evtl. unter der Grenze)",
           count(*) FILTER (WHERE size > 2796203)::int AS "über 2,67 MiB",
           coalesce(max(size), 0)::int AS "größte Zeile in Byte"
    FROM (SELECT octet_length(data::text) AS size FROM amanah_data) sizes`);
  await client.query("COMMIT");
  console.log(JSON.stringify(rows[0], null, 2));
} finally {
  await client.end();
}
