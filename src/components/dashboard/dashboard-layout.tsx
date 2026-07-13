"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { moduleConfigs } from "@/lib/modules/config";
import { dashboardNavGroups, moreNavItems } from "@/lib/navigation/dashboard-nav";
import { StorageControls } from "@/components/storage/storage-controls";
import { SaveStatusIndicator } from "@/components/storage/save-status-indicator";
import { cn } from "@/lib/utils/cn";
import { ChevronDown, ChevronUp, Menu, X } from "lucide-react";

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [modulesOpen, setModulesOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const coreGroups = dashboardNavGroups.filter((g) => g.id !== "modules");

  const navContent = (
    <>
      {coreGroups.map((group) => (
        <div key={group.id}>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted px-3 mb-1">{group.label}</p>
          <div className="space-y-0.5">
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileNavOpen(false)}
                className={cn(
                  "block px-3 py-2.5 rounded-lg text-sm min-h-[44px] flex items-center gap-2",
                  isActive(pathname, item.href) ? "bg-primary text-white font-semibold shadow-sm" : "hover:bg-accent-soft text-muted hover:text-foreground"
                )}
                aria-current={isActive(pathname, item.href) ? "page" : undefined}
              >
                {item.icon && <span aria-hidden>{item.icon}</span>}
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      ))}

      <div>
        <button
          type="button"
          onClick={() => setModulesOpen(!modulesOpen)}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted min-h-[44px]"
          aria-expanded={modulesOpen}
        >
          Alle Module
          {modulesOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {modulesOpen && (
          <div className="space-y-0.5 mt-1">
            {moduleConfigs.map((mod) => (
              <Link
                key={mod.id}
                href={mod.path}
                onClick={() => setMobileNavOpen(false)}
                className={cn(
                  "block px-3 py-2 rounded-lg text-sm min-h-[44px] flex items-center gap-2",
                  isActive(pathname, mod.path) ? "bg-accent-soft text-primary font-semibold border border-emerald/20" : "hover:bg-accent-soft/60 text-muted"
                )}
              >
                <span aria-hidden>{mod.icon}</span> {mod.title}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div>
        <button
          type="button"
          onClick={() => setMoreOpen(!moreOpen)}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted min-h-[44px]"
          aria-expanded={moreOpen}
        >
          Mehr
          {moreOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {moreOpen && (
          <div className="space-y-0.5 mt-1">
            {moreNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileNavOpen(false)}
                className={cn(
                  "block px-3 py-2 rounded-lg text-sm min-h-[44px]",
                  isActive(pathname, item.href) ? "bg-primary/10 text-primary font-medium" : "hover:bg-sand text-muted"
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="lg:hidden mb-4 no-print">
        <button
          type="button"
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          className="flex items-center gap-2 px-4 py-3 rounded-xl border border-primary/15 bg-card text-sm font-medium min-h-[44px]"
          aria-expanded={mobileNavOpen}
          aria-controls="dashboard-mobile-nav"
        >
          {mobileNavOpen ? <X size={18} /> : <Menu size={18} />}
          {mobileNavOpen ? "Navigation schließen" : "Navigation öffnen"}
        </button>
      </div>
      <div className="grid lg:grid-cols-4 gap-8">
        <aside
          id="dashboard-mobile-nav"
          className={cn(
            "lg:col-span-1 space-y-4 no-print",
            mobileNavOpen ? "block" : "hidden lg:block"
          )}
        >
          <nav className="rounded-2xl bg-card border border-primary/10 p-4 space-y-4 max-h-[80vh] overflow-y-auto" aria-label="Dashboard-Navigation">
            {navContent}
          </nav>
          <SaveStatusIndicator className="px-1" />
          <StorageControls />
        </aside>
        <div className="lg:col-span-3">{children}</div>
      </div>
    </div>
  );
}
