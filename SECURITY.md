# Security Policy — amanah-app

## Supported versions

Security fixes are accepted for the actively maintained `main` branch and currently supported release branches.

## Reporting a vulnerability

Do **not** open a public issue for security vulnerabilities or include secrets in issues, merge requests, or chat.

Contact: `SECURITY_CONTACT_TO_BE_CONFIGURED`

Include impact, affected component, and reproduction steps without secret values.

## Secrets

- Never commit `.env`, credential exports, private keys, keystores, or service-account JSON.
- Use `.env.example` / `.env.*.example` with clearly invalid placeholders only (`CHANGE_ME`, `example.invalid`, `replace-with-local-secret`).
- Do not put productive data in fixtures or tracked backups.
- Local `.env` files stay on the developer machine or a secret store.

## Secret rotation

Follow `docs/security/secret-rotation-runbook.md`.

If a secret was committed:

1. Treat it as compromised.
2. Rotate at the provider.
3. Remove it from the git index on a security branch.
4. Decide on history cleanup only after rotation (see `docs/security/history-cleanup-decision.md`).

## Logging and redaction

Logs, CI output, and error messages must not contain secrets, tokens, raw credentials, or full connection strings with passwords.

## Incident response

Escalate suspected exposure immediately using the contact above and the rotation runbook. Preserve evidence without copying secret values into tickets.

## Dependencies and updates

Keep dependencies updated; review CI dependency/security jobs where present.

## Release and deployment approvals

Production deployment and secret rotation are RED actions and require explicit human approval. This repository's security MRs must not deploy to production by themselves.

## Accidental commit of secrets

1. Do not push additional copies.
2. Rotate credentials.
3. Remove from index.
4. Open/notify via private security channel.
5. Do not perform history rewrite without coordinated approval.

