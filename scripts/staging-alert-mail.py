#!/usr/bin/env python3
"""E-mail channel for the staging alerts (called by staging-alert.sh, stdlib only).

Same delivery concept as Nasib Nikah: Brevo SMTP relay on port 587 with STARTTLS, login and
SMTP key from the Brevo dashboard, a verified sender, placeholder detection, and a clean skip
when nothing is configured. Separate credentials for Amanah (own SMTP key, own alert.env).

    printf '%s' "$body" | python3 -I scripts/staging-alert-mail.py --kind ALARM --check health

Settings (environment, from alert.env — root, mode 600):
    ALERT_SMTP_HOST (default smtp-relay.brevo.com), ALERT_SMTP_PORT (587), ALERT_SMTP_USER,
    ALERT_SMTP_PASSWORD, ALERT_MAIL_FROM, ALERT_MAIL_TO (comma separated), ALERT_ENV (staging),
    ALERT_SMTP_TLS (starttls | ssl | none — none only towards 127.0.0.1 for local tests),
    ALERT_SMTP_CAFILE (local tests only), ALERT_SMTP_TIMEOUT (20 s)

Mails carry only the FAIL lines of the check scripts after a second scrub (no addresses, keys,
tokens, long random strings), a neutral technical subject and no log contents.
Exit codes: 0 sent, 2 not configured, 1 delivery failed. Never prints credentials.
"""

from __future__ import annotations

import argparse
import os
import re
import smtplib
import socket
import ssl
import sys
from datetime import UTC, datetime
from email.message import EmailMessage
from email.utils import make_msgid

PLACEHOLDER_MARKERS = ("HIER_", "EINTRAGEN", "your-", "CHANGE_ME", "placeholder", "example.com", "REPLACE_WITH")
KIND_SUBJECT = {"ALARM": "ALARM", "REMINDER": "Erinnerung", "OK": "Entwarnung"}
MAX_LINES = 20
MAX_LINE = 200

SCRUB = [
    (re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}"), "[adresse entfernt]"),
    (re.compile(r"AGE-SECRET-KEY-\S+", re.I), "[schlüssel entfernt]"),
    (re.compile(r"\b(age1[0-9a-z]{20,}|tk_\w+|(sk|rk|pk)_(live|test)_\w+|whsec_\w+|xkeysib-\S+|xsmtpsib-\S+)\b", re.I), "[schlüssel entfernt]"),
    (re.compile(r"(?i)\b(password|passwort|token|secret|api[-_]?key|authorization)\b\s*[:=]\s*\S+"), r"\1=[entfernt]"),
    (re.compile(r"[?&][^\s]*"), ""),
    (re.compile(r"\b[A-Za-z0-9+/_-]{32,}={0,2}"), "[entfernt]"),
]


def looks_like_placeholder(value: str) -> bool:
    v = (value or "").strip()
    return not v or any(m.lower() in v.lower() for m in PLACEHOLDER_MARKERS)


def scrub(text: str) -> str:
    lines = []
    for line in text.splitlines()[:MAX_LINES]:
        for pattern, repl in SCRUB:
            line = pattern.sub(repl, line)
        lines.append(line[:MAX_LINE])
    return "\n".join(lines).strip()


def config() -> tuple[dict, list[str]]:
    env = os.environ
    cfg = {
        "host": env.get("ALERT_SMTP_HOST", "smtp-relay.brevo.com").strip(),
        "port": int(env.get("ALERT_SMTP_PORT", "587") or 587),
        "user": env.get("ALERT_SMTP_USER", "").strip(),
        "password": env.get("ALERT_SMTP_PASSWORD", ""),
        "sender": env.get("ALERT_MAIL_FROM", "").strip(),
        "to": [a.strip() for a in env.get("ALERT_MAIL_TO", "").split(",") if a.strip()],
        "tls": env.get("ALERT_SMTP_TLS", "starttls").strip().lower(),
        "cafile": env.get("ALERT_SMTP_CAFILE", "").strip() or None,
        "timeout": float(env.get("ALERT_SMTP_TIMEOUT", "20") or 20),
        "env": re.sub(r"[^a-z0-9-]", "", env.get("ALERT_ENV", "staging").lower()) or "staging",
    }
    missing = []
    for key, name in (("host", "ALERT_SMTP_HOST"), ("user", "ALERT_SMTP_USER"), ("password", "ALERT_SMTP_PASSWORD"), ("sender", "ALERT_MAIL_FROM")):
        if looks_like_placeholder(cfg[key]):
            missing.append(name)
    if not cfg["to"] or any(looks_like_placeholder(a) for a in cfg["to"]):
        missing.append("ALERT_MAIL_TO")
    if cfg["tls"] not in {"starttls", "ssl", "none"}:
        missing.append("ALERT_SMTP_TLS")
    if cfg["tls"] == "none" and cfg["host"] not in {"127.0.0.1", "localhost", "::1"}:
        missing.append("ALERT_SMTP_TLS (none is only allowed towards 127.0.0.1)")
    return cfg, missing


def build(cfg: dict, kind: str, check: str, body: str) -> EmailMessage:
    msg = EmailMessage()
    msg["Subject"] = f"[Monitoring] {KIND_SUBJECT[kind]}: {cfg['env']} / {check}"
    msg["From"] = cfg["sender"]
    msg["To"] = ", ".join(cfg["to"])
    msg["Message-ID"] = make_msgid(domain=cfg["sender"].split("@")[-1])
    msg["Auto-Submitted"] = "auto-generated"
    now = datetime.now(UTC).strftime("%Y-%m-%d %H:%M UTC")
    text = (
        f"Umgebung: {cfg['env']}\nPrüfung: {check}\nZeitpunkt: {now}\nServer: {socket.gethostname()}\n\n"
        f"{scrub(body) or '(keine Details)'}\n\n"
        "Details stehen nur im Log auf dem Server. Diese Nachricht enthält keine Nutzerdaten.\n"
    )
    msg.set_content(text)
    return msg


def send(cfg: dict, msg: EmailMessage) -> None:
    context = ssl.create_default_context(cafile=cfg["cafile"])
    if cfg["tls"] == "ssl":
        server = smtplib.SMTP_SSL(cfg["host"], cfg["port"], timeout=cfg["timeout"], context=context)
    else:
        server = smtplib.SMTP(cfg["host"], cfg["port"], timeout=cfg["timeout"])
    with server:
        server.ehlo()
        if cfg["tls"] == "starttls":
            server.starttls(context=context)
            server.ehlo()
        server.login(cfg["user"], cfg["password"])
        server.send_message(msg)


def failure_code(exc: BaseException) -> str:
    if isinstance(exc, smtplib.SMTPAuthenticationError):
        return f"auth_failed ({exc.smtp_code})"
    if isinstance(exc, smtplib.SMTPRecipientsRefused):
        return "recipient_refused"
    if isinstance(exc, smtplib.SMTPSenderRefused):
        return f"sender_refused ({exc.smtp_code})"
    if isinstance(exc, smtplib.SMTPDataError):
        return f"rejected ({exc.smtp_code})"
    if isinstance(exc, smtplib.SMTPNotSupportedError):
        return "starttls_not_supported"
    if isinstance(exc, ssl.SSLError):
        return "tls_failed"
    # smtplib reports a read timeout (e.g. no greeting) as SMTPServerDisconnected("... timed out").
    if isinstance(exc, (TimeoutError, socket.timeout)) or (
        isinstance(exc, smtplib.SMTPServerDisconnected) and "timed out" in str(exc)
    ):
        return "timeout"
    if isinstance(exc, smtplib.SMTPResponseException):
        return f"smtp_error ({exc.smtp_code})"
    if isinstance(exc, (smtplib.SMTPException, OSError)):
        return "connection_failed"
    return "unexpected_error"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--kind", required=True, choices=sorted(KIND_SUBJECT))
    parser.add_argument("--check", required=True)
    args = parser.parse_args()
    if not re.fullmatch(r"[a-z0-9-]{1,40}", args.check):
        print("mail skipped: invalid check name", file=sys.stderr)
        return 2
    cfg, missing = config()
    if missing:
        print(f"mail skipped: not configured ({', '.join(missing)})", file=sys.stderr)
        return 2
    try:
        send(cfg, build(cfg, args.kind, args.check, sys.stdin.read(8192)))
    except Exception as exc:  # report a short code only; messages may echo server details
        print(f"mail failed: {failure_code(exc)}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
