import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { DashboardAuthGate } from "@/components/dashboard/dashboard-auth-gate";
import { StorageModeBanner } from "@/components/auth/storage-mode-banner";

export default function DashboardRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout>
      <DashboardAuthGate>
        <div className="mb-6">
          <StorageModeBanner />
        </div>
        {children}
      </DashboardAuthGate>
    </DashboardLayout>
  );
}
