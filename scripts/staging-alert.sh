#!/usr/bin/env bash
# Alert dispatcher for the staging cron jobs. Records every state change locally and, only
# when explicitly switched on, sends it by e-mail (Brevo SMTP, staging-alert-mail.py). Sends only
# the FAIL lines of the check scripts or a generic job message — never log contents or secrets.
#
#   scripts/staging-alert.sh <check> <exit-code> [log-file]
#   e.g.  scripts/staging-healthcheck.sh > /var/log/h.last 2>&1; scripts/staging-alert.sh health $? /var/log/h.last
#
# Alarm on a new or changed failure, reminder every ALERT_REPEAT_HOURS while it persists,
# all-clear once the check passes again. A failed mail delivery is logged and retried after
# ALERT_RETRY_MINUTES; the dispatcher always exits 0 and never touches the monitored app.
#
# Optional config file ALERT_CONFIG (default /opt/amanah-staging/alert.env, root, mode 600):
#   ALERT_EXTERNAL=true                 master switch for anything leaving the server (default off)
#   ALERT_MAIL=true + ALERT_SMTP_* / ALERT_MAIL_*   e-mail channel (see staging-alert-mail.py)
#   ALERT_RETRY_MINUTES=30              retry interval after a failed mail delivery
#   Not used (kept switched off): ALERT_NTFY_URL=https://<server>/<topic>   ALERT_NTFY_TOKEN=<token>      (ntfy push)
#   ALERT_WEBHOOK_URL=https://...       (JSON {"text": ...}; Mattermost/Slack/Rocket.Chat style)
#   ALERT_REPEAT_HOURS=24
set -uo pipefail

CHECK="${1:-}"
CODE="${2:-}"
LOG_FILE="${3:-}"
if [[ ! "$CHECK" =~ ^[a-z0-9-]+$ || ! "$CODE" =~ ^[0-9]+$ ]]; then
  echo "usage: $0 <check> <exit-code> [log-file]" >&2
  exit 2
fi

ALERT_CONFIG="${ALERT_CONFIG:-/opt/amanah-staging/alert.env}"
if [[ -f "$ALERT_CONFIG" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ALERT_CONFIG"
  set +a
fi
STATE_DIR="${ALERT_STATE_DIR:-/var/lib/amanah-staging-alerts}"
ALERT_LOG="${ALERT_LOG:-/var/log/amanah-staging-alerts.log}"
LABEL="${ALERT_LABEL:-amanah-staging}"
REPEAT_MIN=$(( ${ALERT_REPEAT_HOURS:-24} * 60 ))
RETRY_MIN="${ALERT_RETRY_MINUTES:-30}"
MAIL_SCRIPT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/staging-alert-mail.py"
umask 077
mkdir -p "$STATE_DIR"
state="$STATE_DIR/$CHECK.state"

if [[ "$CODE" == "0" ]]; then
  current=""
else
  current=""
  [[ -n "$LOG_FILE" && -f "$LOG_FILE" ]] && current="$(grep '^FAIL' "$LOG_FILE" | cut -c1-200 | head -20)"
  [[ -n "$current" ]] || current="FAIL $CHECK job exited with code $CODE (details in the log on the server)"
fi
previous="$(cat "$state" 2>/dev/null || true)"
# Digits are left out of the comparison so "disk 86%" and "disk 87%" count as the same failure.
key() { sed 's/[0-9][0-9]*/#/g' | sort -u; }

deliver() { # $1 title (ASCII, first word = ALARM | REMINDER | OK), $2 body, $3 ntfy priority
  local note err kind="${1%% *}"
  printf '%s %s [%s] %s\n' "$(date '+%F %T')" "$1" "$CHECK" "$(tr '\n' ';' <<<"$2")" >> "$ALERT_LOG"
  [[ "${ALERT_EXTERNAL:-false}" == "true" ]] || return 0
  # URLs and tokens go to curl via stdin config, never as process arguments.
  if [[ -n "${ALERT_NTFY_URL:-}" ]]; then
    {
      printf 'url = "%s"\nheader = "Title: %s"\nheader = "Priority: %s"\nheader = "Tags: amanah,staging"\n' "$ALERT_NTFY_URL" "$1" "$3"
      [[ -n "${ALERT_NTFY_TOKEN:-}" ]] && printf 'header = "Authorization: Bearer %s"\n' "$ALERT_NTFY_TOKEN"
    } | curl -sf -o /dev/null --max-time 15 -K - --data-binary "$2" || note="ntfy delivery failed"
  fi
  if [[ -n "${ALERT_WEBHOOK_URL:-}" ]]; then
    if command -v jq >/dev/null 2>&1; then
      printf 'url = "%s"\nheader = "Content-Type: application/json"\n' "$ALERT_WEBHOOK_URL" \
        | curl -sf -o /dev/null --max-time 15 -K - --data-binary "$(jq -n --arg t "$1"$'\n'"$2" '{text: $t}')" \
        || note="${note:+$note, }webhook delivery failed"
    else
      note="${note:+$note, }webhook skipped (jq missing)"
    fi
  fi
  if [[ "${ALERT_MAIL:-false}" == "true" ]]; then
    # Credentials reach the mailer only through the environment (alert.env), never as arguments.
    if err="$(printf '%s' "$2" | timeout 90 python3 -I "$MAIL_SCRIPT" --kind "$kind" --check "$CHECK" 2>&1 >/dev/null)"; then
      rm -f "$state.undelivered"
    else
      note="${note:+$note, }$(head -c 200 <<<"${err:-mail delivery failed}" | tr '\n' ' ')"
      [[ "$kind" == "OK" ]] || touch "$state.undelivered"
    fi
  fi
  [[ -n "${note:-}" ]] && printf '%s DELIVERY [%s] %s\n' "$(date '+%F %T')" "$CHECK" "$note" >> "$ALERT_LOG"
  return 0
}

if [[ -z "$current" ]]; then
  if [[ -n "$previous" ]]; then
    deliver "OK $LABEL $CHECK" "Resolved: $CHECK passes again on $(hostname)." default
    rm -f "$state" "$state.undelivered"
  fi
elif [[ "$(key <<<"$current")" != "$(key <<<"$previous")" ]]; then
  deliver "ALARM $LABEL $CHECK" "$current"$'\n'"host: $(hostname)" high
  printf '%s\n' "$current" > "$state"
elif [[ -n "$(find "$state.undelivered" -mmin "+$RETRY_MIN" 2>/dev/null)" ]]; then
  # The alarm for this failure never reached the mailbox: try again (local log notes the retry).
  deliver "ALARM $LABEL $CHECK" "$current"$'\n'"host: $(hostname)" high
elif [[ -n "$(find "$state" -mmin "+$REPEAT_MIN" 2>/dev/null)" ]]; then
  deliver "REMINDER $LABEL $CHECK" "Still failing:"$'\n'"$current"$'\n'"host: $(hostname)" high
  printf '%s\n' "$current" > "$state"
fi

# Keep the local alert log small.
if [[ -f "$ALERT_LOG" && "$(wc -l < "$ALERT_LOG")" -gt 2000 ]]; then
  tail -n 1000 "$ALERT_LOG" > "$ALERT_LOG.tmp" && mv "$ALERT_LOG.tmp" "$ALERT_LOG"
fi
exit 0
