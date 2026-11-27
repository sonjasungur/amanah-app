import { defineConfig } from "prisma/config";

/**
 * Prisma 7 CLI configuration. The URL is read leniently so `prisma generate`
 * (Docker build, postinstall) works without a database; migrate commands need it.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: {
    url: process.env.DATABASE_URL ?? "",
    // Only needed for `prisma migrate diff --from-migrations` / `migrate dev` verification.
    ...(process.env.SHADOW_DATABASE_URL ? { shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL } : {}),
  },
});
