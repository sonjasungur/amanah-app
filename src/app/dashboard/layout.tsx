import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { DashboardAuthGate } from "@/components/dashboard/dashboard-auth-gate";
import { ConsentGate } from "@/components/dashboard/consent-gate";
import { StorageModeBanner } from "@/components/auth/storage-mode-banner";
import { EmailVerificationNotice } from "@/components/dashboard/email-verification-notice";

export default function DashboardRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout>
      <DashboardAuthGate>
        <EmailVerificationNotice />
        <div className="mb-6">
          <StorageModeBanner />
        </div>
        <ConsentGate>{children}</ConsentGate>
      </DashboardAuthGate>
    </DashboardLayout>
  );
}
