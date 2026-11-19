#!/usr/bin/env python3
"""Minimal fake SMTP server for local tests of staging-alert-mail.py (never for real mail).

Listens on 127.0.0.1 only, prints the chosen port on the first stdout line and appends one JSON
line per session to --out. Passwords are never stored: only whether the expected one arrived.

    python3 -I scripts/testing/fake_smtp_server.py --out sessions.jsonl --cert c.pem --key k.pem \
        --behavior ok|auth_fail|rcpt_reject|data_reject|hang|no_starttls --expect-pass <pw>
"""

from __future__ import annotations

import argparse
import base64
import json
import socketserver
import ssl
import threading
import time

ARGS: argparse.Namespace


class Handler(socketserver.StreamRequestHandler):
    timeout = 30

    def setup(self) -> None:
        super().setup()
        self.session = {"tls": False, "auth_user": None, "auth_pass_ok": False, "mail_from": None, "rcpt": [], "data": None}

    def reply(self, line: str) -> None:
        self.wfile.write((line + "\r\n").encode())
        self.wfile.flush()

    def readline(self) -> str:
        raw = self.rfile.readline(65536)
        if not raw:
            raise ConnectionError
        return raw.decode(errors="replace").rstrip("\r\n")

    def auth_ok(self, user: str, password: str) -> bool:
        self.session["auth_user"] = user
        self.session["auth_pass_ok"] = password == ARGS.expect_pass
        return ARGS.behavior != "auth_fail"

    def handle(self) -> None:
        if ARGS.behavior == "hang":
            time.sleep(60)
            return
        self.reply("220 fake-smtp ready")
        try:
            while True:
                line = self.readline()
                cmd = line.split(" ", 1)[0].upper()
                if cmd in {"EHLO", "HELO"}:
                    caps = ["250-fake-smtp", "250-AUTH PLAIN LOGIN"]
                    if ARGS.cert and not self.session["tls"] and ARGS.behavior != "no_starttls":
                        caps.append("250-STARTTLS")
                    caps.append("250 SIZE 1000000")
                    for c in caps:
                        self.reply(c)
                elif cmd == "STARTTLS":
                    self.reply("220 go ahead")
                    ctx = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
                    ctx.load_cert_chain(ARGS.cert, ARGS.key)
                    self.request = ctx.wrap_socket(self.request, server_side=True)
                    self.rfile = self.request.makefile("rb")
                    self.wfile = self.request.makefile("wb")
                    self.session["tls"] = True
                elif cmd == "AUTH":
                    parts = line.split()
                    if parts[1].upper() == "PLAIN":
                        blob = parts[2] if len(parts) > 2 else (self.reply("334 ") or self.readline())
                        _, user, password = base64.b64decode(blob).decode().split("\0")
                    else:
                        self.reply("334 VXNlcm5hbWU6")
                        user = base64.b64decode(self.readline()).decode()
                        self.reply("334 UGFzc3dvcmQ6")
                        password = base64.b64decode(self.readline()).decode()
                    self.reply("235 2.7.0 ok" if self.auth_ok(user, password) else "535 5.7.8 authentication failed")
                elif cmd == "MAIL":
                    self.session["mail_from"] = line[10:].split(">")[0].strip("<> ")
                    self.reply("250 ok")
                elif cmd == "RCPT":
                    if ARGS.behavior == "rcpt_reject":
                        self.reply("550 5.1.1 recipient rejected")
                    else:
                        self.session["rcpt"].append(line[8:].split(">")[0].strip("<> "))
                        self.reply("250 ok")
                elif cmd == "DATA":
                    self.reply("354 end with .")
                    lines = []
                    while (l := self.readline()) != ".":
                        lines.append(l[1:] if l.startswith("..") else l)
                    if ARGS.behavior == "data_reject":
                        self.reply("554 5.7.1 message rejected")
                    else:
                        self.session["data"] = "\n".join(lines)
                        self.reply("250 queued")
                elif cmd == "RSET":
                    self.reply("250 ok")
                elif cmd == "QUIT":
                    self.reply("221 bye")
                    break
                else:
                    self.reply("502 not implemented")
        except (ConnectionError, ssl.SSLError, OSError):
            pass
        finally:
            with LOCK, open(ARGS.out, "a", encoding="utf-8") as f:
                f.write(json.dumps(self.session) + "\n")


LOCK = threading.Lock()


def main() -> None:
    global ARGS
    p = argparse.ArgumentParser()
    p.add_argument("--out", required=True)
    p.add_argument("--cert")
    p.add_argument("--key")
    p.add_argument("--behavior", default="ok")
    p.add_argument("--expect-pass", default="")
    ARGS = p.parse_args()
    socketserver.ThreadingTCPServer.allow_reuse_address = True
    with socketserver.ThreadingTCPServer(("127.0.0.1", 0), Handler) as server:
        server.daemon_threads = True
        print(server.server_address[1], flush=True)
        server.serve_forever()


if __name__ == "__main__":
    main()
