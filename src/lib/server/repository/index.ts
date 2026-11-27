import { isPostgresStorage } from "../config";
import { memoryRepository } from "./memory-repository";
import { postgresRepository } from "./postgres-repository";
import type { ServerRepository } from "./types";
import { isDeletionLedgerEnabled, readLedgerConfig } from "../deletion-ledger";
import { withDeletionLedger } from "../deletion-gate";

let cachedRepo: ServerRepository | null = null;

export function getServerRepository(): ServerRepository {
  if (!cachedRepo) {
    const repo = isPostgresStorage() ? postgresRepository : memoryRepository;
    cachedRepo = isDeletionLedgerEnabled() ? withDeletionLedger(repo, readLedgerConfig()) : repo;
  }
  return cachedRepo;
}

/** Reset cached repository (for tests) */
export function resetServerRepository(): void {
  cachedRepo = null;
}

export type { ServerRepository, RepositoryUser, RepositorySession } from "./types";
