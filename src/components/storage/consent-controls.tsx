"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CONSENT_PURPOSES } from "@/lib/consent/purposes";
import { resetAmanahStore } from "@/lib/store/use-amanah-store";

const PURPOSE = CONSENT_PURPOSES.sensitive_folder_storage;

interface ConsentHistoryEntry {
  textVersion: string;
  grantedAt: string;
  revokedAt: string | null;
}

async function fetchConsent(): Promise<{ granted: boolean; history: ConsentHistoryEntry[] } | null> {
  const res = await fetch("/api/consent");
  if (!res.ok) return null;
  const body = await res.json();
  return { granted: Boolean(body.status?.[PURPOSE.purpose]?.granted), history: body.history ?? [] };
}

/** Status, proof and withdrawal of the storage consent (settings page, API mode). */
export function ConsentControls() {
  const [granted, setGranted] = useState<boolean | null>(null);
  const [history, setHistory] = useState<ConsentHistoryEntry[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState("");

  const apply = (next: Awaited<ReturnType<typeof fetchConsent>>) => {
    if (!next) return;
    setGranted(next.granted);
    setHistory(next.history);
  };

  useEffect(() => {
    void fetchConsent().then(apply);
  }, []);

  const withdraw = async () => {
    const res = await fetch("/api/consent", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ purpose: PURPOSE.purpose }),
    });
    const body = await res.json();
    setConfirming(false);
    setMessage(res.ok ? body.message : body.error ?? "Widerruf fehlgeschlagen.");
    // The server copy is gone; reset the working copy so autosave does not try to re-upload.
    if (res.ok) await resetAmanahStore();
    apply(await fetchConsent());
  };

  return (
    <div className="space-y-3 text-sm" data-testid="consent-controls">
      <p>
        <span className="font-semibold">{PURPOSE.title}:</span>{" "}
        {granted === null ? "…" : granted ? "erteilt" : "nicht erteilt"}
      </p>
      {history.length > 0 && (
        <ul className="text-xs text-muted space-y-1" aria-label="Nachweis deiner Einwilligungen">
          {history.map((h) => (
            <li key={`${h.textVersion}-${h.grantedAt}`}>
              Version {h.textVersion}: erteilt {new Date(h.grantedAt).toLocaleString("de-DE")}
              {h.revokedAt ? ` · widerrufen ${new Date(h.revokedAt).toLocaleString("de-DE")}` : ""}
            </li>
          ))}
        </ul>
      )}
      {granted && !confirming && (
        <Button type="button" variant="outline" size="sm" onClick={() => setConfirming(true)} data-testid="consent-withdraw-open">
          Einwilligung widerrufen
        </Button>
      )}
      {confirming && (
        <div className="rounded-xl border border-warning/40 bg-warning/5 p-3 space-y-2" role="alert">
          <p>{PURPOSE.onWithdraw}</p>
          <div className="flex gap-2">
            <Button type="button" variant="danger" size="sm" onClick={() => void withdraw()} data-testid="consent-withdraw-confirm">
              Widerrufen
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setConfirming(false)}>Abbrechen</Button>
          </div>
        </div>
      )}
      {granted === false && (
        <Link href="/dashboard" className="text-primary hover:underline">Einwilligung erteilen, um Daten im Konto zu speichern</Link>
      )}
      {message && <p role="status">{message}</p>}
    </div>
  );
}
