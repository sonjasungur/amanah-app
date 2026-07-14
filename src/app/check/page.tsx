"use client";

import { AmanahCheck } from "@/components/check/amanah-check";
import { StorageModeBanner } from "@/components/auth/storage-mode-banner";
import { Disclaimer } from "@/components/ui/disclaimer";
import { MobileStickyCta } from "@/components/layout/mobile-sticky-cta";
import { CHECK_LABELS } from "@/lib/design-tokens";
import { CHECK_TOTAL } from "@/lib/check/questions";

export default function CheckPage() {
  return (
    <>
      <div className="max-w-3xl mx-auto px-4 py-10 md:py-14 pb-24">
        <StorageModeBanner className="mb-6 opacity-90" />
        <h1 className="text-page-title font-bold text-foreground text-center mb-4">
          {CHECK_LABELS.pageTitle}
        </h1>
        <p className="text-center text-body-lg text-muted mb-10 max-w-xl mx-auto leading-relaxed">
          {CHECK_TOTAL} Fragen zu deiner Situation und Vorbereitung — ehrlich antworten, damit du weißt, was noch fehlt.
        </p>
        <AmanahCheck />
        <div className="mt-10">
          <Disclaimer />
        </div>
      </div>
      <MobileStickyCta href="/check" label="Weiter im Check" hiddenOnPath="/check" />
    </>
  );
}
