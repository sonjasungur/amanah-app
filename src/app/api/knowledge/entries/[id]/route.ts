import { NextResponse } from "next/server";
import { getPublicEntry } from "@/lib/knowledge";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const entry = getPublicEntry(id);

  if (!entry) {
    return NextResponse.json({ error: "Eintrag nicht gefunden" }, { status: 404 });
  }

  return NextResponse.json({
    entry,
    disclaimer: "Allgemeine Orientierung — fachliche Prüfung empfohlen.",
  });
}
