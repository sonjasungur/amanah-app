-- Additive: one new empty table without personal data. Initialised per environment by scripts/key-reference.mjs.
CREATE TABLE "data_key_references" (
    "kid" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retired_at" TIMESTAMP(3),

    CONSTRAINT "data_key_references_pkey" PRIMARY KEY ("kid")
);
