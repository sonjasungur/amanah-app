"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ChevronDown, ChevronUp, Info, MessageSquarePlus, Plus, Star, Trash2 } from "lucide-react";
import { DateInput, Input, Textarea } from "@/components/ui/input";
import { FAMILIEN_GESPRAECH_TOPICS } from "@/lib/familiengespraech/topics";
import { importLegacyConversation, newTalk, useFamilienGespraechStore } from "@/lib/familiengespraech/store";
import { useAmanahStore } from "@/lib/store/use-amanah-store";
import { DOCUMENT_CHECKLIST } from "@/lib/vorsorge/documents";
import type { DocumentType, FamilyTalk } from "@/lib/domain/types";
import { formatDisplayDate } from "@/lib/utils/date-input";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Disclaimer } from "@/components/ui/disclaimer";
import { SaveBar } from "@/components/storage/save-bar";
import { PlusGate } from "@/components/billing/plus-gate";
import { cn } from "@/lib/utils/cn";

const toggle = <T extends string>(list: T[], id: T) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

const EXPLAINED: { value: FamilyTalk["storageExplained"]; label: string }[] = [
  { value: "", label: "Nicht angegeben" },
  { value: "ja", label: "Ja, erklärt" },
  { value: "teilweise", label: "Teilweise" },
  { value: "nein", label: "Noch nicht" },
];

/** One recorded conversation: who, when, topics, who takes on what, which papers they must know, what is open. */
function TalkCard({ talk, index }: { talk: FamilyTalk; index: number }) {
  const store = useFamilienGespraechStore();
  const people = useAmanahStore((s) => s.familyMembers);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const update = (patch: Partial<FamilyTalk>) => store.updateTalk(talk.id, patch);
  const base = `talk-${index}`;
  const names = [...people.filter((p) => talk.personIds.includes(p.id)).map((p) => p.name), talk.otherPeople.trim()].filter(Boolean).join(", ");

  return (
    <Card className="p-4 space-y-4" data-testid="talk-card">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <CardTitle className="text-base mb-0">Gespräch {talk.date ? `am ${formatDisplayDate(talk.date)}` : "(ohne Datum)"}</CardTitle>
          {names && <p className="text-xs text-muted mt-0.5">Mit: {names}</p>}
        </div>
        {confirmRemove ? (
          <div className="flex gap-2" role="group" aria-label="Gespräch entfernen bestätigen">
            <Button type="button" size="sm" variant="danger" onClick={() => store.removeTalk(talk.id)} data-testid="talk-remove-confirm">
              Wirklich entfernen
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setConfirmRemove(false)}>
              Abbrechen
            </Button>
          </div>
        ) : (
          <Button type="button" size="sm" variant="ghost" onClick={() => setConfirmRemove(true)} aria-label="Gespräch entfernen">
            <Trash2 size={16} aria-hidden />
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor={`${base}-date`} className="text-sm font-medium block mb-1">
            Wann (TT.MM.JJJJ)
          </label>
          <DateInput id={`${base}-date`} value={talk.date} onValueChange={(date) => update({ date })} testId="talk-date" draftKey={`talk.${talk.id}.date`} label="Gesprächsdatum" />
        </div>
        <div>
          <label htmlFor={`${base}-explained`} className="text-sm font-medium block mb-1">
            Aufbewahrungsort der Originale erklärt?
          </label>
          <select
            id={`${base}-explained`}
            className="w-full min-h-[44px] rounded-xl border border-border bg-card px-3 text-sm"
            value={talk.storageExplained}
            onChange={(e) => update({ storageExplained: e.target.value as FamilyTalk["storageExplained"] })}
            data-testid="talk-explained"
          >
            {EXPLAINED.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <fieldset>
        <legend className="text-sm font-medium mb-1">Wer war dabei?</legend>
        {/* Choosing from "Familie & Kontakte" is people management and stays Plus (Variante 1). */}
        <PlusGate feature="family_people">
        {people.length > 0 ? (
            <div className="flex flex-wrap gap-x-4">
              {people.map((p) => (
                <label key={p.id} className="flex items-center gap-2 min-h-[44px] text-sm">
                  <input type="checkbox" className="h-5 w-5" checked={talk.personIds.includes(p.id)} onChange={() => update({ personIds: toggle(talk.personIds, p.id) })} />
                  {p.name}
                  {p.relation ? <span className="text-muted">({p.relation})</span> : null}
                </label>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted">
              Noch keine Personen eingetragen. <Link href="/dashboard/personen" className="text-primary underline">Familie &amp; Kontakte</Link>
            </p>
          )}
        </PlusGate>
        <label htmlFor={`${base}-others`} className="sr-only">
          Wer war dabei (Namen)
        </label>
        <Input id={`${base}-others`} value={talk.otherPeople} onChange={(e) => update({ otherPeople: e.target.value })} placeholder="Wer war dabei? Namen, mit Komma getrennt" className="mt-1" data-testid="talk-others" />
      </fieldset>

      <fieldset>
        <legend className="text-sm font-medium mb-1">Worüber habt ihr gesprochen?</legend>
        <div className="grid gap-x-4 sm:grid-cols-2">
          {FAMILIEN_GESPRAECH_TOPICS.map((t) => (
            <label key={t.id} className="flex items-center gap-2 min-h-[44px] text-sm">
              <input type="checkbox" className="h-5 w-5" checked={talk.topicIds.includes(t.id)} onChange={() => update({ topicIds: toggle(talk.topicIds, t.id) })} />
              {t.title}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-medium mb-1">Welche Unterlagen sollen sie kennen?</legend>
        <p className="text-xs text-muted mb-1">Gemeint ist: Sie wissen, dass es das Dokument gibt und wo es liegt. Das gibt ihnen keine Befugnis.</p>
        <div className="grid gap-x-4 sm:grid-cols-2">
          {DOCUMENT_CHECKLIST.map((d) => (
            <label key={d.type} className="flex items-center gap-2 min-h-[44px] text-sm">
              <input type="checkbox" className="h-5 w-5" checked={talk.documentsToKnow.includes(d.type)} onChange={() => update({ documentsToKnow: toggle<DocumentType>(talk.documentsToKnow, d.type) })} />
              {d.title}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-medium mb-1">Wer übernimmt was?</legend>
        <ul className="space-y-2">
          {talk.tasks.map((task, i) => (
            <li key={task.id} className="grid gap-2 sm:grid-cols-[auto_minmax(0,10rem)_minmax(0,1fr)_auto] items-center">
              <label className="flex items-center gap-2 min-h-[44px] text-sm">
                <input type="checkbox" className="h-5 w-5" checked={task.done} onChange={() => update({ tasks: talk.tasks.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t)) })} />
                <span className="sr-only">Erledigt</span>
              </label>
              <Input aria-label={`Aufgabe ${i + 1}: wer`} value={task.who} placeholder="Wer" onChange={(e) => update({ tasks: talk.tasks.map((t) => (t.id === task.id ? { ...t, who: e.target.value } : t)) })} />
              <Input aria-label={`Aufgabe ${i + 1}: was`} value={task.what} placeholder="Was" onChange={(e) => update({ tasks: talk.tasks.map((t) => (t.id === task.id ? { ...t, what: e.target.value } : t)) })} />
              <Button type="button" size="sm" variant="ghost" aria-label={`Aufgabe ${i + 1} entfernen`} onClick={() => update({ tasks: talk.tasks.filter((t) => t.id !== task.id) })}>
                <Trash2 size={16} aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="mt-2"
          onClick={() => update({ tasks: [...talk.tasks, { id: `${talk.id}-task-${Date.now()}`, who: "", what: "", done: false }] })}
          data-testid="talk-add-task"
        >
          <Plus size={16} className="mr-1" aria-hidden /> Aufgabe hinzufügen
        </Button>
      </fieldset>

      <div>
        <label htmlFor={`${base}-open`} className="text-sm font-medium block mb-1">
          Was ist noch offen?
        </label>
        <Textarea id={`${base}-open`} rows={3} value={talk.openPoints} onChange={(e) => update({ openPoints: e.target.value })} className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm" data-testid="talk-open" />
      </div>
    </Card>
  );
}

export default function FamilienGespraechPage() {
  const [openId, setOpenId] = useState<string | null>(FAMILIEN_GESPRAECH_TOPICS[0]?.id ?? null);
  const store = useFamilienGespraechStore();
  const saveStatus = useAmanahStore((s) => s.saveStatus);

  // Notes from the old browser-only copy move into the folder once the account folder is known.
  useEffect(() => {
    importLegacyConversation();
  }, [saveStatus]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-primary mb-2">Gespräch mit Angehörigen</h1>
        <p className="text-muted text-sm max-w-2xl">
          Bereite ein ruhiges Gespräch vor und halte fest, was ihr besprochen habt: wer dabei war, wer was übernimmt, welche
          Unterlagen die anderen kennen sollen und was noch offen ist. Alles wird in deinem Vorsorgeordner gespeichert.
        </p>
        <p className="mt-3 flex gap-2 rounded-xl border border-border bg-sand/30 p-3 text-sm max-w-2xl" data-testid="talk-no-power">
          <Info size={16} className="text-primary shrink-0 mt-0.5" aria-hidden />
          Ein Eintrag oder Haken hier gibt niemandem Zugriff, keine Vollmacht und kein Recht, für dich zu entscheiden. Dafür
          braucht es eigene Dokumente in ihrer rechtlichen Form.
        </p>
      </header>

      <section className="space-y-3" aria-labelledby="talks-title" data-testid="talks">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="talks-title" className="text-lg font-semibold text-foreground">
            Geführte Gespräche
          </h2>
          <Button type="button" onClick={() => store.addTalk(newTalk())} data-testid="talk-add">
            <MessageSquarePlus size={16} className="mr-2" aria-hidden /> Gespräch eintragen
          </Button>
        </div>
        {store.talks.length === 0 ? (
          <p className="text-sm text-muted">Noch kein Gespräch eingetragen. Die Themen unten helfen bei der Vorbereitung.</p>
        ) : (
          store.talks.map((talk, i) => <TalkCard key={talk.id} talk={talk} index={i} />)
        )}
      </section>

      <section className="space-y-3" aria-labelledby="topics-title">
        <h2 id="topics-title" className="text-lg font-semibold text-foreground">
          Themen zur Vorbereitung
        </h2>
        <p className="text-xs text-muted" data-testid="topics-free-hint">
          Das Familiengespräch ist kostenlos – auch die Vorbereitungsfragen mit deinen eigenen Notizen.
        </p>
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
                  {total > 0 && <p className="text-xs text-muted mt-1">{done} von {total} Fragen besprochen</p>}
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
                    <Textarea
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
      </section>

      <SaveBar />
      <Disclaimer />
    </div>
  );
}
