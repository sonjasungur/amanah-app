#!/usr/bin/env bash
# Cron job: runs the read-only check and notes changes of state. Never repairs, restarts or deploys.
# Alarms stay on this server (/var/log/amanah-prod-alerts.log). They leave it only with ALERT_EXTERNAL=true in
# alert.env, which needs the owner's approved channel (docs/strategy/45 §3).
set -u
BASE="${BASE:-/opt/amanah-prod}"
STATE="$BASE/state-check"
ALERTS="${ALERTS:-/var/log/amanah-prod-alerts.log}"
LOG="${LOG:-/var/log/amanah-prod-check.log}"
out="$("$BASE/verify-production-image.sh" 2>&1)"; rc=$?
# Images since the key reference carry its check. No key material in the output.
if docker exec amanah-app test -f scripts/key-reference.mjs </dev/null 2>/dev/null; then
  keys="$(docker exec amanah-app node scripts/key-reference.mjs check </dev/null 2>&1 | grep -v -E 'MODULE_TYPELESS|Reparsing|To eliminate|trace-warnings')" && out="$out
OK    Schluesselreferenz" || { out="$out
FAIL  Schluesselreferenz: $keys"; rc=1; }
fi
{ date -Iseconds; printf '%s\n' "$out"; } >> "$LOG"
previous="$(cat "$STATE" 2>/dev/null || echo 0)"
if [ "$rc" -ne 0 ] && { [ "$previous" = 0 ] || [ "$(printf '%s' "$out" | grep -c FAIL)" != "$(cat "$STATE.count" 2>/dev/null)" ]; }; then
  echo "$(date '+%F %T') ALARM amanah-prod $(printf '%s' "$out" | grep FAIL | tr '\n' ';')" >> "$ALERTS"
fi
if [ "$rc" -eq 0 ] && [ "$previous" != 0 ]; then echo "$(date '+%F %T') OK amanah-prod wieder in Ordnung" >> "$ALERTS"; fi
if [ -f "$BASE/alert.env" ] && grep -qx 'ALERT_EXTERNAL=true' "$BASE/alert.env"; then
  printf '%s\n' "$out" > "$STATE.last"
  ALERT_CONFIG="$BASE/alert.env" ALERT_LABEL=amanah-prod ALERT_STATE_DIR="${ALERT_STATE_DIR:-/var/lib/amanah-prod-alerts}" ALERT_LOG="$ALERTS" \
    "$BASE/bin/staging-alert.sh" prod-check "$rc" "$STATE.last"
fi
printf '%s' "$rc" > "$STATE"; printf '%s' "$out" | grep -c FAIL > "$STATE.count"
exit "$rc"
