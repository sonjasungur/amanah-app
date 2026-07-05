"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { moduleConfigs } from "@/lib/modules/config";
import { StorageControls } from "@/components/storage/storage-controls";
import { SaveStatusIndicator } from "@/components/storage/save-status-indicator";
import { cn } from "@/lib/utils/cn";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1 space-y-4 no-print">
          <nav className="rounded-2xl bg-card border border-primary/10 p-4 space-y-1 max-h-[70vh] overflow-y-auto">
            <Link href="/dashboard" className={cn("block px-3 py-2 rounded-lg text-sm font-medium", pathname === "/dashboard" ? "bg-primary text-white" : "hover:bg-sand")}>
              Übersicht
            </Link>
            {moduleConfigs.map((mod) => (
              <Link
                key={mod.id}
                href={mod.path}
                className={cn("block px-3 py-2 rounded-lg text-sm", pathname === mod.path ? "bg-primary/10 text-primary font-medium" : "hover:bg-sand text-muted")}
              >
                {mod.icon} {mod.title}
              </Link>
            ))}
            <Link href="/dashboard/pdf" className={cn("block px-3 py-2 rounded-lg text-sm", pathname === "/dashboard/pdf" ? "bg-primary/10 text-primary font-medium" : "hover:bg-sand text-muted")}>
              📄 PDF & Export
            </Link>
            <Link href="/dashboard/assistent" className={cn("block px-3 py-2 rounded-lg text-sm", pathname === "/dashboard/assistent" ? "bg-primary/10 text-primary font-medium" : "hover:bg-sand text-muted")}>
              🤖 Assistent
            </Link>
          </nav>
          <SaveStatusIndicator className="px-1" />
          <StorageControls />
        </aside>
        <div className="lg:col-span-3">{children}</div>
      </div>
    </div>
  );
}
