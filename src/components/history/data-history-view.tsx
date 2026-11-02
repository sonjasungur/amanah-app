"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FREE_ACCOUNT_SECTIONS } from "@/lib/billing/plan-matrix";
import { flattenForDisplay, sectionLabel } from "@/lib/history/display";
import { cancelPendingSave, useAmanahStore } from "@/lib/store/use-amanah-store";
import { pickDataFields } from "@/lib/store/store-utils";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import type { AmanahOrdnerData } from "@/lib/domain/types";

interface Version {
  id: string;
  changeType: string;
  sections: string[];
  createdAt: string;
}

interface VersionDetail extends Version {
  prior: Record<string, unknown> | null;
}

type Load = "loading" | "unavailable" | "signed_out" | "failed" | "ready";

const when = (iso: string) => new Date(iso).toLocaleString("de-DE");
const JSON_HEADERS = { "Content-Type": "application/json" };

/** Lists dates and kinds; content only for the version the person opens. Restoring needs a second, explicit step. */
export function DataHistoryView() {
  const [load, setLoad] = useState<Load>("loading");
  const [versions, setVersions] = useState<Version[]>([]);
  const [retentionDays, setRetentionDays] = useState(90);
  const [open, setOpen] = useState<VersionDetail | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [deleting, setDeleting] = useState<"all" | string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const confirmHeading = useRef<HTMLHeadingElement>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/amanah/history");
      if (res.status === 404) return setLoad("unavailable");
      if (res.status === 401) return setLoad("signed_out");
      if (!res.ok) return setLoad("failed");
      const body = (await res.json()) as { versions: Version[]; retentionDays: number };
      setVersions(body.versions);
      setRetentionDays(body.retentionDays);
      setLoad("ready");
    } catch {
      setLoad("failed");
    }
  }, []);

  useEffect(() => {
    // Subscribes to nothing: loads once when the view opens.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (confirming) confirmHeading.current?.focus();
  }, [confirming]);

  const closeVersion = () => {
    setOpen(null);
    setConfirming(false);
    setConfirmed(false);
    setDeleting(null);
  };

  const show = async (id: string) => {
    setError(null);
    setNotice(null);
    closeVersion();
    const res = await fetch(`/api/amanah/history/${encodeURIComponent(id)}`).catch(() => null);
    if (!res?.ok) return setError("Diese Version kann nicht angezeigt werden.");
    setOpen(((await res.json()) as { version: VersionDetail }).version);
  };

  const restore = async () => {
    if (!open || !confirmed) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/amanah/history/${encodeURIComponent(open.id)}/restore`, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ confirmed: true }),
    }).catch(() => null);
    setBusy(false);
    if (!res?.ok) return setError("Die Wiederherstellung hat nicht geklappt. Es wurde nichts geändert.");
    const { data, writeScope } = (await res.json()) as { data: AmanahOrdnerData; writeScope: string };
    cancelPendingSave();
    const store = useAmanahStore.getState();
    if (writeScope === "free_sections") {
      // Without Plus only free sections came back; what lives in this browser stays as it is.
      const free = Object.fromEntries(FREE_ACCOUNT_SECTIONS.map((section) => [section, data[section]]));
      store.importData({ ...pickDataFields(store), ...free } as AmanahOrdnerData);
      setNotice("Wiederhergestellt: nur die kostenlos gespeicherten Bereiche. Der vorige Stand steht jetzt ebenfalls im Verlauf.");
    } else {
      store.importData(data);
      setNotice("Wiederhergestellt. Der vorige Stand steht jetzt ebenfalls im Verlauf.");
    }
    closeVersion();
    await refresh();
  };

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    setError(null);
    const path = deleting === "all" ? "/api/amanah/history" : `/api/amanah/history/${encodeURIComponent(deleting)}`;
    const res = await fetch(path, { method: "DELETE" }).catch(() => null);
    setBusy(false);
    if (!res?.ok) return setError("Das Löschen hat nicht geklappt.");
    setNotice("Gelöscht.");
    closeVersion();
    await refresh();
  };

  if (load === "loading") return <p className="text-muted" role="status">Verlauf wird geladen …</p>;
  if (load !== "ready") {
    const text = {
      unavailable: "Der Verlauf ist noch nicht verfügbar.",
      signed_out: "Bitte melde dich an, um deinen Verlauf zu sehen.",
      failed: "Der Verlauf konnte nicht geladen werden.",
    }[load];
    return (
      <Card className="max-w-2xl" data-testid="history-unavailable">
        <CardTitle>Verlauf</CardTitle>
        <p className="text-sm text-muted">{text}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl" data-testid="data-history">
      <header>
        <h1 className="text-2xl font-bold text-primary mb-2">Verlauf deiner Angaben</h1>
        <p className="text-muted">
          Frühere Stände bleiben {retentionDays} Tage erhalten und werden danach automatisch gelöscht. Nur du kannst sie sehen. Sie sind kein Testament und keine rechtliche Verfügung.
        </p>
      </header>

      {error && <p className="text-sm text-danger" role="alert" data-testid="history-error">{error}</p>}
      {notice && <p className="text-sm text-success" role="status" data-testid="history-notice">{notice}</p>}

      {versions.length === 0 ? (
        <p className="text-sm text-muted" data-testid="history-empty">Noch keine früheren Stände.</p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-card" data-testid="history-list">
          {versions.map((v) => (
            <li key={v.id} className="flex flex-wrap items-center justify-between gap-3 p-3 text-sm">
              <div className="min-w-0">
                <p className="font-medium">{when(v.createdAt)} · {v.changeType === "restore" ? "Vor einer Wiederherstellung" : "Vor einer Änderung"}</p>
                <p className="text-muted break-words">{v.sections.length ? v.sections.map(sectionLabel).join(", ") : "Inhalt nicht lesbar"}</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => void show(v.id)} aria-label={`Stand vom ${when(v.createdAt)} ansehen`}>
                Ansehen
              </Button>
            </li>
          ))}
        </ul>
      )}

      {open && (
        <Card data-testid="history-version">
          <CardTitle className="text-base">Stand vor der Änderung vom {when(open.createdAt)}</CardTitle>
          {open.prior ? (
            Object.entries(open.prior).map(([section, value]) => {
              const rows = flattenForDisplay(value);
              return (
                <section key={section} className="mt-4">
                  <h2 className="font-semibold text-sm">{sectionLabel(section)}</h2>
                  {rows.length === 0 ? (
                    <p className="text-sm text-muted">Keine Angaben</p>
                  ) : (
                    <dl className="mt-1 text-sm">
                      {rows.map((row) => (
                        <div key={row.path} className="py-0.5">
                          <dt className="inline text-muted">{row.path}: </dt>
                          <dd className="inline whitespace-pre-wrap break-words">{row.text}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </section>
              );
            })
          ) : (
            <p className="mt-2 text-sm text-muted">Dieser Stand kann nicht mehr gelesen werden.</p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {open.prior && !confirming && (
              <Button type="button" onClick={() => setConfirming(true)} data-testid="history-restore">Diesen Stand wiederherstellen</Button>
            )}
            {!deleting && (
              <Button type="button" variant="outline" onClick={() => setDeleting(open.id)} data-testid="history-delete-version">Diesen und ältere Stände löschen</Button>
            )}
            <Button type="button" variant="outline" onClick={closeVersion}>Schließen</Button>
          </div>
          {confirming && (
            <div className="mt-4 rounded-lg border-2 border-warning bg-warning/10 p-3" role="group" aria-labelledby="history-confirm-heading" data-testid="history-confirm">
              <h2 id="history-confirm-heading" ref={confirmHeading} tabIndex={-1} className="font-semibold text-sm">Wirklich wiederherstellen?</h2>
              <p className="text-sm mt-1">Deine Angaben werden auf den Stand vor dieser Änderung zurückgesetzt, auch spätere Änderungen werden dabei zurückgenommen. Dein jetziger Stand bleibt als neuer Eintrag im Verlauf.</p>
              <label className="mt-2 flex items-start gap-2 text-sm">
                <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} data-testid="history-confirm-check" className="mt-1" />
                Ich möchte diesen Stand wiederherstellen.
              </label>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="button" disabled={!confirmed || busy} onClick={() => void restore()} data-testid="history-confirm-submit">Jetzt wiederherstellen</Button>
                <Button type="button" variant="outline" onClick={() => { setConfirming(false); setConfirmed(false); }}>Abbrechen</Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {versions.length > 0 && !deleting && (
        <Button type="button" variant="outline" onClick={() => setDeleting("all")} data-testid="history-delete-all">Gesamten Verlauf löschen</Button>
      )}
      {deleting && (
        <div className="rounded-lg border-2 border-danger/40 p-3" role="alertdialog" aria-label="Löschen bestätigen" data-testid="history-delete-confirm">
          <p className="text-sm">{deleting === "all" ? "Den gesamten Verlauf löschen? Deine aktuellen Angaben bleiben erhalten." : "Diesen und alle älteren Stände löschen? Deine aktuellen Angaben bleiben erhalten."} Das lässt sich nicht rückgängig machen.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button type="button" disabled={busy} onClick={() => void remove()} data-testid="history-delete-submit">Endgültig löschen</Button>
            <Button type="button" variant="outline" onClick={() => setDeleting(null)}>Abbrechen</Button>
          </div>
        </div>
      )}
    </div>
  );
}
