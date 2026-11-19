import {
  ANCHOR_SQL,
  anchorOf,
  cancelDeletion,
  isDeletionLedgerEnabled,
  isRestorePending,
  LedgerError,
  openLedger,
  purgeLedger,
  readLedgerConfig,
  recordDeletion,
  replayDeletions,
  type DeletionEvent,
  type LedgerAnchor,
  type LedgerConfig,
} from "./deletion-ledger";
import { isPostgresStorage } from "./config";
import type { ServerRepository } from "./repository/types";

async function readAnchor(): Promise<LedgerAnchor | null> {
  const { prisma } = await import("./prisma");
  return prisma.deletionLedgerAnchor.findUnique({ where: { id: 1 }, select: { epoch: true, seq: true } });
}

/**
 * Before the application accepts requests: checks the ledger and applies it. Repeating this is
 * harmless, so a normal start and the start after a restore are the same path. Anything unclear
 * stops the start: no service is better than deleted data coming back.
 */
export async function enforceDeletionLedger(): Promise<void> {
  if (!isDeletionLedgerEnabled()) return;
  const config = readLedgerConfig();
  if (isRestorePending(config)) throw new LedgerError("restore_pending");
  if (!isPostgresStorage()) {
    openLedger(config);
    return;
  }
  const { prisma } = await import("./prisma");
  const entries = openLedger(config, await readAnchor());
  await prisma.$transaction(async (tx) => {
    const db = {
      rows: (sql: string) => tx.$queryRawUnsafe<{ id: string }[]>(sql),
      exec: (sql: string, params: unknown[]) => tx.$executeRawUnsafe(sql, ...params),
    };
    const result = await replayDeletions(db, config, entries);
    const anchor = anchorOf(entries);
    await tx.$executeRawUnsafe(ANCHOR_SQL, anchor.epoch, anchor.seq);
    const changed = result.accounts + result.folders + result.versions + result.consents;
    if (changed > 0) console.info(`[deletion-ledger] applied: ${JSON.stringify(result)}`);
  });
}

async function moveAnchor(repo: ServerRepository, seq: number, epoch: number): Promise<void> {
  try {
    await repo.setDeletionLedgerAnchor?.({ epoch, seq });
  } catch {
    // Only an additional check; the head file still holds the position.
    console.error("[deletion-ledger] anchor not updated");
  }
}

/**
 * Every deletion is recorded first and goes ahead only then. If recording fails, nothing is
 * deleted and the caller gets an error to retry; if deleting fails, the record is cancelled.
 */
export function withDeletionLedger(repo: ServerRepository, config: LedgerConfig): ServerRepository {
  const guarded = async <T>(events: DeletionEvent[], action: () => Promise<T>, succeeded: (value: T) => boolean = () => true): Promise<T> => {
    const entries = events.map((event) => recordDeletion(config, event));
    const cancelAll = () => entries.forEach((entry) => cancelDeletion(config, entry.seq));
    let value: T;
    try {
      value = await action();
    } catch (error) {
      cancelAll();
      throw error;
    }
    if (!succeeded(value)) cancelAll();
    const last = entries.at(-1);
    if (last) await moveAnchor(repo, last.seq, last.epoch);
    return value;
  };

  const wrapped: ServerRepository = Object.create(repo);
  wrapped.deleteUser = (userId) => guarded([{ kind: "account_deleted", userId }], () => repo.deleteUser(userId));
  wrapped.deleteAmanahData = (userId) => guarded([{ kind: "folder_deleted", userId }], () => repo.deleteAmanahData(userId));
  wrapped.deleteDataVersions = (userId) => guarded([{ kind: "history_deleted", userId }], () => repo.deleteDataVersions(userId));
  wrapped.revokeConsent = (userId, purpose) => guarded([{ kind: "consent_withdrawn", userId, purpose }], () => repo.revokeConsent(userId, purpose));
  wrapped.deleteDataVersionsUpTo = async (userId, versionId) => {
    const target = await repo.getDataVersion(userId, versionId);
    // Foreign or expired: nothing to record. The repository answers as before.
    if (!target) return repo.deleteDataVersionsUpTo(userId, versionId);
    return guarded(
      [{ kind: "history_deleted", userId, upTo: new Date(target.createdAt) }],
      () => repo.deleteDataVersionsUpTo(userId, versionId),
      (deleted) => deleted,
    );
  };
  return wrapped;
}

export function purgeDeletionLedgerIfEnabled(): number {
  return isDeletionLedgerEnabled() ? purgeLedger(readLedgerConfig()) : 0;
}
