#!/usr/bin/env node
/**
 * The key reference of this environment: proves that the configured data keys are the right ones,
 * independent of user data, so also with an empty database.
 *
 *   node scripts/key-reference.mjs check          read-only. Exit 0 valid, 1 not valid, 2 could not run
 *   node scripts/key-reference.mjs init           first time only; refuses if a reference exists
 *   node scripts/key-reference.mjs add            reference for a new key, only if all existing ones open
 *   node scripts/key-reference.mjs retire <kid>   key no longer needed, only if no row still uses it
 *
 * Writing needs AMANAH_KEY_REFERENCE_CONFIRM=yes. There is deliberately no command that replaces a
 * reference: if the check fails, the configuration is wrong until proven otherwise.
 * Output holds statuses, counts and key ids only — no keys, no user data.
 *
 * Requires Node >= 22.18 / 24 (native TypeScript type stripping for the shared module).
 */
import pg from "pg";

const { checkKeyReferences, decryptJson, isEncryptedEnvelope, parseKeyring, sealKeyReference } = await import("../src/lib/server/data-encryption.ts");

const [command, argument] = process.argv.slice(2);
if (!["check", "init", "add", "retire"].includes(command) || (command === "retire" && !argument)) {
  console.error("usage: key-reference.mjs check | init | add | retire <kid>");
  process.exit(2);
}
if (command !== "check" && process.env.AMANAH_KEY_REFERENCE_CONFIRM !== "yes") {
  console.error(`✗ ${command} requires AMANAH_KEY_REFERENCE_CONFIRM=yes`);
  process.exit(2);
}

const refuse = (message) => {
  console.error(`✗ ${message}`);
  process.exitCode = 1;
};

const client = new pg.Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5_000 });
try {
  await client.connect();
  const readRows = async () => (await client.query('SELECT kid, data, retired_at AS "retiredAt" FROM data_key_references')).rows;

  if (command === "check") {
    const { status, kid } = checkKeyReferences(await readRows(), process.env);
    console.log(`key reference: ${status}${kid ? ` (key id ${kid})` : ""}`);
    process.exitCode = status === "ok" ? 0 : 1;
  } else {
    const keyring = parseKeyring(process.env);
    if (!keyring) throw new Error("no keys");
    await client.query("BEGIN");
    await client.query("LOCK TABLE data_key_references IN EXCLUSIVE MODE");
    const rows = await readRows();
    const known = new Set(rows.map((row) => row.kid));
    const insert = async (kid) => {
      await client.query("INSERT INTO data_key_references (kid, data) VALUES ($1, $2)", [kid, JSON.stringify(sealKeyReference(kid, keyring))]);
      console.log(`key reference: created for key id ${kid}`);
    };

    if (command === "init") {
      if (rows.length > 0) {
        refuse("a reference already exists and is never replaced");
      } else {
        // Stored data decides, if there is any: a key that cannot open it must not become the reference.
        const unreadable = await unreadableRows(keyring);
        if (unreadable > 0) refuse(`${unreadable} stored rows cannot be opened with these keys`);
        else await insert(keyring.active);
      }
    } else if (command === "add") {
      const { status, kid } = checkKeyReferences(rows, process.env);
      const newKids = [...keyring.keys.keys()].filter((id) => !known.has(id));
      if (rows.length === 0) refuse("not initialized, use init");
      else if (status !== "ok" && status !== "active_key_without_reference") refuse(`existing references do not open: ${status}${kid ? ` (key id ${kid})` : ""}`);
      else if (newKids.length === 0) refuse("no new key id configured");
      else for (const id of newKids) await insert(id);
    } else {
      const { status } = checkKeyReferences(rows, process.env);
      const inUse = await rowsUsingKey(argument);
      if (status !== "ok") refuse(`check is not ok: ${status}`);
      else if (argument === keyring.active) refuse("the active key cannot be retired");
      else if (!rows.some((row) => row.kid === argument && !row.retiredAt)) refuse("no current reference with this key id");
      else if (inUse > 0) refuse(`${inUse} stored rows still use this key, run reencrypt-amanah-data.mjs first`);
      else {
        await client.query("UPDATE data_key_references SET retired_at = now() WHERE kid = $1", [argument]);
        console.log(`key reference: retired key id ${argument}`);
      }
    }
    await client.query(process.exitCode ? "ROLLBACK" : "COMMIT");
  }
} catch {
  // The driver's messages can hold connection details.
  console.error("✗ key reference could not be processed (database or configuration)");
  process.exitCode = 2;
} finally {
  await client.end().catch(() => undefined);
}

async function unreadableRows(keyring) {
  let unreadable = 0;
  for (const table of ["amanah_data", "amanah_data_versions"]) {
    const { rows } = await client.query(`SELECT user_id, data FROM ${table} WHERE data ? '$enc'`);
    for (const row of rows) {
      try {
        if (!isEncryptedEnvelope(row.data)) throw new Error("format");
        decryptJson(row.data, row.user_id, keyring);
      } catch {
        unreadable += 1;
      }
    }
  }
  return unreadable;
}

async function rowsUsingKey(kid) {
  let count = 0;
  for (const table of ["amanah_data", "amanah_data_versions"]) {
    const { rows } = await client.query(`SELECT count(*)::int AS n FROM ${table} WHERE data->>'kid' = $1`, [kid]);
    count += rows[0].n;
  }
  return count;
}
