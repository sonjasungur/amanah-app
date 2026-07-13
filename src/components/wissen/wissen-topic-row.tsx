"use client";

import type { KnowledgeArticle } from "@/lib/types";
import Link from "next/link";
import {
  WISSEN_CATEGORY_CONFIG,
  WISSEN_PRIORITY,
  categoryForTopicId,
} from "@/lib/knowledge/wissen-categories";
import { getReadMinutes, getSourceLabel } from "@/lib/knowledge/wissen-hub";
import { CategoryBadge } from "@/components/marketing/marketing-ui";
import { cn } from "@/lib/utils/cn";
import { ChevronRight } from "lucide-react";

export function WissenTopicRow({
  article,
  compact,
}: {
  article: KnowledgeArticle;
  compact?: boolean;
}) {
  const href = `/wissen/${article.slug}`;
  const catId = categoryForTopicId(article.id);
  const cat = WISSEN_CATEGORY_CONFIG[catId];
  const priority = WISSEN_PRIORITY[article.id] ?? "Frühzeitig klären";
  const summary = article.wissenMeta?.shortAnswer ?? article.summary;
  const source = getSourceLabel(article.id);
  const minutes = getReadMinutes(article.id);

  return (
    <Link
      href={href}
      className={cn(
        "group block rounded-xl border border-border bg-card overflow-hidden shadow-sm",
        "hover:shadow-md hover:border-primary/25 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald focus-visible:ring-offset-2"
      )}
      aria-label={`${article.title} — Thema öffnen`}
    >
      <div className="h-1.5 w-full md:hidden" style={{ backgroundColor: cat.accent }} aria-hidden />
      <div className="flex flex-col md:flex-row md:items-stretch">
        <div
          className="hidden md:block w-1.5 shrink-0 self-stretch min-h-full"
          style={{ backgroundColor: cat.accent }}
          aria-hidden
        />
        <div className={cn("flex-1 p-4 md:p-5 md:px-6", compact ? "py-4" : "py-5")}>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <CategoryBadge
              label={compact ? cat.label.split(" und ")[0] : cat.label}
              accent={cat.accent}
            />
            <span className="text-xs font-bold text-muted px-2 py-0.5 rounded bg-background border border-border">
              {priority}
            </span>
            {!compact && <span className="text-xs text-muted">{minutes} Min. Lesezeit</span>}
          </div>
          <h3 className="text-card-title font-bold text-foreground group-hover:text-primary transition-colors">
            {article.title}
          </h3>
          <p className={cn("text-muted mt-1 leading-relaxed", compact ? "text-sm line-clamp-2" : "text-body line-clamp-2")}>
            {summary}
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
            <span className="text-xs font-medium text-muted">
              {source}
              {compact ? ` · ${minutes} Min.` : ""}
            </span>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary min-h-[44px]">
              Thema öffnen <ChevronRight size={16} aria-hidden />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
