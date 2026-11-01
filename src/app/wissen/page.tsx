"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { getPublicWissenTopics } from "@/lib/knowledge/wissen-topics";
import { WISSEN_META } from "@/lib/knowledge/wissen-meta";
import {
  WISSEN_CATEGORIES,
  WISSEN_ENTRY_TOPIC_IDS,
  WISSEN_SECTION_ID,
  categoryForTopicId,
  getUrgentTopicIds,
} from "@/lib/knowledge/wissen-hub";
import { WISSEN_CATEGORY_CONFIG } from "@/lib/knowledge/wissen-categories";
import type { KnowledgeArticle } from "@/lib/types";
import { PageHeader } from "@/components/marketing/marketing-ui";
import { WissenMobileFilter, WissenSidebar } from "@/components/wissen/wissen-sidebar";
import { WissenTopicRow } from "@/components/wissen/wissen-topic-row";
import { useWissenScrollSpy } from "@/components/wissen/use-wissen-scroll-spy";
import { Button } from "@/components/ui/button";
import { KnowledgeAreasOverview } from "@/components/islamic-knowledge/knowledge-areas-overview";
import { matchesQuery, searchPreparedTopics, searchPublished } from "@/modules/islamic-knowledge";
import { Disclaimer } from "@/components/ui/disclaimer";
import { Search } from "lucide-react";
import { BRAND } from "@/lib/brand";

/** Everything a reader sees on a topic page, so the search finds what the page says. */
function topicSearchTexts(t: KnowledgeArticle): string[] {
  const d = t.details;
  return [
    t.title,
    t.summary,
    t.content,
    ...(d
      ? [d.whyImportant, d.ifMissing, d.safeStorage, d.tellFamily, ...d.prepareItems, ...(d.todayActions ?? []), ...d.documents, ...(d.legalNotes ?? []), ...d.commonMistakes, ...(d.janazahChecklist ?? [])]
      : []),
  ];
}

function enriched(): KnowledgeArticle[] {
  return getPublicWissenTopics().map((t) => ({ ...t, wissenMeta: WISSEN_META[t.id] }));
}

export default function WissenPage() {
  const [query, setQuery] = useState("");
  const topics = useMemo(() => enriched(), []);
  const isSearching = query.trim().length > 0;
  const islamicResults = useMemo(() => searchPublished(query), [query]);
  const preparedTopics = useMemo(() => (isSearching ? searchPreparedTopics(query) : []), [isSearching, query]);
  const { active, scrollToSection } = useWissenScrollSpy(!isSearching);

  const filtered = useMemo(() => {
    if (!query.trim()) return topics;
    return topics.filter((t) => matchesQuery(query, topicSearchTexts(t)));
  }, [topics, query]);

  const entryTopics = topics.filter((t) =>
    WISSEN_ENTRY_TOPIC_IDS.includes(t.id as (typeof WISSEN_ENTRY_TOPIC_IDS)[number])
  );
  const urgentTopics = topics.filter((t) => getUrgentTopicIds().includes(t.id));

  const topicsByCategory = useMemo(() => {
    const map = Object.fromEntries(WISSEN_CATEGORIES.map((c) => [c, [] as KnowledgeArticle[]])) as Record<
      (typeof WISSEN_CATEGORIES)[number],
      KnowledgeArticle[]
    >;
    for (const t of topics) {
      map[categoryForTopicId(t.id)].push(t);
    }
    return map;
  }, [topics]);

  return (
    <div className="bg-background min-h-screen pb-28">
      <div className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-10 md:py-14">
          <PageHeader
            title="Islamisches Wissen"
            description="Erbe, Tod, Janazah und Vorsorge — dauerhaft kostenlos, ohne Konto und ohne Werbung. Veröffentlicht wird nur, was Quellen- und Gelehrtenprüfung durchlaufen hat."
          />
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={22} aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Worüber möchtest du mehr wissen?"
              className="w-full pl-12 pr-5 py-4 rounded-2xl border-2 border-border bg-background text-foreground text-body-lg min-h-[56px] focus:border-primary focus:outline-none focus:ring-2 focus:ring-emerald/30"
              aria-label="Wissen durchsuchen"
            />
          </div>
        </div>
      </div>

      {!isSearching && (
        <section className="max-w-6xl mx-auto px-4 pt-8 md:pt-10" aria-labelledby="islamic-knowledge-heading">
          <h2 id="islamic-knowledge-heading" className="text-section-title font-bold text-foreground mb-2">
            Islamisches Wissenszentrum
          </h2>
          <p className="text-muted mb-5 max-w-3xl">
            Eine Sadaqa Jāriya: Alle religiösen Artikel bleiben kostenlos. Islamische Lehre und deutsches Recht werden getrennt erklärt.
          </p>
          <KnowledgeAreasOverview />
        </section>
      )}

      <div className="max-w-6xl mx-auto px-4 py-8 md:py-10">
        {!isSearching && (
          <WissenMobileFilter active={active} onSelect={scrollToSection} />
        )}

        <div className="grid lg:grid-cols-[220px_1fr] gap-8 lg:gap-10">
          {!isSearching && (
            <aside className="hidden lg:block">
              <div className="sticky top-24 rounded-2xl border border-border bg-card p-3">
                <WissenSidebar active={active} onSelect={scrollToSection} />
              </div>
            </aside>
          )}

          <main className="min-w-0 space-y-12 scroll-mt-28">
            {isSearching ? (
              <section>
                <h2 className="text-section-title font-bold text-foreground mb-5">
                  Suchergebnisse ({filtered.length + islamicResults.length})
                </h2>
                <div className="space-y-3">
                  {islamicResults.map((a) => (
                    <Link key={a.id} href={`/wissen/islam/${a.slug}`} className="block rounded-xl border border-border bg-card p-4 hover:border-primary/30">
                      <span className="font-semibold text-primary">{a.title}</span>
                      <span className="block text-sm text-muted">{a.summary}</span>
                    </Link>
                  ))}
                  {filtered.map((a) => (
                    <WissenTopicRow key={a.id} article={a} />
                  ))}
                </div>
                {filtered.length + islamicResults.length === 0 && (
                  <p className="text-center text-muted py-8 text-body" data-testid="knowledge-search-empty">
                    {preparedTopics.length > 0
                      ? "Dazu gibt es noch keinen veröffentlichten Artikel. Wir veröffentlichen erst nach fachlicher Prüfung."
                      : "Kein Thema gefunden — Suche anpassen."}
                  </p>
                )}
                {preparedTopics.length > 0 && (
                  <div className="rounded-xl border border-border bg-card p-4" data-testid="knowledge-search-prepared">
                    <h3 className="font-semibold text-foreground mb-2">Themen in Vorbereitung</h3>
                    <ul className="space-y-1 text-sm text-muted">
                      {preparedTopics.map((t) => (
                        <li key={`${t.areaTitle}-${t.id}`}>
                          {t.title} <span className="text-xs">({t.areaTitle})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            ) : topics.length === 0 ? (
              <section className="rounded-2xl border border-border bg-card p-8 text-center">
                <h2 className="text-section-title font-bold text-foreground mb-2">Wissensbereich in Vorbereitung</h2>
                <p className="text-muted">
                  Aktuell sind noch keine fachlich freigegebenen Wissensinhalte öffentlich verfügbar.
                </p>
              </section>
            ) : (
              <>
                <section id={WISSEN_SECTION_ID.entry} className="scroll-mt-28">
                  <h2 className="text-section-title font-bold text-foreground mb-5">Für deinen Einstieg</h2>
                  <div className="space-y-3">
                    {entryTopics.map((a) => (
                      <WissenTopicRow key={a.id} article={a} />
                    ))}
                  </div>
                </section>

                <section id={WISSEN_SECTION_ID.urgent} className="scroll-mt-28">
                  <h2 className="text-section-title font-bold text-foreground mb-5">Sofort wichtig</h2>
                  <div className="space-y-3">
                    {urgentTopics.map((a) => (
                      <WissenTopicRow key={a.id} article={a} compact />
                    ))}
                  </div>
                </section>

                {WISSEN_CATEGORIES.map((catId) => (
                  <section
                    key={catId}
                    id={WISSEN_SECTION_ID[catId]}
                    className="scroll-mt-28"
                    aria-labelledby={`wissen-heading-${catId}`}
                  >
                    <h2
                      id={`wissen-heading-${catId}`}
                      className="text-section-title font-bold text-foreground mb-2"
                    >
                      {WISSEN_CATEGORY_CONFIG[catId].label}
                    </h2>
                    <p className="text-body text-muted mb-5">
                      {topicsByCategory[catId].length} Themen in dieser Kategorie
                    </p>
                    <div className="space-y-3">
                      {topicsByCategory[catId].map((a) => (
                        <WissenTopicRow key={a.id} article={a} />
                      ))}
                    </div>
                  </section>
                ))}
              </>
            )}

            <div className="pt-4">
              <Link href="/check">
                <Button size="lg">{BRAND.ctaPrimary}</Button>
              </Link>
            </div>

            <Disclaimer type="islamic" />
          </main>
        </div>
      </div>
    </div>
  );
}
