import type { Metadata } from "next";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { DashboardAuthGate } from "@/components/dashboard/dashboard-auth-gate";
import { ConsentGate } from "@/components/dashboard/consent-gate";
import { FolderProblemGate } from "@/components/dashboard/folder-problem-gate";
import { StorageModeBanner } from "@/components/auth/storage-mode-banner";
import { EmailVerificationNotice } from "@/components/dashboard/email-verification-notice";
import { PlusAreaNotice } from "@/components/billing/plus-area-notice";
import { DateDraftLeaveGuard, DateDraftNotice } from "@/components/storage/date-drafts";

/** Personal folder: never indexed; the data itself only comes from authenticated API routes. */
export const metadata: Metadata = { title: "Mein Vorsorgeordner — Wasiyya", robots: { index: false, follow: false } };

export default function DashboardRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout>
      <DashboardAuthGate>
        <EmailVerificationNotice />
        <div className="mb-6">
          <StorageModeBanner />
        </div>
        <PlusAreaNotice />
        <DateDraftNotice />
        <DateDraftLeaveGuard />
        <FolderProblemGate>
          <ConsentGate>{children}</ConsentGate>
        </FolderProblemGate>
      </DashboardAuthGate>
    </DashboardLayout>
  );
}
