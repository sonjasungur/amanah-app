#!/usr/bin/env bash
# Read-only: did the encrypted backup of the most recent cron slot happen?
# Exit 0 done, 3 first run still pending, 1 missing or wrong.
#
#   ssh gemeinsam1-prod /opt/amanah-prod/check-backup-cron.sh
set -u
BASE="${BASE:-/opt/amanah-prod}"
FIRST_SLOT="${FIRST_SLOT:-2026-11-04 03:15}"
LOG="${LOG:-/var/log/amanah-backup.log}"
now=$(date +%s)
echo "Serverzeit: $(date '+%F %T %Z') ($(cat /etc/timezone 2>/dev/null || echo unbekannt))"
echo "Zeitplan:   $(crontab -l 2>/dev/null | grep -F backup-encrypted.sh | cut -d' ' -f1-5)"
today=$(date -d 'today 03:15' +%s)
if [ "$now" -ge "$today" ]; then slot=$today; next=$(date -d 'tomorrow 03:15' '+%F %H:%M %Z'); else slot=$(date -d 'yesterday 03:15' +%s); next=$(date -d 'today 03:15' '+%F %H:%M %Z'); fi
echo "Naechster Lauf: $next"
if [ "$now" -lt "$(date -d "$FIRST_SLOT" +%s)" ]; then echo "AUSSTEHEND: erster automatischer Lauf ist $FIRST_SLOT"; exit 3; fi
day=$(date -d "@$slot" +%Y%m%d)
f=$(ls -1 "$BASE"/backups/amanah_*_"${day}"_0315??.sql.gz.age 2>/dev/null | tail -1)
[ -n "$f" ] || { echo "FAIL kein Backup des Laufs $(date -d "@$slot" '+%F %H:%M')"; exit 1; }
[ "$(head -c 21 "$f")" = "age-encryption.org/v1" ] || { echo "FAIL $(basename "$f") ist nicht verschluesselt"; exit 1; }
[ "$(stat -c %a "$f")" = 600 ] || { echo "FAIL Rechte von $(basename "$f")"; exit 1; }
grep -qF "Encrypted backup complete: $(basename "$f")" "$LOG" || { echo "FAIL kein Logeintrag"; exit 1; }
recipients=$(head -c 2000 "$f" | sed '/^---/q' | grep -ac '^-> X25519')
echo "OK   $(basename "$f"), $(stat -c %s "$f") Bytes, verschluesselt, Empfaenger: $recipients, Rechte 600, Logeintrag vorhanden"
