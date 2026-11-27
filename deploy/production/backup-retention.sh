#!/usr/bin/env bash
# Retention for the encrypted production backups (owner 25.11.2026: 30 days as a provisional
# technical target, pending legal review – start blocker 5).
#
#   backup-retention.sh <backup-dir> [days=30] [keep-min=7]
#
# Removes only this application's own encrypted dumps (amanah_*.sql.gz.age) older than <days>.
# Never touches anything else, always keeps the <keep-min> newest, and refuses odd input
# (missing directory, days below 7, non-numbers). Prints counts and file names only.
set -euo pipefail

DIR="${1:-}"; DAYS="${2:-30}"; KEEP="${3:-7}"
[[ -n "$DIR" && -d "$DIR" ]] || { echo "retention: directory missing" >&2; exit 2; }
[[ "$DAYS" =~ ^[0-9]+$ && "$DAYS" -ge 7 ]] || { echo "retention: days must be a number >= 7" >&2; exit 2; }
[[ "$KEEP" =~ ^[0-9]+$ && "$KEEP" -ge 1 ]] || { echo "retention: keep-min must be a number >= 1" >&2; exit 2; }

# Newest first; the first KEEP are protected whatever their age.
mapfile -t all < <(find "$DIR" -maxdepth 1 -type f -name 'amanah_*.sql.gz.age' -printf '%T@ %p\n' | sort -rn | cut -d' ' -f2-)
removed=0
for i in "${!all[@]}"; do
  (( i < KEEP )) && continue
  f="${all[$i]}"
  if [[ -n "$(find "$f" -maxdepth 0 -mtime +"$DAYS")" ]]; then
    rm -f -- "$f"
    echo "retention: removed $(basename "$f")"
    removed=$((removed + 1))
  fi
done
echo "retention: ${DAYS} days, kept $(( ${#all[@]} - removed )), removed ${removed}"
