"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { useI18n } from "@/lib/i18n/context";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Disclaimer } from "@/components/ui/disclaimer";

interface AuthFormProps {
  mode: "login" | "register";
}

export function AuthForm({ mode }: AuthFormProps) {
  const { login, register, authMode } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result =
      mode === "login"
        ? await login({ email, password })
        : await register({ email, password, name });

    setLoading(false);
    if (result.success) {
      router.push("/dashboard");
    } else {
      setError(result.error ?? t("auth.error.generic"));
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
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
            <Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" variant={mode === "register" ? "primary" : "primary"} disabled={loading}>
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
            <>
              {t("auth.noAccount")}{" "}
              <Link href="/register" className="text-primary hover:underline">{t("auth.register")}</Link>
            </>
          ) : (
            <>
              {t("auth.hasAccount")}{" "}
              <Link href="/login" className="text-primary hover:underline">{t("auth.login")}</Link>
            </>
          )}
        </p>
      </Card>

      <Disclaimer type="legal" className="mt-6" />
      <p className="text-xs text-muted mt-4 text-center">{t("auth.privacyNote")}</p>
    </div>
  );
}
