import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isEditorialPreviewEnabled } from "@/lib/flags/knowledge-preview";
import PartnerPageContent from "@/components/partner/partner-page-content";
import { InternalPreviewBanner } from "@/components/partner/internal-preview-banner";

// Hidden for the start (owner decision 25.11.2026, start blocker 10): answers 404 in production and stays out of
// the sitemap and search engines. AP22 EA-03.1: only where the editorial preview is on (password-protected
// staging, local development) the former information page is shown, marked as an internal preview.
export const metadata: Metadata = { title: "Partner (interne Vorschau) — Wasiyya", robots: { index: false, follow: false } };

/** The switch is read at runtime, never baked in at build time. */
export const dynamic = "force-dynamic";

export default function PartnerPage() {
  if (!isEditorialPreviewEnabled()) notFound();
  return (
    <>
      <InternalPreviewBanner>
        Frühere Partner-Informationsseite, unverändert zur Prüfung. Die dort angekündigten Funktionen für Anwälte und Bestatter gibt es noch nicht.{" "}
        <Link href="/partner/vorschau" className="font-semibold underline decoration-[#D4A537] underline-offset-2" data-testid="partner-platform-preview-link">
          Zur klickbaren Vorschau der Partnerplattform
        </Link>
      </InternalPreviewBanner>
      <PartnerPageContent />
    </>
  );
}
