-- Additive: one new empty table without personal data.
CREATE TABLE "deletion_ledger_anchor" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "epoch" INTEGER NOT NULL,
    "seq" INTEGER NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deletion_ledger_anchor_pkey" PRIMARY KEY ("id")
);
