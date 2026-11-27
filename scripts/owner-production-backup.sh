#!/usr/bin/env bash
# Owner's key for production backups — run on YOUR computer, never on the server (docs/strategy/45 §2).
# Needs only age and ssh. Nothing this script prints contains the private key, and the key never leaves
# this computer. Backups are decrypted here; only the restored test database runs on the server, in RAM,
# without network, and is removed afterwards. Production data is not changed.
#
#   scripts/owner-production-backup.sh create [key-file]        create a new key pair
#   scripts/owner-production-backup.sh fingerprint [key-file]   short fingerprint of its public key
#   scripts/owner-production-backup.sh add-recipient [key-file] send ONLY the public key to the server
#   scripts/owner-production-backup.sh restore-probe <key-file|--paste> [backup-file-name]
#   scripts/owner-production-backup.sh check-old <key-file|--paste>   can this key open the old archive?
#   scripts/owner-production-backup.sh check-data-key <key-file|--paste>   does the copy of the data key match?
#
# Server: AMANAH_PROD_HOST (default gemeinsam1-prod). Default key: ~/amanah-keys/amanah-production-backup.key
set -euo pipefail

HOST="${AMANAH_PROD_HOST:-gemeinsam1-prod}"
REMOTE="${AMANAH_PROD_DIR:-/opt/amanah-prod}"
DEFAULT_KEY="$HOME/amanah-keys/amanah-production-backup.key"
CMD="${1:-}"
KEY="${2:-}"

need() { command -v "$1" >/dev/null 2>&1 || { echo "'$1' fehlt, zuerst installieren: sudo apt install age" >&2; exit 1; }; }
fingerprint() { age-keygen -y "$1" | tr -d '\n' | sha256sum | cut -c1-16; }

# A key must not end up in a repository or a synced cloud folder.
unsafe_location() {
  local d
  d="$(cd "$(dirname "$1")" && pwd)"
  case "$d" in
    *Dropbox*|*Nextcloud*|*ownCloud*|*OneDrive*|*"Google Drive"*|*GoogleDrive*|*Seafile*|*Syncthing*|*iCloud*) return 0 ;;
  esac
  while [[ "$d" != "/" ]]; do
    [[ -e "$d/.git" ]] && return 0
    d="$(dirname "$d")"
  done
  return 1
}

# Sets KEY to a readable key file; --paste keeps it in RAM until the script ends.
load_key() {
  need age
  if [[ "$KEY" == "--paste" ]]; then
    local dir=/dev/shm line; [[ -d "$dir" ]] || dir="${TMPDIR:-/tmp}"
    umask 077
    KEY="$(mktemp "$dir/amanah-key.XXXXXX")"
    trap 'shred -u "$KEY" 2>/dev/null || rm -f "$KEY"' EXIT
    read -rs -p "Zeile AGE-SECRET-KEY-… einfuegen (unsichtbar), dann Enter: " line; echo
    [[ "$line" =~ ^AGE-SECRET-KEY-1[0-9A-Z]+$ ]] || { echo "Das sieht nicht nach einem privaten age-Schluessel aus." >&2; exit 1; }
    printf '%s\n' "$line" > "$KEY"
    unset line
  fi
  KEY="${KEY:-$DEFAULT_KEY}"
  [[ -f "$KEY" ]] || { echo "Keine Schluesseldatei: $KEY" >&2; exit 1; }
}

case "$CMD" in
  create)
    need age-keygen
    KEY="${KEY:-$DEFAULT_KEY}"
    [[ -e "$KEY" ]] && { echo "Abgelehnt: $KEY existiert. Ein Backup-Schluessel wird nie ueberschrieben." >&2; exit 1; }
    umask 077
    mkdir -p "$(dirname "$KEY")"
    if unsafe_location "$KEY"; then echo "Abgelehnt: $KEY laege in einem Git- oder Cloud-Ordner." >&2; exit 1; fi
    age-keygen -o "$KEY" 2>/dev/null
    chmod 600 "$KEY"
    echo "Schluesselpaar erstellt: $KEY (Rechte 600). Fingerabdruck: $(fingerprint "$KEY")"
    echo "Jetzt: Inhalt im Passwortmanager und offline sichern, dann: $0 add-recipient \"$KEY\""
    ;;
  fingerprint)
    need age-keygen
    fingerprint "${KEY:-$DEFAULT_KEY}"
    ;;
  add-recipient)
    need age-keygen
    KEY="${KEY:-$DEFAULT_KEY}"
    [[ -f "$KEY" ]] || { echo "Keine Schluesseldatei: $KEY" >&2; exit 1; }
    echo "Sende nur den oeffentlichen Schluessel an $HOST (Fingerabdruck $(fingerprint "$KEY")) ..."
    age-keygen -y "$KEY" | ssh -T "$HOST" "$REMOTE/set-backup-recipient.sh add"
    ;;
  restore-probe)
    load_key
    name="${3:-}"
    [[ -n "$name" ]] || name="$(ssh -T "$HOST" "ls -1t $REMOTE/backups/ | grep -E '^amanah_.*[.]sql[.]gz[.]age$' | head -1" </dev/null)"
    [[ "$name" =~ ^amanah_[A-Za-z0-9_]+\.sql\.gz\.age$ ]] || { echo "Kein passendes Backup gefunden." >&2; exit 1; }
    echo "Probe mit $name: Entschluesselung hier, Testdatenbank auf $HOST ..."
    fp="$(fingerprint "$KEY")"
    marker=1; [[ "$REMOTE/backups" == /opt/amanah-prod/backups ]] || marker=0
    ssh -T "$HOST" "cat '$REMOTE/backups/$name'" </dev/null | age -d -i "$KEY" \
      | ssh -T "$HOST" "MARKER=${PROBE_MARKER:-$marker} FINGERPRINT=$fp $REMOTE/restore-probe.sh '$name'"
    echo "Fertig: Probe bestanden."
    ;;
  check-old)
    load_key
    n="$(ssh -T "$HOST" "cat '$REMOTE/backups/altbestand-klartext-20261103.tar.gz.age'" </dev/null | age -d -i "$KEY" | tar -tz | wc -l)"
    [[ "$n" -eq 126 ]] && echo "OK   Altbestand lesbar: 126 Dateien (nur gezaehlt)" || { echo "FAIL Altbestand: $n Dateien statt 126"; exit 1; }
    ssh -T "$HOST" "cat '$REMOTE/config-vorher/env-production-backup-20260705.age'" </dev/null | age -d -i "$KEY" > /dev/null
    echo "OK   Alte Env-Kopie lesbar (nicht angezeigt)"
    ;;
  check-data-key)
    load_key
    here="$(ssh -T "$HOST" "cat '$REMOTE/release/data-key-prod1.age'" </dev/null | age -d -i "$KEY" | sha256sum | cut -d' ' -f1)"
    there="$(ssh -T "$HOST" "grep -m1 '^AMANAH_DATA_KEYS=' '$REMOTE/release/.env.production.next' | cut -d= -f2- | sha256sum | cut -d' ' -f1" </dev/null)"
    [[ "$here" == "$there" ]] && echo "OK   Kopie des Datenschluessels passt (nur Pruefsummen verglichen)" || { echo "FAIL Kopie passt nicht"; exit 1; }
    echo "Jetzt den Inhalt selbst sichern: age -d -i <schluesseldatei> <kopie> in den Passwortmanager, nicht in dieses Terminal-Log."
    ;;
  *)
    sed -n '2,14p' "$0" | sed 's/^# \{0,1\}//'
    exit 2
    ;;
esac
