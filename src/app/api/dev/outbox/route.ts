import { NextResponse } from "next/server";
import { isInternalToolsEnabled } from "@/lib/flags/internal-tools";
import { clearOutbox, getMailTransport, readOutbox } from "@/lib/server/mailer";

/** Local development and E2E only: read the in-memory outbox. 404 everywhere else. */
function available(): boolean {
  return isInternalToolsEnabled() && getMailTransport() === "outbox";
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
