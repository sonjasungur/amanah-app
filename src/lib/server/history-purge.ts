import { purgeDeletionLedgerIfEnabled } from "./deletion-gate";
import { getServerRepository } from "./repository";

const DAY_MS = 24 * 60 * 60 * 1000;
export const PURGE_RETRY_MS = 15 * 60 * 1000;
let started = false;
let retryPending = false;

/** A class or code of the failure helps; its message could contain connection details. */
export function failureCode(error: unknown): string {
  const code = (error as { code?: unknown })?.code;
  if (typeof code === "string" && /^[A-Za-z0-9_]{1,40}$/.test(code)) return code;
  return error instanceof Error ? error.name : "unknown";
}

/** Logs a count only, never content or account ids. A failed run tries again soon, not only tomorrow. */
export async function runHistoryPurge(repo = getServerRepository()): Promise<number> {
  try {
    const purged = await repo.purgeExpiredDataVersions();
    if (purged > 0) console.info(`[history] removed ${purged} expired versions`);
    return purged;
  } catch (error) {
    console.error(`[history] removing expired versions failed (${failureCode(error)}), next try in 15 minutes`);
    if (!retryPending) {
      retryPending = true;
      setTimeout(() => {
        retryPending = false;
        void runHistoryPurge(repo);
      }, PURGE_RETRY_MS).unref();
    }
    return 0;
  }
}

function runDeletionLedgerPurge(): void {
  try {
    const purged = purgeDeletionLedgerIfEnabled();
    if (purged > 0) console.info(`[deletion-ledger] removed ${purged} expired entries`);
  } catch (error) {
    console.error(`[deletion-ledger] removing expired entries failed (${failureCode(error)})`);
  }
}

/**
 * Runs at server start and daily, also with the history switched off: expired versions must go,
 * including those of accounts that no longer write. It only ever deletes, it activates nothing.
 */
export function startHistoryPurge(): void {
  if (started) return;
  started = true;
  const run = () => {
    void runHistoryPurge();
    runDeletionLedgerPurge();
  };
  run();
  setInterval(run, DAY_MS).unref();
}
