#!/usr/bin/env bash
# Owner's off-server copy of the encrypted production backups — runs on YOUR computer (owner 25.11.2026).
# Copies only the age-encrypted files, never decrypts, never deletes on the server. Each file must carry the
# age header; anything else stops the run. Optionally mirrors the folder to an external drive.
#
#   scripts/owner-backup-pull.sh                      ~/wasiyya-backups
#   scripts/owner-backup-pull.sh /media/usb/wasiyya   additionally mirror to this folder (e.g. encrypted USB drive)
#
# Server: AMANAH_PROD_HOST (default gemeinsam1-prod). Target: WASIYYA_BACKUP_DIR (default ~/wasiyya-backups).
set -euo pipefail

HOST="${AMANAH_PROD_HOST:-gemeinsam1-prod}"
REMOTE="${AMANAH_PROD_BACKUPS:-/opt/amanah-prod/backups/}"
TARGET="${WASIYYA_BACKUP_DIR:-$HOME/wasiyya-backups}"
MIRROR="${1:-}"

command -v rsync >/dev/null || { echo "rsync fehlt: sudo apt install rsync" >&2; exit 1; }
umask 077
mkdir -p "$TARGET"; chmod 700 "$TARGET"

# Only encrypted files; --ignore-existing: a file once fetched is never overwritten.
rsync -a --ignore-existing --include='*.age' --exclude='*' -e "ssh -o BatchMode=yes" "$HOST:$REMOTE" "$TARGET/"

bad=0; count=0
for f in "$TARGET"/*.age; do
  [ -e "$f" ] || continue
  count=$((count + 1))
  [ "$(head -c 21 "$f")" = "age-encryption.org/v1" ] || { echo "FAIL nicht age-verschluesselt: $(basename "$f")" >&2; bad=1; }
done
[ "$bad" = 0 ] || exit 1
( cd "$TARGET" && sha256sum ./*.age > SHA256SUMS )
newest="$(ls -1t "$TARGET"/*.age 2>/dev/null | head -1)"
echo "OK   $count verschluesselte Dateien in $TARGET, neueste: $(basename "${newest:-–}")"

if [ -n "$MIRROR" ]; then
  [ -d "$MIRROR" ] || { echo "Ziel fuer die Kopie fehlt: $MIRROR" >&2; exit 1; }
  rsync -a --ignore-existing "$TARGET/" "$MIRROR/"
  ( cd "$MIRROR" && sha256sum -c --quiet SHA256SUMS ) && echo "OK   Kopie geprueft: $MIRROR"
fi
echo "Hinweis: Die Dateien sind nur mit deinem privaten Schluessel lesbar. Schluessel nie im selben Ordner oder auf demselben Datentraeger aufbewahren."
