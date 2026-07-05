/**
 * Postgres connection placeholder for Phase 2B+.
 * DATABASE_URL is read from env; no driver required until Phase 3.
 */
export type DbConnectionStatus = "not_configured" | "configured";

export function getDbConnectionStatus(): DbConnectionStatus {
  return process.env.DATABASE_URL ? "configured" : "not_configured";
}
