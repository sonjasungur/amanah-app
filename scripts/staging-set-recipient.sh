#!/usr/bin/env bash
# Sets the owner's backup recipient(s) for staging. Reads public age keys (age1...) from stdin so
# they never appear in shell history, process lists or chat; prints only a fingerprint.
#
#   age-keygen -y <owner key> | ssh <server> /opt/amanah-staging/scripts/staging-set-recipient.sh
#   (or: scripts/owner-backup-key.sh install-recipient on the owner's computer)
#
# Rejects anything that is not a public age key — in particular a private key (AGE-SECRET-KEY-…)
# pasted by mistake. Keeps a copy of the previous env file in rollback/.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
ENV_FILE="${ENV_FILE:-.env.staging}"

input="$(head -c 4096 | tr -d '\r')"
if grep -qi 'AGE-SECRET-KEY' <<<"$input"; then
  echo "Refused: this is a PRIVATE key. Only the public key (age1...) belongs on the server." >&2
  echo "The private key was not stored. Consider it exposed only if you pasted it somewhere else." >&2
  exit 1
fi
recipients="$(grep -v '^#' <<<"$input" | tr -s ' \t' '\n\n' | sed '/^$/d' | sort -u | tr '\n' ' ' | sed 's/ $//')"
if [[ -z "$recipients" ]]; then echo "Refused: no recipient on stdin." >&2; exit 1; fi
for r in $recipients; do
  if [[ ! "$r" =~ ^age1[02-9ac-hj-np-z]{58}$ ]]; then echo "Refused: not a public age key." >&2; exit 1; fi
done
check="$(grep -m1 '^RESTORE_CHECK_RECIPIENT=' ops.env 2>/dev/null | cut -d= -f2- || true)"
for r in $recipients; do
  if [[ -n "$check" && "$r" == "$check" ]]; then
    echo "Refused: that is the server's restore-check key, not the owner key." >&2
    exit 1
  fi
done
grep -q '^BACKUP_AGE_RECIPIENTS=' "$ENV_FILE" || { echo "Refused: $ENV_FILE has no BACKUP_AGE_RECIPIENTS line." >&2; exit 1; }

install -d -m 700 rollback
cp -p "$ENV_FILE" "rollback/$(basename "$ENV_FILE").$(date +%Y%m%d_%H%M%S)"
tmp="$(mktemp "$ENV_FILE.XXXXXX")"
chmod 600 "$tmp"
sed "s|^BACKUP_AGE_RECIPIENTS=.*|BACKUP_AGE_RECIPIENTS=$recipients|" "$ENV_FILE" > "$tmp"
cat "$tmp" > "$ENV_FILE"
rm -f "$tmp"

count="$(wc -w <<<"$recipients")"
fp="$(printf '%s' "$recipients" | sha256sum | cut -c1-16)"
echo "Owner backup recipient set ($count key(s)), fingerprint $fp."
echo "Compare on your computer: age-keygen -y <key file> | tr -d '\\n' | sha256sum | cut -c1-16"
echo "Restore proofs for the previous key no longer count; run a backup and the restore tests."
