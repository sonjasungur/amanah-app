export type ServerStorageMode = "memory" | "postgres";

export function getServerStorageMode(): ServerStorageMode {
  if (process.env.AMANAH_SERVER_STORAGE === "postgres" && process.env.DATABASE_URL) {
    return "postgres";
  }
  return "memory";
}

export function isPostgresStorage(): boolean {
  return getServerStorageMode() === "postgres";
}

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function getPublicAuthMode(): string {
  return process.env.NEXT_PUBLIC_AUTH_MODE === "api" ? "api" : "local";
}

export function getPublicStorageMode(): string {
  return process.env.NEXT_PUBLIC_STORAGE_MODE === "api" ? "api" : "local";
}
