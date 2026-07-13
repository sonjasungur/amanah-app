"use client";

import dynamic from "next/dynamic";
import { StorageModeBanner } from "@/components/auth/storage-mode-banner";
import { Disclaimer } from "@/components/ui/disclaimer";
import { MobileStickyCta } from "@/components/layout/mobile-sticky-cta";
import { CHECK_TOTAL } from "@/lib/check/questions";

const AmanahCheck = dynamic(
  () => import("@/components/check/amanah-check").then((m) => ({ default: m.AmanahCheck })),
  {
    ssr: false,
    loading: () => (
      <div className="max-w-lg mx-auto p-8 text-center text-muted rounded-2xl bg-card border border-primary/10">
        Check wird geladen…
      </div>
    ),
  }
);

export default function CheckPage() {
  return (
    <>
      <div className="max-w-3xl mx-auto px-4 py-12 pb-24">
        <StorageModeBanner className="mb-8" />
        <h1 className="text-3xl font-bold text-primary text-center mb-3">Amanah-Check</h1>
        <p className="text-center text-muted mb-8 max-w-xl mx-auto">
          {CHECK_TOTAL} Fragen zu deiner Situation und Vorbereitung — ehrlich antworten, damit du weißt, was noch fehlt.
        </p>
        <AmanahCheck />
        <div className="mt-8"><Disclaimer /></div>
      </div>
      <MobileStickyCta href="/check" label="Weiter im Check" hiddenOnPath="/check" />
    </>
  );
}
