import { NextResponse } from "next/server";
import { isInternalToolsEnabled } from "@/lib/flags/internal-tools";
import { clearOutbox, getMailTransport, readOutbox } from "@/lib/server/mailer";
import { isLoopbackRequest } from "@/lib/server/loopback-request";

/**
 * The test mailbox („Testbriefkasten“): local development, E2E and the protected staging test run only.
 * It shows confirmation and password links, so it must never be reachable for ordinary users.
 *
 * Three locks, all server-side; any one missing answers 404:
 * 1. AMANAH_DEV_OUTBOX=true (or the internal tools) — production validation rejects both flags;
 * 2. the in-memory outbox transport — never with a real mail provider;
 * 3. a direct loopback request (owner order 23.11.2026): Host and X-Forwarded-Host must name localhost,
 *    127.0.0.1 or ::1. Through the public proxy the host is the public domain, so even with the proxy
 *    password and a signed-in account the mailbox answers 404. Test runs reach it via SSH tunnel only.
 */
function available(request: Request): boolean {
  return (
    (isInternalToolsEnabled() || process.env.AMANAH_DEV_OUTBOX === "true") &&
    getMailTransport() === "outbox" &&
    isLoopbackRequest(request)
  );
}

export async function GET(request: Request) {
  if (!available(request)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const to = new URL(request.url).searchParams.get("to") ?? undefined;
  return NextResponse.json({ messages: readOutbox(to) });
}

export async function DELETE(request: Request) {
  if (!available(request)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  clearOutbox();
  return NextResponse.json({ success: true });
}
