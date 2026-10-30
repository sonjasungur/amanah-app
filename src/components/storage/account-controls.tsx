"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiAuthProvider } from "@/lib/auth/api-auth-provider";
import { resetAmanahStore } from "@/lib/store/use-amanah-store";

/** Server accounts only: full export (Art. 15/20 DSGVO) and complete deletion (Art. 17). */
export function AccountControls() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const deleteAccount = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Löschen fehlgeschlagen.");
      // The account is gone on the server: drop the session hint first so the
      // store reset only clears this device instead of calling the API again.
      await apiAuthProvider.logout();
      await resetAmanahStore();
      router.replace("/");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Löschen fehlgeschlagen.");
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4" data-testid="account-controls">
      <a
        href="/api/account/export"
        download
        className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline min-h-[44px]"
        data-testid="account-export-link"
      >
        <Download size={16} aria-hidden /> Alle Kontodaten herunterladen (JSON)
      </a>

      {!open ? (
        <Button type="button" variant="danger" size="sm" onClick={() => setOpen(true)} data-testid="account-delete-open">
          <UserX size={14} className="mr-1.5" aria-hidden /> Konto vollständig löschen
        </Button>
      ) : (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3" role="alert">
          <p className="text-sm text-destructive">
            Konto, Anmeldungen und alle gespeicherten Angaben werden endgültig gelöscht. Lade vorher deine Daten herunter,
            wenn du sie behalten möchtest.
          </p>
          <label className="block text-sm font-medium">
            Passwort zur Bestätigung
            <Input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1"
              data-testid="account-delete-password"
            />
          </label>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="danger"
              size="sm"
              disabled={busy || !password}
              onClick={() => void deleteAccount()}
              data-testid="account-delete-confirm"
            >
              {busy ? "Wird gelöscht …" : "Endgültig löschen"}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
              Abbrechen
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
