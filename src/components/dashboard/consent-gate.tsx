"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAuthMode, getStorageMode } from "@/lib/auth/config";
import { CONSENT_PURPOSES } from "@/lib/consent/purposes";

const PURPOSE = CONSENT_PURPOSES.sensitive_folder_storage;

async function fetchConsentState(): Promise<"granted" | "missing" | "error"> {
  try {
    const res = await fetch("/api/consent");
    if (!res.ok) return "error";
    const body = await res.json();
    return body.status?.[PURPOSE.purpose]?.granted ? "granted" : "missing";
  } catch {
    return "error";
  }
}

/**
 * Server storage of the folder (health and religion-related data) needs explicit,
 * purpose-bound consent first. The checkbox is never pre-ticked.
 */
export function ConsentGate({ children }: { children: React.ReactNode }) {
  // Settings stay reachable without consent: export, withdrawal and account deletion must always work.
  const onSettings = usePathname().startsWith("/dashboard/einstellungen");
  const required = getStorageMode() === "api" && getAuthMode() === "api" && !onSettings;
  const [state, setState] = useState<"loading" | "granted" | "missing" | "error">(required ? "loading" : "granted");
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!required) return;
    let cancelled = false;
    void fetchConsentState().then((next) => {
      if (!cancelled) setState(next);
    });
    return () => {
      cancelled = true;
    };
  }, [required]);

  const grant = async () => {
    setBusy(true);
    const res = await fetch("/api/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ purpose: PURPOSE.purpose, version: PURPOSE.version, confirmed: true }),
    });
    setBusy(false);
    setState(res.ok ? "granted" : "error");
  };

  if (state === "granted") return children;
  if (state === "loading") {
    return (
      <div className="flex min-h-[30vh] items-center justify-center text-muted" role="status">
        <Loader2 className="animate-spin mr-2" size={20} aria-hidden /> Wird geladen …
      </div>
    );
  }

  return (
    <Card className="max-w-2xl border-2 border-primary/20" data-testid="consent-gate">
      <div className="flex items-center gap-3 mb-3">
        <ShieldCheck size={22} className="text-primary" aria-hidden />
        <CardTitle>{PURPOSE.title}</CardTitle>
      </div>
      <p className="text-sm text-muted mb-4">
        Bevor wir Angaben in deinem Konto speichern, brauchen wir deine ausdrückliche Einwilligung. Du kannst sie jederzeit in den
        Einstellungen widerrufen.
      </p>
      <label className="flex items-start gap-3 rounded-xl border border-border bg-background p-4 text-sm leading-relaxed cursor-pointer">
        <input
          type="checkbox"
          className="mt-1 h-5 w-5 shrink-0"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          data-testid="consent-checkbox"
        />
        <span>{PURPOSE.text}</span>
      </label>
      <p className="text-xs text-muted mt-2">
        Textversion {PURPOSE.version} · Entwurf, rechtlich noch nicht geprüft.{" "}
        <Link href="/datenschutz" className="underline">Datenschutz</Link>
      </p>
      {state === "error" && <p className="text-sm text-destructive mt-3" role="alert">Das hat nicht geklappt. Bitte später erneut versuchen.</p>}
      <Button type="button" className="mt-5" disabled={!checked || busy} onClick={() => void grant()} data-testid="consent-submit">
        Einwilligen und fortfahren
      </Button>
    </Card>
  );
}
