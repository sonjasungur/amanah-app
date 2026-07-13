"use client";

import { useState } from "react";
import { FAMILIEN_GESPRAECH_TOPICS } from "@/lib/familiengespraech/topics";
import { useFamilienGespraechStore } from "@/lib/familiengespraech/store";
import { Card, CardTitle } from "@/components/ui/card";
import { Disclaimer } from "@/components/ui/disclaimer";
import { AlertTriangle, ChevronDown, ChevronUp, Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export default function FamilienGespraechPage() {
  const [openId, setOpenId] = useState<string | null>(FAMILIEN_GESPRAECH_TOPICS[0]?.id ?? null);
  const store = useFamilienGespraechStore();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-primary mb-2">Familiengespräch</h1>
        <p className="text-muted text-sm max-w-2xl">
          Orientierung für Gespräche beim Kennenlernen — keine individuelle Beratung. Hake Themen ab, markiere wichtige Fragen und notiere Gedanken lokal auf deinem Gerät.
        </p>
      </header>

      <div className="space-y-3">
        {FAMILIEN_GESPRAECH_TOPICS.map((topic) => {
          const progress = store.getTopic(topic.id);
          const open = openId === topic.id;
          const total = topic.questions.length;
          const done = progress.checkedQuestionIds.length;

          return (
            <Card key={topic.id} className="overflow-hidden">
              <button
                type="button"
                className="w-full flex items-center justify-between gap-3 p-4 text-left min-h-[44px] hover:bg-sand/40 transition-colors"
                onClick={() => setOpenId(open ? null : topic.id)}
                aria-expanded={open}
              >
                <div>
                  <CardTitle className="text-base">{topic.title}</CardTitle>
                  {total > 0 && (
                    <p className="text-xs text-muted mt-1">{done} von {total} Fragen besprochen</p>
                  )}
                </div>
                {open ? <ChevronUp size={18} className="text-muted shrink-0" /> : <ChevronDown size={18} className="text-muted shrink-0" />}
              </button>

              {open && (
                <div className="px-4 pb-4 space-y-4 border-t border-primary/5 pt-4">
                  <p className="text-sm text-muted">{topic.intro}</p>

                  {topic.warningSignals && (
                    <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 space-y-2">
                      <p className="text-sm font-semibold text-primary flex items-center gap-2">
                        <AlertTriangle size={16} className="text-warning" /> Warnsignale — im Zusammenhang betrachten
                      </p>
                      <ul className="text-sm text-muted space-y-1 list-disc pl-4">
                        {topic.warningSignals.map((w) => (
                          <li key={w}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {topic.questions.length > 0 && (
                    <ul className="space-y-3">
                      {topic.questions.map((q) => {
                        const checked = progress.checkedQuestionIds.includes(q.id);
                        const starred = progress.starredQuestionIds.includes(q.id);
                        return (
                          <li key={q.id} className="rounded-xl border border-primary/10 p-3">
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                id={q.id}
                                checked={checked}
                                onChange={() => store.toggleQuestion(topic.id, q.id)}
                                className="mt-1 h-5 w-5 rounded border-primary/30 accent-accent"
                                aria-label={`Frage abhaken: ${q.text}`}
                              />
                              <div className="flex-1 min-w-0">
                                <label htmlFor={q.id} className="text-sm font-medium text-primary cursor-pointer">
                                  {q.text}
                                </label>
                                {q.example && <p className="text-xs text-muted mt-1">Beispiel: {q.example}</p>}
                              </div>
                              <button
                                type="button"
                                onClick={() => store.toggleStar(topic.id, q.id)}
                                className={cn("p-2 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center", starred ? "text-accent" : "text-muted hover:text-accent")}
                                aria-label={starred ? "Markierung entfernen" : "Als wichtig markieren"}
                                aria-pressed={starred}
                              >
                                <Star size={18} fill={starred ? "currentColor" : "none"} />
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  <div>
                    <label htmlFor={`notes-${topic.id}`} className="text-sm font-medium text-primary block mb-2">
                      Eigene Notizen
                    </label>
                    <textarea
                      id={`notes-${topic.id}`}
                      value={progress.notes}
                      onChange={(e) => store.setNotes(topic.id, e.target.value)}
                      rows={3}
                      className="w-full rounded-xl border border-primary/15 bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                      placeholder="Gedanken, Antworten oder offene Punkte…"
                    />
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <Disclaimer />
    </div>
  );
}
