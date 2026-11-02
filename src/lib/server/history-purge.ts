import { getServerRepository } from "./repository";

const DAY_MS = 24 * 60 * 60 * 1000;
let started = false;

/** Logs a count only, never content or account ids. */
export async function runHistoryPurge(repo = getServerRepository()): Promise<number> {
  try {
    const purged = await repo.purgeExpiredDataVersions();
    if (purged > 0) console.info(`[history] removed ${purged} expired versions`);
    return purged;
  } catch {
    console.error("[history] removing expired versions failed");
    return 0;
  }
}

/**
 * Runs at server start and daily, also with the history switched off: expired versions must go,
 * including those of accounts that no longer write. It only ever deletes, it activates nothing.
 */
export function startHistoryPurge(): void {
  if (started) return;
  started = true;
  void runHistoryPurge();
  setInterval(() => void runHistoryPurge(), DAY_MS).unref();
}
