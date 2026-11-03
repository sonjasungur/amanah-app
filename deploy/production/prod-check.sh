#!/usr/bin/env bash
# Cron job: runs the read-only check and notes changes of state. Never repairs, restarts or deploys.
# Alarms stay on this server (/var/log/amanah-prod-alerts.log) until an alarm channel is approved.
set -u
BASE=/opt/amanah-prod
STATE="$BASE/state-check"
ALERTS="${ALERTS:-/var/log/amanah-prod-alerts.log}"
LOG="${LOG:-/var/log/amanah-prod-check.log}"
out="$("$BASE/verify-production-image.sh" 2>&1)"; rc=$?
{ date -Iseconds; printf '%s\n' "$out"; } >> "$LOG"
previous="$(cat "$STATE" 2>/dev/null || echo 0)"
if [ "$rc" -ne 0 ] && { [ "$previous" = 0 ] || [ "$(printf '%s' "$out" | grep -c FAIL)" != "$(cat "$STATE.count" 2>/dev/null)" ]; }; then
  echo "$(date '+%F %T') ALARM amanah-prod $(printf '%s' "$out" | grep FAIL | tr '\n' ';')" >> "$ALERTS"
fi
if [ "$rc" -eq 0 ] && [ "$previous" != 0 ]; then echo "$(date '+%F %T') OK amanah-prod wieder in Ordnung" >> "$ALERTS"; fi
printf '%s' "$rc" > "$STATE"; printf '%s' "$out" | grep -c FAIL > "$STATE.count"
exit "$rc"
