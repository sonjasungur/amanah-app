"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { wissenTopics } from "@/lib/knowledge/wissen-topics";
import { WISSEN_META } from "@/lib/knowledge/wissen-meta";
import {
  WISSEN_CATEGORIES,
  WISSEN_CATEGORY_CONFIG,
  WISSEN_PRIORITY,
  categoryForTopicId,
  type WissenCategoryId,
} from "@/lib/knowledge/wissen-categories";
import type { KnowledgeArticle } from "@/lib/types";
import { PageHeader, CategoryBadge } from "@/components/marketing/marketing-ui";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Disclaimer } from "@/components/ui/disclaimer";
import { Search, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

function enriched(): KnowledgeArticle[] {
  return wissenTopics.map((t) => ({ ...t, wissenMeta: WISSEN_META[t.id] }));
}

export default function WissenPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<WissenCategoryId | "all">("all");
  const topics = useMemo(() => enriched(), []);

  const filtered = topics.filter((t) => {
    const q = query.toLowerCase();
    const matchQ = !q || t.title.toLowerCase().includes(q) || t.summary.toLowerCase().includes(q);
    const matchC = category === "all" || categoryForTopicId(t.id) === category;
    return matchQ && matchC;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 pb-28">
      <PageHeader
        title="Wissen, das dir Entscheidungen leichter macht"
        description="Finde schnell die Themen, die für deine aktuelle Situation wichtig sind."
      />

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Thema suchen…"
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-card text-primary text-base min-h-[48px]"
          aria-label="Wissen durchsuchen"
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        <button
          type="button"
          onClick={() => setCategory("all")}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium border min-h-[44px]",
            category === "all" ? "bg-primary text-white border-primary" : "bg-card border-border text-muted"
          )}
        >
          Alle Themen
        </button>
        {WISSEN_CATEGORIES.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setCategory(id)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium border min-h-[44px]",
              category === id ? "text-white border-transparent" : "bg-card border-border text-muted"
            )}
            style={category === id ? { backgroundColor: WISSEN_CATEGORY_CONFIG[id].accent } : undefined}
          >
            {WISSEN_CATEGORY_CONFIG[id].label}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {filtered.map((article) => {
          const catId = categoryForTopicId(article.id);
          const cat = WISSEN_CATEGORY_CONFIG[catId];
          const priority = WISSEN_PRIORITY[article.id] ?? "Frühzeitig klären";
          const summary = WISSEN_META[article.id]?.shortAnswer ?? article.summary;

          return (
            <Card key={article.id} className="flex flex-col h-full border-border hover:border-primary/30 transition-colors p-5">
              <div className="flex flex-wrap gap-2 mb-3">
                <CategoryBadge label={cat.label.split(" ")[0]} accent={cat.accent} />
                <span className="text-xs font-medium text-muted px-2 py-1 rounded-full bg-background border border-border">
                  {priority}
                </span>
              </div>
              <h2 className="text-lg font-bold text-primary mb-2">{article.title}</h2>
              <p className="text-base text-muted mb-4 flex-1 line-clamp-3">{summary}</p>
              <div className="flex flex-col gap-2 pt-2">
                <Link href={`/wissen/${article.slug}`}>
                  <Button size="sm" className="w-full min-h-[44px]">Mehr erfahren</Button>
                </Link>
                {article.details?.nextStepHref && (
                  <Link href={article.details.nextStepHref}>
                    <Button size="sm" variant="outline" className="w-full min-h-[44px]">
                      In meine Vorsorge übernehmen <ChevronRight size={14} className="ml-1" />
                    </Button>
                  </Link>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-muted py-12 text-base">Kein Thema gefunden — Suche oder Filter anpassen.</p>
      )}

      <div className="mt-10">
        <Link href="/check"><Button size="lg">Kostenlosen Check starten</Button></Link>
      </div>

      <div className="mt-8">
        <Disclaimer type="islamic" />
      </div>
    </div>
  );
}
