"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { useFieldCorrections, type DateDraft } from "@/lib/store/field-corrections";
import { Button } from "@/components/ui/button";

/**
 * Open date drafts outside their field (P2.6 owner acceptance): leaving the page says the input is still
 * open, other pages show it, and exports wait for it. Only an explicit "Änderung verwerfen" brings the
 * stored value back.
 */

const pathOf = (href: string) => href.split(/[?#]/)[0];
const noSubscribe = () => () => undefined;
export const draftSummary = (d: DateDraft) => `${d.label} „${d.text}“`;

const GOTO_EVENT = "amanah:goto-draft";

/**
 * Brings the person to an open draft: focuses it here, or opens its page and focuses it there. The page
 * change goes through DateDraftLeaveGuard (it holds the app router), so this works in any component.
 */
export function useGoToDraft() {
  return (key: string) => {
    const draft = useFieldCorrections.getState().open[key];
    const el = typeof document === "undefined" ? null : document.querySelector<HTMLInputElement>(`[data-draft-key="${CSS.escape(key)}"]`);
    if (el) {
      el.scrollIntoView({ block: "center" });
      el.focus();
      return;
    }
    if (!draft?.href) return;
    useFieldCorrections.getState().requestFocus(key);
    window.dispatchEvent(new CustomEvent(GOTO_EVENT, { detail: draft.href }));
  };
}

function DraftActions({ draftKey }: { draftKey: string }) {
  const goTo = useGoToDraft();
  const discard = useFieldCorrections((s) => s.discard);
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      <Button type="button" size="sm" onClick={() => goTo(draftKey)} data-testid="draft-goto">
        Zum Feld und korrigieren
      </Button>
      <Button type="button" size="sm" variant="outline" onClick={() => discard(draftKey)} data-testid="draft-discard">
        Änderung verwerfen
      </Button>
    </div>
  );
}

/**
 * On every dashboard page except the field's own: the input is still open. Shown at the top, so it is
 * seen after leaving through a link, the back button or a reload.
 */
export function DateDraftNotice() {
  const open = useFieldCorrections((s) => s.open);
  const pathname = usePathname() ?? "";
  // The drafts live in this tab's storage: shown only after hydration, never in server HTML.
  const mounted = useSyncExternalStore(noSubscribe, () => true, () => false);
  if (!mounted) return null;
  const elsewhere = Object.entries(open).filter(([, d]) => pathOf(d.href) !== pathname);
  if (!elsewhere.length) return null;
  return (
    <div className="no-print mb-4 space-y-2">
      {elsewhere.map(([key, d]) => (
        <section key={key} role="status" className="rounded-2xl border-2 border-destructive/50 bg-destructive/5 p-4" data-testid="draft-notice">
          <p className="flex items-start gap-2 font-semibold text-destructive">
            <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden />
            <span>Eingabe noch offen: {draftSummary(d)} ist noch nicht gespeichert.</span>
          </p>
          <p className="text-sm text-foreground/80 mt-1">{d.message}. Bis du es korrigierst oder verwirfst, zeigen Ausdrucke dieses Datum nicht und lassen sich nicht exportieren.</p>
          <DraftActions draftKey={key} />
        </section>
      ))}
    </div>
  );
}

/**
 * Leaving the field's page while a draft is open asks first: inside the app with a dialog, when closing or
 * reloading the tab with the browser's own question.
 */
export function DateDraftLeaveGuard() {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  // Asked on one page; a dialog left open does not follow the person to the next page.
  const [asked, setPending] = useState<{ href: string; key: string; draft: DateDraft; from: string } | null>(null);
  const pending = asked && asked.from === pathname ? asked : null;
  const discard = useFieldCorrections((s) => s.discard);
  const goTo = useGoToDraft();

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!Object.keys(useFieldCorrections.getState().open).length) return;
      event.preventDefault();
      event.returnValue = "";
    };
    const click = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const a = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      const here = Object.entries(useFieldCorrections.getState().open).find(([, d]) => pathOf(d.href) === window.location.pathname);
      if (!here) return;
      event.preventDefault();
      event.stopPropagation();
      setPending({ href: url.pathname + url.search + url.hash, key: here[0], draft: here[1], from: window.location.pathname });
    };
    const goTo = (event: Event) => router.push((event as CustomEvent<string>).detail);
    window.addEventListener("beforeunload", beforeUnload);
    window.addEventListener(GOTO_EVENT, goTo);
    document.addEventListener("click", click, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      window.removeEventListener(GOTO_EVENT, goTo);
      document.removeEventListener("click", click, true);
    };
  }, [router]);

  if (!pending) return null;
  const leave = () => {
    const href = pending.href;
    setPending(null);
    router.push(href);
  };
  return (
    <div className="no-print fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4" data-testid="draft-leave-dialog">
      <div role="alertdialog" aria-modal="true" aria-labelledby="draft-leave-title" aria-describedby="draft-leave-text" className="w-full max-w-md rounded-2xl bg-card p-5 shadow-xl">
        <h2 id="draft-leave-title" className="flex items-start gap-2 text-lg font-bold text-destructive">
          <AlertCircle size={20} className="mt-1 shrink-0" aria-hidden /> Eingabe noch offen
        </h2>
        <p id="draft-leave-text" className="mt-2 text-base">
          {draftSummary(pending.draft)} ist noch nicht gespeichert: {pending.draft.message}.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <Button type="button" autoFocus onClick={() => { setPending(null); goTo(pending.key); }} data-testid="draft-leave-stay">
            Bleiben und korrigieren
          </Button>
          <Button type="button" variant="outline" onClick={leave} data-testid="draft-leave-keep">
            Weitergehen, Eingabe bleibt offen
          </Button>
          <Button type="button" variant="ghost" onClick={() => { discard(pending.key); leave(); }} data-testid="draft-leave-discard">
            Änderung verwerfen und weitergehen
          </Button>
        </div>
      </div>
    </div>
  );
}

/** In place of print and PDF while a draft is open: exporting now would print the old date. */
export function DateDraftExportBlock() {
  const open = useFieldCorrections((s) => s.open);
  const entries = Object.entries(open);
  if (!entries.length) return null;
  return (
    <div className="rounded-xl border-2 border-destructive/50 bg-destructive/5 p-3 text-sm" role="status" data-testid="doc-export-blocked">
      <p className="flex items-start gap-2 font-semibold text-destructive">
        <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
        <span>Export gesperrt: {entries.map(([, d]) => draftSummary(d)).join(", ")} ist noch nicht gespeichert.</span>
      </p>
      <p className="mt-1">Bitte erst korrigieren oder die Änderung verwerfen. So entsteht kein Ausdruck mit einem veralteten Datum.</p>
      <DraftActions draftKey={entries[0][0]} />
    </div>
  );
}
