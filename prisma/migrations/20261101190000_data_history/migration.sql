-- Additive: one new empty table. Existing tables and rows stay untouched.
CREATE TABLE "amanah_data_versions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "change_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "amanah_data_versions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "amanah_data_versions_created_at_idx" ON "amanah_data_versions"("created_at");

CREATE UNIQUE INDEX "amanah_data_versions_user_id_seq_key" ON "amanah_data_versions"("user_id", "seq");

ALTER TABLE "amanah_data_versions" ADD CONSTRAINT "amanah_data_versions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
