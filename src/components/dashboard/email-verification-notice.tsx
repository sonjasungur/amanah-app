"use client";

import { useState } from "react";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/context";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/**
 * Accounts from before e-mail confirmation keep their data and are asked to confirm.
 * After the deadline, reading, export and deletion stay possible; saving is paused.
 */
export function EmailVerificationNotice() {
  const { session } = useAuth();
  const [state, setState] = useState<"idle" | "busy" | "sent" | "error">("idle");
  const info = session?.user.emailVerification;
  if (!info || (info.status !== "legacy_grace" && info.status !== "legacy_overdue")) return null;
  const overdue = info.status === "legacy_overdue";

  const send = async () => {
    setState("busy");
    try {
      const res = await fetch("/api/auth/verify-email/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      setState(res.ok ? "sent" : "error");
    } catch {
      setState("error");
    }
  };

  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm flex items-start gap-3 mb-6 ${overdue ? "border-destructive/40 bg-destructive/5" : "border-warning/40 bg-warning/10"}`}
      role="status"
      data-testid="email-verification-notice"
      data-status={info.status}
    >
      <MailCheck size={18} className="shrink-0 mt-0.5 text-primary" aria-hidden />
      <div className="space-y-2">
        <p className="font-semibold">Bitte bestätige deine E-Mail-Adresse</p>
        {overdue ? (
          <p className="text-muted">
            Die Frist ist abgelaufen. Deine Daten kannst du weiterhin ansehen, exportieren und löschen. Neue Angaben speichern wir erst
            nach der Bestätigung.
          </p>
        ) : (
          <p className="text-muted">
            Dein Konto besteht schon länger. Damit wir dich bei Bedarf sicher erreichen und dein Passwort zurücksetzen können, bestätige
            bitte deine Adresse{info.deadline ? ` bis zum ${formatDate(info.deadline)}` : ""}. Bis dahin funktioniert alles wie gewohnt.
          </p>
        )}
        {state === "sent" ? (
          <p className="text-primary" data-testid="email-verification-sent">
            Wir haben dir einen Bestätigungslink geschickt. Bitte prüfe dein Postfach.
          </p>
        ) : (
          <Button type="button" size="sm" disabled={state === "busy"} onClick={() => void send()} data-testid="email-verification-send">
            Bestätigungslink senden
          </Button>
        )}
        {state === "error" && (
          <p className="text-destructive" role="alert">
            Das hat nicht geklappt. Bitte versuche es später erneut.
          </p>
        )}
      </div>
    </div>
  );
}
