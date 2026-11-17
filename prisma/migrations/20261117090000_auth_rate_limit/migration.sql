-- Additive: one new table for login and registration limits. Holds keyed hashes and counters only.
CREATE TABLE "auth_rate_limits" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "window_start" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auth_rate_limits_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "auth_rate_limits_window_start_idx" ON "auth_rate_limits"("window_start");
