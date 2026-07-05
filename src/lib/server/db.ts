import { isDbConfigured } from "./config";

export type DbConnectionStatus = "not_configured" | "configured";

export function getDbConnectionStatus(): DbConnectionStatus {
  return isDbConfigured() ? "configured" : "not_configured";
}
