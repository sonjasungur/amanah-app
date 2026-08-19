"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const { t } = useI18n();

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="rounded-2xl border border-border bg-card p-8 text-center space-y-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-muted">404</p>
        <h1 className="text-2xl font-bold text-primary">{t("error.notFound.title")}</h1>
        <p className="text-muted">{t("error.notFound.body")}</p>
        <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
          <Link href="/">
            <Button>{t("error.notFound.home")}</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline">{t("error.notFound.plan")}</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
