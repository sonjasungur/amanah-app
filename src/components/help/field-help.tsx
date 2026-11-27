"use client";

import { useId, useRef, useState } from "react";
import Link from "next/link";
import { Info, X } from "lucide-react";
import { REVIEW_LABEL, type FieldHelpId, type FieldHelpView } from "@/lib/help/types";

/** Help texts change only with a release, so one request per text and page load is enough. */
const cache = new Map<string, Promise<FieldHelpView | null>>();

export function loadFieldHelp(id: FieldHelpId): Promise<FieldHelpView | null> {
  let pending = cache.get(id);
  if (!pending) {
    pending = fetch(`/api/help/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => (body?.help as FieldHelpView | undefined) ?? null)
      .catch(() => null);
    cache.set(id, pending);
    // A failed request may be tried again on the next opening.
    pending.then((v) => {
      if (!v) cache.delete(id);
    });
  }
  return pending;
}

/** For tests. */
export function clearFieldHelpCache() {
  cache.clear();
}

function Part({ title, children, testId }: { title: string; children?: React.ReactNode; testId: string }) {
  if (!children) return null;
  return (
    <span className="mt-2 block" data-testid={testId}>
      <b>{title}:</b> {children}
    </span>
  );
}

/**
 * AP22 EA-01.3 help module: an ⓘ button next to a field label that opens an explanation below it.
 * Term, Islamic guidance, differing views, room for own decisions, "Was du entscheidest", sources,
 * article link and the review status (always visible). A real button with aria-expanded and
 * aria-controls; Escape closes and returns focus to the button.
 */
export function FieldHelp({ id, label }: { id: FieldHelpId; label: string }) {
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [help, setHelp] = useState<FieldHelpView | null | undefined>(undefined);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && !help) {
      setHelp(undefined);
      void loadFieldHelp(id).then(setHelp);
    }
  };
  const close = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };

  return (
    <span className="contents" data-testid={`field-help-${id}`}>
      <button
        ref={buttonRef}
        type="button"
        className="ml-1 inline-grid h-7 w-7 place-items-center rounded-full text-primary hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`Erklärung: ${label}`}
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === "Escape" && open) close();
        }}
      >
        <Info size={18} aria-hidden />
      </button>
      {open && (
        <span
          id={panelId}
          role="region"
          aria-label={`Erklärung: ${label}`}
          aria-busy={help === undefined}
          className="mt-2 mb-2 block basis-full w-full max-w-prose rounded-xl border border-primary/20 bg-accent-soft/60 p-4 text-sm font-normal text-foreground"
          onKeyDown={(e) => {
            if (e.key === "Escape") close();
          }}
        >
          <span className="flex items-start justify-between gap-3">
            <strong className="text-primary-dark">{label}</strong>
            <button type="button" aria-label="Erklärung schließen" className="text-muted hover:text-foreground" onClick={close}>
              <X size={16} aria-hidden />
            </button>
          </span>
          {help === undefined && <span className="mt-1 block text-muted">Erklärung wird geladen …</span>}
          {help === null && <span className="mt-1 block text-muted">Die Erklärung konnte gerade nicht geladen werden. Bitte später noch einmal öffnen.</span>}
          {help && (
            <>
              <span className="mt-1 block" data-testid="field-help-begriff">{help.begriff}</span>
              <Part title="Islamische Vorgabe" testId="field-help-vorgabe">{help.vorgabe}</Part>
              <Part title="Auffassungen" testId="field-help-auffassungen">{help.auffassungen}</Part>
              <Part title="Spielraum" testId="field-help-spielraum">{help.spielraum}</Part>
              <Part title="Was du entscheidest" testId="field-help-entscheidung">{help.entscheidung}</Part>
              {help.restricted && (
                <span className="mt-2 block text-muted" data-testid="field-help-restricted">
                  Die religiöse Erklärung mit Quellen erscheint hier nach der fachlichen Prüfung.
                </span>
              )}
              {help.quellen.length > 0 && (
                <span className="mt-2 block" data-testid="field-help-quellen">
                  <b>Quellen:</b>
                  <span className="mt-1 block">
                    {help.quellen.map((q) => (
                      <span key={q.text} className="block">
                        {q.href ? (
                          <a href={q.href} className="underline text-primary" target={q.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
                            {q.text}
                          </a>
                        ) : (
                          q.text
                        )}
                      </span>
                    ))}
                  </span>
                </span>
              )}
              {help.artikelHref && (
                <span className="mt-2 block">
                  <Link href={help.artikelHref} className="underline text-primary" data-testid="field-help-artikel">
                    Mehr dazu im Wissenszentrum
                  </Link>
                </span>
              )}
            </>
          )}
          {/* Always visible, also while loading: until a documented review the text counts as unreviewed. */}
          <span className="mt-2 block text-xs font-semibold text-foreground" data-testid="field-help-pruefstatus">
            {REVIEW_LABEL[help?.pruefstatus ?? "ungeprueft"]}
          </span>
          <span className="mt-1 block text-xs text-muted">Allgemeine Orientierung, keine Rechts- oder Fatwa-Beratung.</span>
        </span>
      )}
    </span>
  );
}
