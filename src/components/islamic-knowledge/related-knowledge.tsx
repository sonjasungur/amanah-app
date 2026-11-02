"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import type { KnowledgeAreaId } from "@/modules/islamic-knowledge/types";

interface PublishedLink {
  id: string;
  slug: string;
  title: string;
  area: KnowledgeAreaId;
  subtopicId: string;
}

/**
 * Links a planning module to free knowledge articles. Renders nothing until
 * a matching article is published — never links to unreviewed content.
 * Asks the server, because the catalog with its drafts must stay out of browser code.
 */
export function RelatedKnowledge({ topics }: { topics: { area: KnowledgeAreaId; subtopicId: string }[] }) {
  const [published, setPublished] = useState<PublishedLink[]>([]);
  useEffect(() => {
    let current = true;
    fetch("/api/knowledge/published-links")
      .then((res) => (res.ok ? res.json() : { articles: [] }))
      .then((body: { articles: PublishedLink[] }) => {
        if (current) setPublished(body.articles);
      })
      .catch(() => undefined);
    return () => {
      current = false;
    };
  }, []);
  const articles = published.filter((a) => topics.some((t) => t.area === a.area && t.subtopicId === a.subtopicId));
  if (articles.length === 0) return null;

  return (
    <aside className="mt-6 rounded-xl border border-border bg-card p-4" data-testid="related-knowledge">
      <p className="text-sm font-semibold text-primary flex items-center gap-2 mb-2">
        <BookOpen size={16} aria-hidden /> Kostenloses Wissen dazu
      </p>
      <ul className="space-y-1">
        {articles.map((a) => (
          <li key={a.id}>
            <Link href={`/wissen/islam/${a.slug}`} className="text-sm text-primary hover:underline">
              {a.title}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
