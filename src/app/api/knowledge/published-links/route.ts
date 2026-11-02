import { NextResponse } from "next/server";
import { getPublishedArticles } from "@/modules/islamic-knowledge";

export const dynamic = "force-static";

/** Links for planning modules, published articles only: client code must not import the catalog. */
export function GET() {
  return NextResponse.json({
    articles: getPublishedArticles().map((a) => ({ id: a.id, slug: a.slug, title: a.title, area: a.area, subtopicId: a.subtopicId })),
  });
}
