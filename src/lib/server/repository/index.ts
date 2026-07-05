import { isPostgresStorage } from "../config";
import { memoryRepository } from "./memory-repository";
import { postgresRepository } from "./postgres-repository";
import type { ServerRepository } from "./types";

let cachedRepo: ServerRepository | null = null;

export function getServerRepository(): ServerRepository {
  if (!cachedRepo) {
    cachedRepo = isPostgresStorage() ? postgresRepository : memoryRepository;
  }
  return cachedRepo;
}

/** Reset cached repository (for tests) */
export function resetServerRepository(): void {
  cachedRepo = null;
}

export type { ServerRepository, RepositoryUser, RepositorySession } from "./types";
