#!/usr/bin/env bash
# Manages the public backup recipients on the server. Accepts public age keys only, keeps at least
# one recipient and a dated copy of the previous setting. Touches no existing backup.
#
#   set-backup-recipient.sh list
#   ... | set-backup-recipient.sh add            public key on stdin
#   set-backup-recipient.sh remove <fingerprint> first 16 characters shown by list
set -euo pipefail
BASE="${BASE:-/opt/amanah-prod}"
ENV_FILE="$BASE/backup.env"
fp() { printf %s "$1" | sha256sum | cut -c1-16; }
current() { ( set +u; source "$ENV_FILE"; printf '%s\n' $BACKUP_AGE_RECIPIENTS ); }
save() {
  umask 077
  cp -p "$ENV_FILE" "$BASE/config-vorher/backup.env.$(date +%Y%m%d-%H%M%S)"
  printf 'BACKUP_AGE_RECIPIENTS="%s"\n' "$1" > "$ENV_FILE.new"
  mv "$ENV_FILE.new" "$ENV_FILE"
}
case "${1:-}" in
  list) for r in $(current); do fp "$r"; done ;;
  add)
    read -r key || true
    [[ "$key" =~ ^age1[a-z0-9]{58}$ ]] || { echo "Abgelehnt: kein oeffentlicher age-Schluessel." >&2; exit 1; }
    if current | grep -qxF "$key"; then echo "Schon eingetragen: $(fp "$key")"; exit 0; fi
    save "$(current | tr '\n' ' ')$key"
    echo "Hinzugefuegt: $(fp "$key"). Empfaenger jetzt: $(current | wc -l)"
    ;;
  remove)
    [[ "${2:-}" =~ ^[0-9a-f]{16}$ ]] || { echo "Fingerabdruck fehlt." >&2; exit 2; }
    keep=""; for r in $(current); do [ "$(fp "$r")" = "$2" ] || keep="$keep $r"; done
    keep="${keep# }"
    [ -n "$keep" ] || { echo "Abgelehnt: Der letzte Empfaenger bleibt." >&2; exit 1; }
    [ "$keep" != "$(current | tr '\n' ' ' | sed 's/ $//')" ] || { echo "Nicht gefunden." >&2; exit 1; }
    save "$keep"
    echo "Entfernt fuer kuenftige Backups: $2. Bestehende Backups brauchen weiter den zugehoerigen privaten Schluessel."
    ;;
  *) sed -n 2,7p "$0" | sed 's/^# \{0,1\}//'; exit 2 ;;
esac
