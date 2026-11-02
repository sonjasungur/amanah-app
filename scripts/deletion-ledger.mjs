#!/usr/bin/env node
/**
 * Operator tool for the deletion ledger (src/lib/server/deletion-ledger.ts). Prints codes and
 * counts only, never pseudonyms or keys. Commands:
 *   status                         checks the ledger against head and database anchor
 *   verify                         the same without a database, e.g. before a restore
 *   lock | unlock                  restore lock; the application refuses to start while it is set
 *   replay --backup-taken-at=ISO   checks coverage and applies the deletions in one transaction
 *   purge                          removes entries past the retention
 *   accept-loss                    new epoch after a real loss; needs AMANAH_LEDGER_ACCEPT_LOSS=yes
 * Exit 0 = fine. Requires Node >= 22.18 / 24 (native TypeScript type stripping).
 */
import pg from "pg";

const {
  acceptLedgerLoss,
  anchorOf,
  ANCHOR_SQL,
  assertBackupCovered,
  isRestorePending,
  ledgerCoversFrom,
  lockForRestore,
  openLedger,
  purgeLedger,
  readLedgerConfig,
  replayDeletions,
  unlockAfterRestore,
  verifyLedger,
} = await import("../src/lib/server/deletion-ledger.ts");

const [command, ...args] = process.argv.slice(2);
const option = (name) => args.find((a) => a.startsWith(`--${name}=`))?.split("=").slice(1).join("=");

async function withDb(fn) {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5_000 });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

async function readAnchor(client) {
  const { rows } = await client.query("SELECT epoch, seq FROM deletion_ledger_anchor WHERE id = 1");
  return rows[0] ?? null;
}

async function main() {
  const config = readLedgerConfig(process.env);
  if (command === "lock") return lockForRestore(config);
  if (command === "unlock") return unlockAfterRestore(config);
  if (command === "purge") return console.log(JSON.stringify({ removed: purgeLedger(config) }));
  if (command === "accept-loss") {
    if (process.env.AMANAH_LEDGER_ACCEPT_LOSS !== "yes") {
      console.error("✗ accept-loss requires AMANAH_LEDGER_ACCEPT_LOSS=yes");
      process.exit(2);
    }
    const entries = await withDb(async (client) => {
      const created = acceptLedgerLoss(config, await readAnchor(client));
      const anchor = anchorOf(created);
      await client.query(ANCHOR_SQL, [anchor.epoch, anchor.seq]);
      return created;
    });
    return console.log(JSON.stringify({ epoch: entries[0].epoch, coversFrom: entries[0].coversFrom }));
  }
  if (command === "verify") {
    const entries = verifyLedger(config);
    return console.log(JSON.stringify({ entries: entries.length, restorePending: isRestorePending(config) }));
  }
  if (command === "status") {
    const entries = await withDb(async (client) => verifyLedger(config, await readAnchor(client)));
    return console.log(JSON.stringify({ entries: entries.length, coversFrom: entries.length ? ledgerCoversFrom(entries) : null, restorePending: isRestorePending(config) }));
  }
  if (command === "replay") {
    const takenAt = new Date(option("backup-taken-at") ?? "");
    if (Number.isNaN(takenAt.getTime())) {
      console.error("✗ replay requires --backup-taken-at=ISO-TIME");
      process.exit(2);
    }
    const result = await withDb(async (client) => {
      // The anchor comes from the restored backup and is older than the ledger: that is expected.
      const entries = openLedger(config, await readAnchor(client));
      assertBackupCovered(entries, takenAt);
      const db = {
        rows: async (sql) => (await client.query(sql)).rows,
        exec: async (sql, params) => (await client.query(sql, params)).rowCount ?? 0,
      };
      await client.query("BEGIN");
      try {
        const applied = await replayDeletions(db, config, entries);
        const again = await replayDeletions(db, config, entries);
        const left = again.accounts + again.folders + again.versions + again.consents;
        if (left !== 0) throw new Error("replay_not_stable");
        const anchor = anchorOf(entries);
        await client.query(ANCHOR_SQL, [anchor.epoch, anchor.seq]);
        await client.query("COMMIT");
        return applied;
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    });
    return console.log(JSON.stringify(result));
  }
  console.error("✗ unknown command");
  process.exit(2);
}

try {
  await main();
} catch (error) {
  // Codes only: messages of database errors can contain connection details.
  console.error(`✗ ${error?.code ?? error?.name ?? "unknown"}`);
  process.exit(1);
}
