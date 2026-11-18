"use client";

import { useId, useState } from "react";
import { HelpCircle, X } from "lucide-react";
import { HELP_TOPICS, releasedHelp, type HelpTopic, type HelpTopicId } from "@/lib/content/help-topics";

/**
 * A small "?" next to a term. Opens a short, plain explanation below it; keyboard and screen reader
 * friendly (a real button with aria-expanded, Escape closes). Shows only neutral text until reviewed.
 */
export function HelpTip({ topic }: { topic: HelpTopicId }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const help: HelpTopic = HELP_TOPICS[topic];
  const reviewed = releasedHelp(topic);
  return (
    <span className="contents" data-testid={`help-${topic}`}>
      <button
        type="button"
        className="ml-1 inline-grid h-7 w-7 place-items-center rounded-full text-primary hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`Hilfe: ${help.title}`}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
      >
        <HelpCircle size={18} aria-hidden />
      </button>
      {open && (
        <span
          id={panelId}
          role="region"
          aria-label={`Erklärung: ${help.title}`}
          className="mt-2 mb-2 block basis-full w-full max-w-prose rounded-xl border border-primary/20 bg-accent-soft/60 p-4 text-sm font-normal text-foreground"
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
        >
          <span className="flex items-start justify-between gap-3">
            <strong className="text-primary-dark">{help.title}</strong>
            <button type="button" aria-label="Erklärung schließen" className="text-muted hover:text-foreground" onClick={() => setOpen(false)}>
              <X size={16} aria-hidden />
            </button>
          </span>
          <span className="mt-1 block">{help.meaning}</span>
          <span className="mt-2 block"><b>Warum wichtig:</b> {help.why}</span>
          <span className="mt-2 block"><b>Was du einträgst:</b> {help.enter}</span>
          {help.example && <span className="mt-2 block"><b>Beispiel:</b> {help.example}</span>}
          {reviewed && <span className="mt-2 block">{reviewed}</span>}
          <span className="mt-2 block"><b>Klären mit Fachleuten:</b> {help.ask}</span>
          <span className="mt-2 block text-xs text-muted">Allgemeine Orientierung, keine Rechts- oder Fatwa-Beratung.</span>
        </span>
      )}
    </span>
  );
}
