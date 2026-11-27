import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isEditorialPreviewEnabled } from "@/lib/flags/knowledge-preview";
import { InternalPreviewBanner } from "@/components/partner/internal-preview-banner";
import { PartnerPlatformPreview } from "@/components/partner/partner-platform-preview";

/**
 * AP22 EA-03.2: clickable preview of the future partner platform. Same switch as /partner: 404 and noindex wherever
 * the editorial preview is off (production). Static mock-up: fictitious profiles, no sending, no storage.
 */
export const metadata: Metadata = { title: "Partnerplattform (interne Vorschau) — Wasiyya", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function PartnerPlatformPreviewPage() {
  if (!isEditorialPreviewEnabled()) notFound();
  return (
    <>
      <InternalPreviewBanner>
        Klickbare Attrappe der künftigen Partnerplattform. Alle Partner sind erfunden („Beispiel, fiktiv“); nichts wird gesendet oder gespeichert.{" "}
        <Link href="/partner" className="font-semibold underline decoration-[#D4A537] underline-offset-2">
          Frühere Partner-Informationsseite
        </Link>
      </InternalPreviewBanner>
      <PartnerPlatformPreview />
    </>
  );
}
