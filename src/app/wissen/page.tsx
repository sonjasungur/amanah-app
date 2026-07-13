"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { wissenTopics } from "@/lib/knowledge/wissen-topics";
import { WISSEN_FILTER_LABELS, WISSEN_META, URGENCY_STYLES } from "@/lib/knowledge/wissen-meta";
import type { KnowledgeArticle, WissenFilter } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Disclaimer } from "@/components/ui/disclaimer";
import { Search, ChevronRight, BookOpen } from "lucide-react";

function enriched(): KnowledgeArticle[] {
  return wissenTopics.map((t) => ({ ...t, wissenMeta: WISSEN_META[t.id] }));
}

export default function WissenPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<WissenFilter | "all">("all");
  const topics = useMemo(() => enriched(), []);

  const filtered = topics.filter((t) => {
    const q = query.toLowerCase();
    const matchQ = !q || t.title.toLowerCase().includes(q) || t.summary.toLowerCase().includes(q);
    const matchF = filter === "all" || t.wissenMeta?.filters.includes(filter);
    return matchQ && matchF;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 pb-24">
      <div className="mb-8">
        <p className="text-accent font-semibold uppercase text-sm tracking-wide mb-2 flex items-center gap-2">
          <BookOpen size={18} /> Wissen
        </p>
        <h1 className="text-3xl font-bold text-primary mb-3">Orientierung — nicht erschlagen</h1>
        <p className="text-muted">Kategorien, Kurzantworten, Detail bei Bedarf. Keine Fatwa, keine Rechtsberatung.</p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Thema suchen…"
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-primary/15 bg-card text-primary"
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-full text-sm font-medium border ${filter === "all" ? "bg-primary text-white border-primary" : "bg-card border-primary/15 text-muted"}`}
        >
          Alle
        </button>
        {(Object.keys(WISSEN_FILTER_LABELS) as WissenFilter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border ${filter === f ? "bg-accent text-white border-accent" : "bg-card border-primary/15 text-muted"}`}
          >
            {WISSEN_FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {filtered.map((article) => {
          const meta = article.wissenMeta;
          return (
            <Card key={article.id} className="flex flex-col h-full hover:border-accent/40 transition-colors">
              <div className="flex flex-wrap gap-2 mb-3">
                {meta && (
                  <span className={`text-xs font-semibold uppercase px-2 py-0.5 rounded-full border ${URGENCY_STYLES[meta.urgency]}`}>
                    {meta.urgency === "hoch" ? "Dringlichkeit: Hoch" : meta.urgency === "mittel" ? "Mittel" : "Später"}
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold text-primary mb-2">{article.title}</h2>
              {meta && <p className="text-sm text-muted mb-2"><span className="font-medium text-primary">Für wen:</span> {meta.audience.join(" · ")}</p>}
              <p className="text-sm text-foreground/80 mb-4 flex-1">{meta?.shortAnswer ?? article.summary}</p>
              <div className="flex flex-wrap gap-2 pt-2">
                <Link href={`/wissen/${article.slug}`}>
                  <Button size="sm">Mehr lesen</Button>
                </Link>
                {article.details?.nextStepHref && (
                  <Link href={article.details.nextStepHref}>
                    <Button size="sm" variant="outline">In Ordner übernehmen <ChevronRight size={14} className="ml-1" /></Button>
                  </Link>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-muted py-12">Kein Thema gefunden — Filter oder Suche anpassen.</p>
      )}

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/check"><Button size="lg">Amanah-Check starten</Button></Link>
        <Link href="/konvertierte"><Button size="lg" variant="outline">Für Konvertierte</Button></Link>
      </div>

      <div className="mt-8 space-y-4">
        <Disclaimer type="islamic" />
        <Disclaimer />
      </div>
    </div>
  );
}
