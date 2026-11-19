#!/usr/bin/env bash
# Owner's backup key for Amanah staging — run on YOUR computer, never on the server (docs 29 §2).
# The private key is created and kept by the owner; only the public key reaches the server.
# Nothing this script prints contains the private key.
#
#   scripts/owner-backup-key.sh create [key-file]            create the key pair (default ~/amanah-keys/amanah-staging-backup.key)
#   scripts/owner-backup-key.sh fingerprint [key-file]       short fingerprint of the public key
#   scripts/owner-backup-key.sh install-recipient [key-file] send ONLY the public key to the server
#   scripts/owner-backup-key.sh restore-test [key-file|--paste]
#       decrypt the newest staging backup here and restore it into a throw-away DB on the server;
#       --paste reads the AGE-SECRET-KEY line from the password manager without echo into RAM
#
# Server: AMANAH_STAGING_HOST (default gemeinsam1-prod, as in ~/.ssh/config). Needs age (apt install age).
set -euo pipefail

HOST="${AMANAH_STAGING_HOST:-gemeinsam1-prod}"
REMOTE_DIR="/opt/amanah-staging"
DEFAULT_KEY="$HOME/amanah-keys/amanah-staging-backup.key"
CMD="${1:-}"
KEY="${2:-$DEFAULT_KEY}"

need() { command -v "$1" >/dev/null 2>&1 || { echo "Missing '$1' — install it first: sudo apt install age" >&2; exit 1; }; }
fingerprint() { age-keygen -y "$1" | tr -d '\n' | sha256sum | cut -c1-16; }

# A key must not end up in a repository or a synced cloud folder.
unsafe_location() {
  local d
  d="$(cd "$(dirname "$1")" && pwd)"
  case "$d" in
    *Dropbox*|*Nextcloud*|*ownCloud*|*OneDrive*|*"Google Drive"*|*GoogleDrive*|*Seafile*|*Syncthing*|*iCloud*)
      echo "a synced cloud folder ($d)"; return 0 ;;
  esac
  while [[ "$d" != "/" ]]; do
    [[ -e "$d/.git" ]] && { echo "a Git repository ($d)"; return 0; }
    d="$(dirname "$d")"
  done
  return 1
}

case "$CMD" in
  create)
    need age-keygen
    [[ -e "$KEY" ]] && { echo "Refused: $KEY already exists — never overwrite a backup key." >&2; exit 1; }
    umask 077
    mkdir -p "$(dirname "$KEY")"
    if where="$(unsafe_location "$KEY")"; then echo "Refused: $KEY is inside $where." >&2; exit 1; fi
    age-keygen -o "$KEY" 2>/dev/null
    chmod 600 "$KEY"
    echo "Key pair created: $KEY (mode 600). Public key fingerprint: $(fingerprint "$KEY")"
    cat <<EOF

Next steps (docs 29 §2.2):
  1. Store the WHOLE file content in your password manager (secure note "Amanah Staging Backup-Schlüssel").
  2. Make an offline copy (printout or encrypted USB stick), kept apart from this computer.
  3. $0 install-recipient "$KEY"
  4. Tell Claude "Empfänger gesetzt" plus the fingerprint — never the key itself.
  5. After the first restore test passed: shred -u "$KEY"  (later tests: restore-test --paste)
EOF
    ;;
  fingerprint)
    need age-keygen
    fingerprint "$KEY"
    ;;
  install-recipient)
    need age-keygen
    [[ -f "$KEY" ]] || { echo "No key file $KEY" >&2; exit 1; }
    echo "Sending only the public key to $HOST (local fingerprint $(fingerprint "$KEY")) ..."
    age-keygen -y "$KEY" | ssh "$HOST" "$REMOTE_DIR/scripts/staging-set-recipient.sh"
    ;;
  restore-test)
    need age
    if [[ "$KEY" == "--paste" ]]; then
      tmpdir="/dev/shm"; [[ -d "$tmpdir" ]] || tmpdir="${TMPDIR:-/tmp}"
      umask 077
      KEY="$(mktemp "$tmpdir/amanah-key.XXXXXX")"
      trap 'shred -u "$KEY" 2>/dev/null || rm -f "$KEY"' EXIT
      read -rs -p "Paste the AGE-SECRET-KEY-… line (input hidden), then Enter: " line; echo
      [[ "$line" =~ ^AGE-SECRET-KEY-1[0-9A-Z]+$ ]] || { echo "That does not look like an age private key." >&2; exit 1; }
      printf '%s\n' "$line" > "$KEY"
      unset line
    fi
    [[ -f "$KEY" ]] || { echo "No key file $KEY" >&2; exit 1; }
    file="$(ssh "$HOST" "ls -1t $REMOTE_DIR/backups/amanah_*.sql.gz.age 2>/dev/null | head -1")"
    [[ "$file" =~ ^$REMOTE_DIR/backups/amanah_[A-Za-z0-9_]+\.sql\.gz\.age$ ]] || { echo "No encrypted backup found on $HOST." >&2; exit 1; }
    name="$(basename "$file")"
    echo "Restore test for $name: decrypting here, loading into a throw-away database on $HOST ..."
    ssh "$HOST" "cat '$file'" | age -d -i "$KEY" \
      | ssh "$HOST" "cd $REMOTE_DIR && BACKUP_NAME='$name' scripts/staging-restore-test.sh --stdin"
    ;;
  *)
    sed -n '2,13p' "$0" | sed 's/^# \{0,1\}//'
    exit 2
    ;;
esac
