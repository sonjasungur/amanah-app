-- AlterTable
ALTER TABLE "users" ADD COLUMN "email_verification_legacy_at" TIMESTAMP(3);

-- Supersedes the blanket confirmation in 20261030125505: accounts that existed before
-- e-mail confirmation are no longer treated as confirmed. They keep access during a grace
-- period and are asked to confirm (docs/strategy/19-email-bestaetigung-altkonten.md).
-- That migration set email_verified_at to exactly created_at for every existing account;
-- a real confirmation always happens later. Accounts created afterwards are not touched,
-- so new unconfirmed accounts still cannot log in.
UPDATE "users"
SET "email_verified_at" = NULL,
    "email_verification_legacy_at" = CURRENT_TIMESTAMP
WHERE "email_verified_at" = "created_at";
