#!/usr/bin/env bash
# E-mail channel for the staging alerts (docs 29 §3). Run by the owner on the server.
# Brevo SMTP login and key are read with hidden input (or from stdin) and stored only in
# alert.env (root, 600); this script never prints them. Nothing leaves the server until "enable".
# ntfy is not used and stays switched off.
#
#   ssh -t <server> /opt/amanah-staging/scripts/staging-alert-channel.sh mail-set   # prompts, input hidden
#   printf '%s\n' LOGIN KEY FROM TO | ssh <server> .../staging-alert-channel.sh mail-set
#   ssh <server> /opt/amanah-staging/scripts/staging-alert-channel.sh status
#   ssh <server> /opt/amanah-staging/scripts/staging-alert-channel.sh enable    # switches on, sends ONE test alarm + all-clear
#   ssh <server> /opt/amanah-staging/scripts/staging-alert-channel.sh disable
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
CONF="${ALERT_CONFIG:-$ROOT/alert.env}"
STATE_DIR="${ALERT_STATE_DIR:-/var/lib/amanah-staging-alerts}"
ALERT_LOG="${ALERT_LOG:-/var/log/amanah-staging-alerts.log}"
umask 077
EMAIL_RE='^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'

value() { grep -m1 "^$1=" "$CONF" 2>/dev/null | cut -d= -f2- | sed -E "s/^'(.*)'\$/\1/" || true; }
# Rewrites one KEY in alert.env and keeps every other line. Values are single-quoted for bash;
# quotes are rejected on input, so no escaping is needed.
set_kv() {
  local tmp
  [[ "$2" != *"'"* ]] || { echo "Refused: quotes are not allowed in $1." >&2; exit 1; }
  tmp="$(mktemp "$CONF.XXXXXX")"
  { grep -v "^$1=" "$CONF" 2>/dev/null || true; printf "%s='%s'\n" "$1" "$2"; } > "$tmp"
  mv "$tmp" "$CONF"
  chmod 600 "$CONF"
}
ask() { # $1 prompt, $2 hidden(1/0) -> value on stdout
  local v
  if [[ -t 0 ]]; then
    if [[ "$2" == 1 ]]; then read -rs -p "$1" v; echo >&2; else read -r -p "$1" v; fi
  else
    read -r v || true
  fi
  printf '%s' "$v"
}

case "${1:-}" in
  mail-set)
    [[ -f "$CONF" ]] || : > "$CONF"
    user="$(ask "Brevo SMTP login (input hidden): " 1)"
    key="$(ask "Brevo SMTP key for Amanah (input hidden): " 1)"
    from="$(ask "Sender address (verified in Brevo): " 0)"
    to="$(ask "Recipient address(es), comma separated: " 0)"
    [[ "$user" =~ ^[^[:space:]\'\"]{3,200}$ ]] || { echo "Refused: SMTP login missing or invalid." >&2; exit 1; }
    [[ "$key" =~ ^[^[:space:]\'\"]{16,300}$ ]] || { echo "Refused: SMTP key missing or too short." >&2; exit 1; }
    [[ "$from" =~ $EMAIL_RE ]] || { echo "Refused: sender is not an e-mail address." >&2; exit 1; }
    IFS=',' read -ra rcpts <<<"$to"
    [[ ${#rcpts[@]} -ge 1 ]] || { echo "Refused: no recipient." >&2; exit 1; }
    for r in "${rcpts[@]}"; do [[ "$(xargs <<<"$r")" =~ $EMAIL_RE ]] || { echo "Refused: a recipient is not an e-mail address." >&2; exit 1; }; done
    set_kv ALERT_SMTP_HOST "${ALERT_SMTP_HOST:-smtp-relay.brevo.com}"
    set_kv ALERT_SMTP_PORT "${ALERT_SMTP_PORT:-587}"
    set_kv ALERT_SMTP_TLS starttls
    set_kv ALERT_SMTP_USER "$user"
    set_kv ALERT_SMTP_PASSWORD "$key"
    set_kv ALERT_MAIL_FROM "$from"
    set_kv ALERT_MAIL_TO "$(tr -d ' ' <<<"$to")"
    set_kv ALERT_ENV "${ALERT_ENV:-staging}"
    set_kv ALERT_MAIL true
    set_kv ALERT_NTFY_URL ""
    set_kv ALERT_NTFY_TOKEN ""
    [[ -n "$(value ALERT_EXTERNAL)" ]] || set_kv ALERT_EXTERNAL false
    unset user key
    echo "E-mail channel stored (sending still OFF unless already enabled). Next: $0 enable"
    ;;
  status)
    [[ "$(value ALERT_EXTERNAL)" == "true" ]] && echo "sending: ON" || echo "sending: OFF"
    [[ "$(value ALERT_MAIL)" == "true" ]] && echo "e-mail channel: configured" || echo "e-mail channel: not configured"
    echo "smtp: $(value ALERT_SMTP_HOST):$(value ALERT_SMTP_PORT) $(value ALERT_SMTP_TLS)"
    [[ -n "$(value ALERT_SMTP_USER)" ]] && echo "login: set" || echo "login: missing"
    [[ -n "$(value ALERT_SMTP_PASSWORD)" ]] && echo "smtp key: set" || echo "smtp key: missing"
    from="$(value ALERT_MAIL_FROM)"; echo "sender domain: ${from#*@}"
    to="$(value ALERT_MAIL_TO)"; echo "recipients: $(tr ',' '\n' <<<"$to" | grep -c @ || true)"
    echo "environment label: $(value ALERT_ENV)"
    [[ -z "$(value ALERT_NTFY_URL)" ]] && echo "ntfy: off" || echo "ntfy: CONFIGURED (not intended)"
    ;;
  enable)
    [[ "$(value ALERT_MAIL)" == "true" ]] || { echo "No e-mail channel configured — run: $0 mail-set" >&2; exit 1; }
    set_kv ALERT_EXTERNAL true
    rm -f "$STATE_DIR/channel-test.state" "$STATE_DIR/channel-test.state.undelivered"
    scripts/staging-alert.sh channel-test 1
    scripts/staging-alert.sh channel-test 0
    tail -n 4 "$ALERT_LOG" | grep -E 'channel-test' || true
    if tail -n 4 "$ALERT_LOG" | grep -q 'DELIVERY \[channel-test\]'; then
      echo "Test mail NOT delivered (see the DELIVERY line). Sending stays ON; fix the setting or run: $0 disable" >&2
      exit 1
    fi
    echo "Sending ON. Two test mails should arrive: ALARM and Entwarnung for channel-test."
    # Already open alarms were recorded while sending was off: announce them once at the next job run.
    find "$STATE_DIR" -name '*.state' ! -name 'channel-test.state' -exec touch -d '3 days ago' {} +
    ;;
  disable)
    set_kv ALERT_EXTERNAL false
    echo "Sending OFF (alerts are still written to the local log)."
    ;;
  *)
    sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'
    exit 2
    ;;
esac
