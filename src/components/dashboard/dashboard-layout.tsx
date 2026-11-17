"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { areaNavItems, isDashboardNavActive, mainNavItems, moreNavItems } from "@/lib/navigation/dashboard-nav";
import { cn } from "@/lib/utils/cn";
import { ChevronDown, ChevronUp, ClipboardList, Download, Home, Package, Settings, Users } from "lucide-react";

const MAIN_ICONS: Record<string, typeof Home> = {
  "/dashboard": Home,
  "/dashboard/vorsorge": ClipboardList,
  "/dashboard/personen": Users,
  "/dashboard/notfallpaket": Package,
};

/** Phones: the four main destinations at the bottom, always in reach of the thumb. */
function MobileTabBar({ pathname }: { pathname: string }) {
  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-card/98 backdrop-blur border-t border-border no-print"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Hauptbereiche"
      data-testid="dashboard-tabbar"
    >
      <ul className="grid grid-cols-4 max-w-xl mx-auto">
        {mainNavItems.map((item) => {
          const Icon = MAIN_ICONS[item.href];
          const active = isDashboardNavActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 min-h-[60px] text-xs font-semibold",
                  active ? "text-primary-dark" : "text-muted",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={22} aria-hidden className={active ? "text-emerald" : undefined} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const linkClass = (href: string, strong = false) =>
    cn(
      "flex items-center gap-2 px-3 py-2 rounded-lg text-sm min-h-[44px]",
      isDashboardNavActive(pathname, href)
        ? strong
          ? "bg-primary text-white font-semibold shadow-sm"
          : "bg-accent-soft text-primary font-semibold"
        : "text-muted hover:bg-accent-soft/60 hover:text-foreground",
    );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-4 gap-8">
        <aside id="dashboard-desktop-nav" className="hidden lg:block lg:col-span-1 space-y-4 no-print">
          <nav className="rounded-2xl bg-card border border-primary/10 p-4 space-y-4 max-h-[80vh] overflow-y-auto" aria-label="Vorsorgeplan-Navigation">
            <div className="space-y-0.5">
              {mainNavItems.map((item) => {
                const Icon = MAIN_ICONS[item.href];
                return (
                  <Link key={item.href} href={item.href} className={linkClass(item.href, true)} aria-current={isDashboardNavActive(pathname, item.href) ? "page" : undefined}>
                    <Icon size={16} aria-hidden /> {item.label}
                  </Link>
                );
              })}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted px-3 mb-1">Vorsorgebereiche</p>
              <div className="space-y-0.5">
                {areaNavItems.map((item) => (
                  <Link key={item.href} href={item.href} className={linkClass(item.href)}>
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <button
                type="button"
                onClick={() => setMoreOpen(!moreOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted min-h-[44px]"
                aria-expanded={moreOpen}
              >
                Weitere Themen
                {moreOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {moreOpen && (
                <div className="space-y-0.5 mt-1">
                  {moreNavItems.map((item) => (
                    <Link key={item.href} href={item.href} className={linkClass(item.href)}>
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <div className="pt-2 border-t border-border/40">
              <Link href="/dashboard/einstellungen" className={linkClass("/dashboard/einstellungen")} data-testid="nav-settings-link">
                <Settings size={15} aria-hidden /> Einstellungen
              </Link>
            </div>
          </nav>
          <Link
            href="/dashboard/einstellungen#export-sicherung"
            className="flex items-center gap-2 px-4 py-2 text-sm text-muted hover:text-primary"
            data-testid="nav-export-link"
          >
            <Download size={15} aria-hidden /> Export &amp; Sicherung
          </Link>
        </aside>
        <div className="lg:col-span-3 min-w-0">{children}</div>
      </div>
      <MobileTabBar pathname={pathname} />
    </div>
  );
}
