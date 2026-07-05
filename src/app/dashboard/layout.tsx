import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { StorageModeBanner } from "@/components/auth/storage-mode-banner";

export default function DashboardRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout>
      <div className="mb-6">
        <StorageModeBanner />
      </div>
      {children}
    </DashboardLayout>
  );
}
