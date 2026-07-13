"use client";

import { useState } from "react";
import type { IslamicSource } from "@/lib/types";
import { getPrimarySourcesByIds } from "@/lib/knowledge/sources";
import { BookOpen, ChevronDown, ChevronUp } from "lucide-react";

const TYPE_LABEL: Record<string, string> = {
  quran: "Qur'an",
  hadith: "Hadith",
};

/** Displays Qur'an or Sahih hadith only — no fiqh/blog sources */
export function PrimarySourceCard({ source, defaultOpen = false }: { source: IslamicSource; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  if (source.type !== "quran" && source.type !== "hadith") return null;

  return (
    <article className="rounded-xl border border-primary/10 bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-sand/50 transition-colors min-h-[44px]"
        aria-expanded={open}
      >
        <BookOpen size={18} className="text-accent shrink-0 mt-0.5" aria-hidden />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase text-accent">{TYPE_LABEL[source.type] ?? source.type}</p>
          <p className="font-medium text-primary text-sm">{source.title}</p>
          <p className="text-xs text-muted mt-1">{source.reference}</p>
        </div>
        {open ? <ChevronUp size={18} className="shrink-0 text-muted" /> : <ChevronDown size={18} className="shrink-0 text-muted" />}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-0 space-y-3 border-t border-primary/5">
          {source.translationDe && (
            <blockquote className="text-sm text-foreground/90 border-l-2 border-accent pl-3 italic">
              {source.translationDe}
              <footer className="text-xs text-muted not-italic mt-2">— Übersetzung (sinngemäß wo nicht anders gekennzeichnet)</footer>
            </blockquote>
          )}
          {source.note && <p className="text-xs text-muted">{source.note}</p>}
          <p className="text-xs text-muted">Einordnung: Orientierung — keine individuelle Fatwa oder Rechtsberatung.</p>
        </div>
      )}
    </article>
  );
}

export function PrimarySourcesList({ sourceIds, title = "Islamische Primärquellen" }: { sourceIds: string[]; title?: string }) {
  const sources = getPrimarySourcesByIds(sourceIds);
  if (sources.length === 0) return null;
  return (
    <div className="space-y-3">
      {title ? <h4 className="text-sm font-semibold text-primary">{title}</h4> : null}
      {sources.map((s) => (
        <PrimarySourceCard key={s.id} source={s} defaultOpen={sourceIds.length <= 2} />
      ))}
    </div>
  );
}
