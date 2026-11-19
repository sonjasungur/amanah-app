import { NextResponse } from "next/server";
import { isInternalToolsEnabled } from "@/lib/flags/internal-tools";
import { clearOutbox, getMailTransport, readOutbox } from "@/lib/server/mailer";

/**
 * Local development, E2E and staging only: read the in-memory outbox. 404 everywhere else.
 * AMANAH_DEV_OUTBOX enables just this endpoint (staging test accounts) without the internal
 * editorial tools; production validation rejects both flags.
 */
function available(): boolean {
  return (isInternalToolsEnabled() || process.env.AMANAH_DEV_OUTBOX === "true") && getMailTransport() === "outbox";
}

export async function GET(request: Request) {
  if (!available()) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const to = new URL(request.url).searchParams.get("to") ?? undefined;
  return NextResponse.json({ messages: readOutbox(to) });
}

export async function DELETE() {
  if (!available()) return NextResponse.json({ error: "Not found" }, { status: 404 });
  clearOutbox();
  return NextResponse.json({ success: true });
}
