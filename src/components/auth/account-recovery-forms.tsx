"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/layout/logo";
import { useAuth } from "@/lib/auth/context";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/config";
import { typedValue } from "@/lib/utils/form-input";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <Logo className="mb-8 justify-center w-full" />
      <Card>{children}</Card>
    </div>
  );
}

async function postJson(path: string, body: unknown) {
  const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return { ok: res.ok, body: await res.json().catch(() => ({})) };
}

/** Confirms the e-mail with the token from the link, then signs in. */
export function VerifyEmailForm() {
  const token = useSearchParams().get("token");
  const { adoptSession } = useAuth();
  const router = useRouter();
  const [state, setState] = useState<"working" | "done" | "failed">(token ? "working" : "failed");
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;
    void postJson("/api/auth/verify-email", { token }).then(async ({ ok, body }) => {
      if (!ok) return setState("failed");
      await adoptSession(body.session);
      setState("done");
      router.replace("/dashboard");
    });
  }, [token, adoptSession, router]);

  return (
    <Shell>
      <CardTitle>E-Mail-Adresse bestätigen</CardTitle>
      <p className="text-sm text-muted mt-3" role="status" data-testid="verify-email-state">
        {state === "working" && "Wird bestätigt …"}
        {state === "done" && "Bestätigt. Du wirst weitergeleitet …"}
        {state === "failed" && "Der Link ist ungültig oder abgelaufen. Melde dich an, um einen neuen Link anzufordern."}
      </p>
      {state === "failed" && (
        <Link href="/login" className="mt-6 inline-block text-primary font-semibold hover:underline">
          Zur Anmeldung
        </Link>
      )}
    </Shell>
  );
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const typed = typedValue(e.currentTarget, 'input[type="email"]');
    setEmail(typed);
    setBusy(true);
    const { body } = await postJson("/api/auth/password-reset/request", { email: typed });
    setMessage(body.message ?? body.error ?? "Bitte prüfe dein Postfach.");
    setBusy(false);
  };

  return (
    <Shell>
      <CardTitle>Passwort vergessen</CardTitle>
      <p className="text-sm text-muted mt-2 mb-6">Gib die E-Mail-Adresse deines Kontos ein. Wir schicken dir einen Link, der 30 Minuten gültig ist.</p>
      {message ? (
        <p className="text-sm" role="status" data-testid="forgot-password-message">{message}</p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <label className="text-sm font-medium block">
            E-Mail
            <Input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" />
          </label>
          <Button type="submit" className="w-full" disabled={busy}>Link anfordern</Button>
        </form>
      )}
      <Link href="/login" className="mt-6 inline-block text-sm text-primary hover:underline">Zur Anmeldung</Link>
    </Shell>
  );
}

export function ResetPasswordForm() {
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const [first, second] = [...e.currentTarget.querySelectorAll<HTMLInputElement>('input[type="password"]')].map((input) => input.value);
    setPassword(first);
    setRepeat(second);
    if (first !== second) return setResult({ ok: false, text: "Die Passwörter stimmen nicht überein." });
    setBusy(true);
    const { ok, body } = await postJson("/api/auth/password-reset/confirm", { token, password: first });
    setResult({ ok, text: body.message ?? body.error ?? "" });
    setBusy(false);
  };

  return (
    <Shell>
      <CardTitle>Neues Passwort festlegen</CardTitle>
      {result?.ok ? (
        <>
          <p className="text-sm mt-3" role="status" data-testid="reset-password-done">{result.text}</p>
          <Link href="/login" className="mt-6 inline-block text-primary font-semibold hover:underline">Zur Anmeldung</Link>
        </>
      ) : (
        <form onSubmit={submit} className="space-y-4 mt-6">
          <label className="text-sm font-medium block">
            Neues Passwort (mind. {MIN_PASSWORD_LENGTH} Zeichen)
            <Input type="password" required minLength={MIN_PASSWORD_LENGTH} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" />
          </label>
          <label className="text-sm font-medium block">
            Passwort wiederholen
            <Input type="password" required minLength={MIN_PASSWORD_LENGTH} autoComplete="new-password" value={repeat} onChange={(e) => setRepeat(e.target.value)} className="mt-1" />
          </label>
          {result && <p className="text-sm text-destructive" role="alert">{result.text}</p>}
          <Button type="submit" className="w-full" disabled={busy || !token}>Passwort speichern</Button>
          <p className="text-xs text-muted">Danach wirst du auf allen Geräten abgemeldet.</p>
        </form>
      )}
    </Shell>
  );
}
