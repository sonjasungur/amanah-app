"use client";

import { useState } from "react";
import type { IslamicSource } from "@/lib/types";
import { getPrimarySourcesByIds, QURAN_ATTRIBUTION } from "@/lib/knowledge/sources";
import { groupedReferenceLabel } from "@/lib/knowledge/source-dedup";
import { BookOpen, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

const TYPE_LABEL: Record<string, string> = {
  quran: "Qur'an",
  hadith: "Hadith",
};

/** Displays Qur'an or Sahih hadith only — collapsible with aria-expanded */
export function PrimarySourceCard({
  source,
  defaultOpen = false,
  groupedRefs,
}: {
  source: IslamicSource;
  defaultOpen?: boolean;
  groupedRefs?: string | null;
}) {
  const [open, setOpen] = useState(defaultOpen);
  if (source.type !== "quran" && source.type !== "hadith") return null;

  const refLabel = groupedRefs ?? source.reference;
  const paraphrase = source.isParaphrase !== false && source.type === "hadith";
  const translationFooter =
    source.type === "quran"
      ? QURAN_ATTRIBUTION
      : paraphrase
        ? "Sinngemäße deutsche Wiedergabe — keine lizenzierte Originalübersetzung."
        : "Übersetzung (sinngemäß wo nicht anders gekennzeichnet)";

  return (
    <article className="rounded-xl border-2 border-primary/15 bg-card overflow-hidden shadow-sm">
      <button
        type="button"
        id={`source-toggle-${source.id}`}
        onClick={() => setOpen(!open)}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-sand/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/40 transition-colors min-h-[48px]"
        aria-expanded={open}
        aria-controls={`source-panel-${source.id}`}
      >
        <BookOpen size={18} className="text-primary shrink-0 mt-0.5" aria-hidden />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-primary">{TYPE_LABEL[source.type] ?? source.type}</p>
          <p className="font-semibold text-foreground text-sm mt-0.5">{source.title}</p>
          <p className="text-xs text-muted mt-1">{refLabel}</p>
        </div>
        {open ? <ChevronUp size={18} className="shrink-0 text-muted" aria-hidden /> : <ChevronDown size={18} className="shrink-0 text-muted" aria-hidden />}
      </button>
      {open && (
        <div id={`source-panel-${source.id}`} role="region" aria-labelledby={`source-toggle-${source.id}`} className="px-4 pb-4 pt-0 space-y-3 border-t border-primary/10 bg-sand/30">
          {source.translationDe && (
            <blockquote className="text-sm text-foreground/90 border-l-4 border-primary pl-3 leading-relaxed">
              {source.translationDe}
              <footer className="text-xs text-muted not-italic mt-2">{translationFooter}</footer>
            </blockquote>
          )}
          {source.translator && source.type === "quran" && (
            <p className="text-xs text-muted">
              Übersetzer: {source.translator}
              {source.translationVersion ? ` · ${source.translationVersion}` : ""}
            </p>
          )}
          {source.url && (
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline min-h-[44px]"
            >
              Quelle öffnen <ExternalLink size={14} aria-hidden />
            </a>
          )}
          {source.note && <p className="text-xs text-muted">{source.note}</p>}
          <p className="text-xs text-muted">Einordnung: Orientierung — keine individuelle Fatwa oder Rechtsberatung.</p>
        </div>
      )}
    </article>
  );
}

export function PrimarySourcesList({
  sourceIds,
  title = "Qur'an und authentische Sunnah",
  defaultCollapsed = true,
}: {
  sourceIds: string[];
  title?: string;
  defaultCollapsed?: boolean;
}) {
  const sources = getPrimarySourcesByIds(sourceIds);
  if (sources.length === 0) return null;
  const groupedRefs = groupedReferenceLabel(getPrimarySourcesByIds(sourceIds));
  const autoOpen = !defaultCollapsed && sources.length <= 2;

  return (
    <div className="space-y-3">
      {title ? <h4 className="text-base font-bold text-primary-dark">{title}</h4> : null}
      {sources.map((s) => (
        <PrimarySourceCard
          key={s.id}
          source={s}
          defaultOpen={autoOpen}
          groupedRefs={s.sourceGroup ? groupedRefs : null}
        />
      ))}
    </div>
  );
}
