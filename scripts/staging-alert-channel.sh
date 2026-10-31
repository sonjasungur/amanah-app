#!/usr/bin/env bash
# ntfy channel for the staging alerts (docs 29 §3). Run by the owner on the server.
# Topic URL and token are read from stdin and stored only in alert.env (root, 600); this script
# never prints them. Nothing leaves the server until "enable".
#
#   ssh <server> /opt/amanah-staging/scripts/staging-alert-channel.sh set      # prompts: topic URL, optional token
#   ssh -t <server> ... set   (interactive, input hidden)   or   printf '%s\n%s\n' URL TOKEN | ssh <server> ... set
#   ssh <server> /opt/amanah-staging/scripts/staging-alert-channel.sh status
#   ssh <server> /opt/amanah-staging/scripts/staging-alert-channel.sh enable   # switches on and sends ONE test message
#   ssh <server> /opt/amanah-staging/scripts/staging-alert-channel.sh disable
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
CONF="${ALERT_CONFIG:-$ROOT/alert.env}"
umask 077

value() { grep -m1 "^$1=" "$CONF" 2>/dev/null | cut -d= -f2- || true; }
write_conf() { # $1 external, $2 url, $3 token
  local tmp
  tmp="$(mktemp "$CONF.XXXXXX")"
  {
    echo "# Written by scripts/staging-alert-channel.sh — root:root 600. Never commit or print."
    echo "ALERT_EXTERNAL=$1"
    echo "ALERT_REPEAT_HOURS=$(value ALERT_REPEAT_HOURS | grep -E '^[0-9]+$' || echo 24)"
    echo "ALERT_NTFY_URL=$2"
    echo "ALERT_NTFY_TOKEN=$3"
  } > "$tmp"
  mv "$tmp" "$CONF"
  chmod 600 "$CONF"
}

case "${1:-}" in
  set)
    if [[ -t 0 ]]; then
      read -rs -p "ntfy topic URL (https://…/<long random topic>), input hidden: " url; echo
      read -rs -p "Access token (empty if none), input hidden: " token; echo
    else
      read -r url || true
      read -r token || true
    fi
    if [[ ! "$url" =~ ^https://[A-Za-z0-9.-]+(:[0-9]+)?/[A-Za-z0-9_-]{20,64}$ ]]; then
      echo "Refused: expected https://<server>/<topic> with a random topic of 20–64 letters, digits, - or _." >&2
      exit 1
    fi
    if [[ -n "$token" && ! "$token" =~ ^tk_[A-Za-z0-9]{20,}$ ]]; then echo "Refused: token must look like tk_…" >&2; exit 1; fi
    write_conf false "$url" "$token"
    echo "Channel stored (external delivery still OFF). Next: $0 enable"
    ;;
  status)
    [[ "$(value ALERT_EXTERNAL)" == "true" ]] && echo "external delivery: ON" || echo "external delivery: OFF"
    [[ -n "$(value ALERT_NTFY_URL)" ]] && echo "ntfy topic: configured (host $(value ALERT_NTFY_URL | cut -d/ -f3))" || echo "ntfy topic: not configured"
    [[ -n "$(value ALERT_NTFY_TOKEN)" ]] && echo "token: set" || echo "token: none"
    ;;
  enable)
    url="$(value ALERT_NTFY_URL)"
    [[ -n "$url" ]] || { echo "No channel configured — run: $0 set" >&2; exit 1; }
    write_conf true "$url" "$(value ALERT_NTFY_TOKEN)"
    rm -f "${ALERT_STATE_DIR:-/var/lib/amanah-staging-alerts}/channel-test.state"
    scripts/staging-alert.sh channel-test 1
    scripts/staging-alert.sh channel-test 0
    tail -n 4 "${ALERT_LOG:-/var/log/amanah-staging-alerts.log}" | grep -E 'channel-test|DELIVERY' || true
    echo "External delivery ON. You should have received an ALARM and an OK for channel-test."
    echo "Open alarms are sent at the next run of their job (health: within 5 minutes)."
    # Already open alarms were recorded while the channel was off: re-announce them once.
    find "${ALERT_STATE_DIR:-/var/lib/amanah-staging-alerts}" -name '*.state' ! -name 'channel-test.state' -exec touch -d '3 days ago' {} +
    ;;
  disable)
    write_conf false "$(value ALERT_NTFY_URL)" "$(value ALERT_NTFY_TOKEN)"
    echo "External delivery OFF (alerts are still written to the local log)."
    ;;
  *)
    sed -n '2,11p' "$0" | sed 's/^# \{0,1\}//'
    exit 2
    ;;
esac
