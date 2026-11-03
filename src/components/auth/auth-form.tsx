"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { useI18n } from "@/lib/i18n/context";
import { typedValue } from "@/lib/utils/form-input";
import { sanitizeReturnUrl, buildAuthHref } from "@/lib/auth/return-url";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Disclaimer } from "@/components/ui/disclaimer";
import { Logo } from "@/components/layout/logo";
import { isPublicRegistrationEnabled } from "@/lib/auth/public-registration";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/config";

interface AuthFormProps {
  mode: "login" | "register";
}

export function AuthForm({ mode }: AuthFormProps) {
  const { login, register, authMode } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = sanitizeReturnUrl(searchParams.get("returnUrl"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [unverified, setUnverified] = useState(false);
  const [resent, setResent] = useState(false);

  const resendVerification = async () => {
    await fetch("/api/auth/verify-email/resend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => undefined);
    setResent(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const typed = {
      email: typedValue(e.currentTarget, 'input[type="email"]'),
      password: typedValue(e.currentTarget, 'input[type="password"]'),
      name: mode === "register" ? typedValue(e.currentTarget, 'input:not([type="email"]):not([type="password"])') : name,
    };
    setEmail(typed.email);
    setPassword(typed.password);
    setName(typed.name);
    setError("");
    setLoading(true);

    const result =
      mode === "login"
        ? await login({ email: typed.email, password: typed.password })
        : await register(typed);

    setLoading(false);
    if ("pendingVerification" in result && result.pendingVerification) {
      setPendingVerification(true);
    } else if (result.success) {
      router.push(returnUrl);
    } else {
      setUnverified("code" in result && result.code === "email_unverified");
      setError(result.error ?? t("auth.error.generic"));
    }
  };

  if (pendingVerification) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <Logo className="mb-8 justify-center w-full" />
        <Card data-testid="auth-check-email">
          <CardTitle>Bitte prüfe dein Postfach</CardTitle>
          <p className="text-sm text-muted mt-3">
            Wenn die Angaben stimmen, haben wir dir eine E-Mail mit einem Bestätigungslink geschickt. Der Link ist 24 Stunden gültig.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Button type="button" variant="outline" onClick={() => void resendVerification()} disabled={resent}>
              {resent ? "Erneut gesendet" : "E-Mail erneut senden"}
            </Button>
            <Link href={buildAuthHref("/login", returnUrl)} className="text-sm text-primary text-center hover:underline">
              Zur Anmeldung
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const alternateHref = buildAuthHref(mode === "login" ? "/register" : "/login", returnUrl);
  const showRegister = isPublicRegistrationEnabled();

  if (mode === "register" && !showRegister) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <Logo className="mb-8 justify-center w-full" />
        <Card>
          <CardTitle>Registrierung derzeit nicht geöffnet</CardTitle>
          <p className="text-sm text-muted mt-3 mb-6">
            Der kostenlose Amanah-Check benötigt kein Konto. Öffentliche Serverkonten sind derzeit nicht freigeschaltet.
          </p>
          <Link href="/check" className="text-primary font-semibold hover:underline">
            Kostenlosen Check starten
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <Logo className="mb-8 justify-center w-full" />
      <Card>
        <CardTitle>{mode === "login" ? t("auth.loginTitle") : t("auth.registerTitle")}</CardTitle>
        <p className="text-sm text-muted mt-2 mb-6">
          {authMode === "api" ? t("auth.mode.apiHint") : t("auth.mode.localHint")}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label className="text-sm font-medium block mb-1">{t("auth.name")}</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("auth.namePlaceholder")} />
            </div>
          )}
          <div>
            <label className="text-sm font-medium block mb-1">{t("auth.email")}</label>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@beispiel.de" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">{t("auth.password")}</label>
            <Input type="password" required minLength={MIN_PASSWORD_LENGTH} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          {mode === "login" && authMode === "api" && (
            <p className="text-sm text-right -mt-2">
              <Link href="/passwort-vergessen" className="text-primary hover:underline">Passwort vergessen?</Link>
            </p>
          )}
          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
          {unverified && (
            <Button type="button" variant="outline" className="w-full" onClick={() => void resendVerification()} disabled={resent}>
              {resent ? "Bestätigungslink erneut gesendet" : "Bestätigungslink erneut senden"}
            </Button>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "…" : mode === "login" ? t("auth.login") : t("auth.register")}
          </Button>
        </form>

        {mode === "register" && (
          <p className="text-xs text-muted mt-4 text-center">
            Kostenloser Einstieg — kostenpflichtige Pakete sind klar gekennzeichnet unter{" "}
            <Link href="/preise" className="text-primary font-semibold hover:underline">Preise</Link>.
          </p>
        )}

        <p className="text-sm text-muted mt-6 text-center">
          {mode === "login" ? (
            showRegister ? (
            <>
              {t("auth.noAccount")}{" "}
              <Link href={alternateHref} className="text-primary hover:underline">{t("auth.register")}</Link>
            </>
            ) : (
              <>Kein Konto nötig — starte mit dem kostenlosen Check.</>
            )
          ) : (
            <>
              {t("auth.hasAccount")}{" "}
              <Link href={alternateHref} className="text-primary hover:underline">{t("auth.login")}</Link>
            </>
          )}
        </p>
      </Card>

      <Disclaimer type="legal" className="mt-6" />
      <p className="text-xs text-muted mt-4 text-center">{t("auth.privacyNote")}</p>
    </div>
  );
}
