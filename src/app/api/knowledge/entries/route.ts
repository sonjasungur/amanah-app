import { NextResponse } from "next/server";
import { listPublicEntries } from "@/lib/knowledge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const language = (searchParams.get("language") || "de") as "de" | "en";

  const entries = listPublicEntries(language);

  return NextResponse.json({
    language,
    count: entries.length,
    entries,
    disclaimer: "Organisationsinformation, nicht fachlich geprüft — keine Rechts-, Medizin- oder Fatwa-Beratung.",
  });
}
