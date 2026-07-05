import { NextResponse } from "next/server";
import { searchKnowledgeEntries } from "@/lib/knowledge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const language = (searchParams.get("language") || "de") as "de" | "en";

  if (!q) {
    return NextResponse.json({ error: "Parameter q erforderlich" }, { status: 400 });
  }

  const results = searchKnowledgeEntries(q, language).map((r) => ({
    id: r.entry.id,
    title: r.entry.title,
    category: r.entry.category,
    summary: r.entry.summary,
    sourceLabel: r.entry.sourceLabel,
    reviewedStatus: r.entry.reviewedStatus,
    score: r.score,
  }));

  return NextResponse.json({
    query: q,
    language,
    count: results.length,
    results,
    disclaimer: "Allgemeine Orientierung — fachliche Prüfung empfohlen.",
  });
}
