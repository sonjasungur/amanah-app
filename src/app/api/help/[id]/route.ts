import { NextResponse } from "next/server";
import { isKnowledgePreviewEnabled } from "@/lib/flags/knowledge-preview";
import { getFieldHelp, toFieldHelpView } from "@/lib/help/registry";
import { isFieldHelpId } from "@/lib/help/types";

/** The preview switch is read at request time (staging may turn it on behind its password). */
export const dynamic = "force-dynamic";

/** AP22 EA-01.3: one field help text. No personal data; the same answer for everyone. */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!isFieldHelpId(id)) return NextResponse.json({ error: "Hilfetext nicht gefunden" }, { status: 404 });
  const entry = getFieldHelp(id);
  const preview = isKnowledgePreviewEnabled();
  // Knowledge-centre articles are reachable only with the preview switch (no article is published yet).
  // That every artikelSlug names an existing centre article is checked in ap22-welle2a.test.tsx,
  // so this route does not read the draft catalogue itself.
  const availableArticles = new Set(preview && entry.artikelSlug ? [entry.artikelSlug] : []);
  return NextResponse.json({ help: toFieldHelpView(entry, { preview, availableArticles }) });
}
