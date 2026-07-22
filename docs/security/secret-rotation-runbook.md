# Secret rotation runbook — amanah-app

**No automatic rotation is performed by CI or agents.** This document is for trained operators.

## General procedure

1. Treat the credential as compromised.
2. Determine privilege scope and environments affected.
3. Review provider/application logs for abuse (without pasting secrets).
4. Create a replacement credential with least privilege.
5. Store it in the approved secret store / deployment secret mechanism.
6. Update applications and runtime configuration.
7. Verify functionality without printing secret values.
8. Revoke or disable the old credential.
9. Invalidate sessions/caches that may embed the old secret.
10. Document what was rotated (IDs/names only, never values).
11. Decide on git history cleanup using `history-cleanup-decision.md`.

## Repository-specific notes

- No RED tracked secrets found in current index after scan.
- Rotate any historically exposed credentials if present in local untracked env files (manual).

## Provider checklist

| Provider | Status in this repo | Where to revoke | Replacement guidance |
| --- | --- | --- | --- |
| AWS IAM | MANUAL_VERIFICATION_REQUIRED | AWS IAM console / CLI | New access key or role; least privilege |
| AWS SES SMTP | POSSIBLE | IAM user / SMTP credentials | Recreate SMTP user; update env |
| Brevo | POSSIBLE | Brevo API keys UI | Create new key; delete old |
| PostgreSQL | POSSIBLE | DB role / hosting panel | Rotate password; update `DATABASE_URL` |
| Redis | POSSIBLE | Redis ACL / host panel | Rotate password |
| Supabase | POSSIBLE | Supabase project API settings | Rotate service role / anon as needed |
| GitHub | POSSIBLE | GitHub settings → tokens / apps | Fine-scoped PAT or GitHub App |
| GitLab | POSSIBLE | GitLab settings → access tokens | Rotate project/group token |
| Hetzner | POSSIBLE | Hetzner Cloud tokens / SSH | New token or SSH key |
| Apple Developer | POSSIBLE | Apple Developer / App Store Connect | Certificates & keys rotation |
| Android Signing | POSSIBLE | Local keystore process | New upload key only via Play process |
| Firebase | POSSIBLE | Firebase console service accounts | New SA key; disable old |
| OAuth Clients | POSSIBLE | Provider app settings | New client secret |
| Stripe / payments | POSSIBLE | Stripe dashboard → API keys | Roll restricted keys; webhook secrets |

Status values: `CONFIRMED` · `POSSIBLE` · `NOT_DETECTED` · `MANUAL_VERIFICATION_REQUIRED`

## Validation without secret disclosure

- Prefer health endpoints and non-destructive read checks.
- Confirm configuration keys exist without printing values.
- Keep CI using synthetic credentials only.
