"use client";

import { useId, useState } from "react";
import { Plus } from "lucide-react";
import { LETTER_PHRASES, LETTER_PHRASES_NOTICE, LETTER_RECIPIENTS, LETTER_TOPICS, type LetterRecipient } from "@/lib/family-letter/phrases";

/**
 * AP22 EA-17.1: optional wording help for the family letter. A click adds the sentence as a new
 * paragraph at the end of the letter; nothing is replaced, and the sentence can be changed freely.
 */
export function LetterPhrases({ onTake }: { onTake: (phrase: string) => void }) {
  const uid = useId();
  const [recipient, setRecipient] = useState<LetterRecipient>("kinder");
  const [announce, setAnnounce] = useState("");
  const phrases = LETTER_PHRASES[recipient];

  return (
    <details className="rounded-xl border border-border bg-card p-4" data-testid="letter-phrases">
      <summary className="cursor-pointer font-medium min-h-[44px] flex items-center">Formulierungshilfen (freiwillig)</summary>
      <div className="mt-3 space-y-4 text-sm">
        <p className="text-muted">
          Beispielsätze zum Übernehmen. Ein Klick fügt den Satz am Ende deines Briefs an; danach kannst du ihn frei ändern. Deine eigenen Worte sind immer die
          besten.
        </p>
        <p className="rounded-lg border border-warning/40 bg-warning/5 px-3 py-2" data-testid="letter-phrases-notice">
          {LETTER_PHRASES_NOTICE}
        </p>
        <fieldset>
          <legend className="font-medium mb-2">Für wen?</legend>
          <div className="flex flex-wrap gap-2">
            {LETTER_RECIPIENTS.map((r) => (
              <label
                key={r.id}
                className={`inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full border px-3 ${recipient === r.id ? "border-primary bg-primary/10" : "border-border"}`}
              >
                <input type="radio" name={`${uid}-recipient`} value={r.id} checked={recipient === r.id} onChange={() => setRecipient(r.id)} className="h-4 w-4" />
                {r.label}
              </label>
            ))}
          </div>
        </fieldset>
        {LETTER_TOPICS.map((t) => (
          <section key={t.id} aria-labelledby={`${uid}-${t.id}`}>
            <h3 id={`${uid}-${t.id}`} className="font-medium mb-1.5">
              {t.label}
            </h3>
            <ul className="space-y-2">
              {phrases[t.id].map((phrase) => (
                <li key={phrase}>
                  <button
                    type="button"
                    className="flex w-full items-start gap-2 rounded-lg border border-border px-3 py-2 text-left hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    onClick={() => {
                      onTake(phrase);
                      setAnnounce("Satz übernommen. Du kannst ihn im Brief frei ändern.");
                    }}
                    data-testid="letter-phrase"
                  >
                    <Plus size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden />
                    <span>
                      <span className="sr-only">Übernehmen: </span>
                      {phrase}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
        <p className="sr-only" aria-live="polite" data-testid="letter-phrase-status">
          {announce}
        </p>
      </div>
    </details>
  );
}
