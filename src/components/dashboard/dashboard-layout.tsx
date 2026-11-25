"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { areaNavItems, isDashboardNavActive, mainNavItems, moreNavItems, secondaryNavItems } from "@/lib/navigation/dashboard-nav";
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
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-navy/[0.98] backdrop-blur border-t border-[#D4A537]/45 no-print"
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
                  active ? "text-white shadow-[inset_0_2px_0_#D4A537]" : "text-white/70",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={22} aria-hidden className={active ? "text-[#F2CF6C]" : undefined} />
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
          ? "bg-white/10 text-white font-semibold shadow-[inset_3px_0_0_#D4A537]"
          : "bg-white/10 text-white font-semibold shadow-[inset_3px_0_0_#D4A537]"
        : "text-white/75 hover:bg-white/5 hover:text-white",
    );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-4 gap-8">
        <aside id="dashboard-desktop-nav" className="hidden lg:block lg:col-span-1 space-y-4 no-print">
          <nav className="on-dark rounded-2xl bg-[linear-gradient(180deg,#0E1630,#070C1C)] ring-1 ring-[#D4A537]/40 shadow-[0_24px_50px_-24px_rgba(7,12,28,0.6)] p-4 space-y-4 max-h-[80vh] overflow-y-auto [scrollbar-color:#D4A537_transparent]" aria-label="Vorsorgeplan-Navigation">
            <div className="space-y-0.5">
              {mainNavItems.map((item) => {
                const Icon = MAIN_ICONS[item.href];
                return (
                  <Link key={item.href} href={item.href} className={linkClass(item.href, true)} aria-current={isDashboardNavActive(pathname, item.href) ? "page" : undefined}>
                    <Icon size={16} aria-hidden /> {item.label}
                  </Link>
                );
              })}
              {secondaryNavItems.map((item) => (
                <Link key={item.href} href={item.href} className={linkClass(item.href)} data-testid={`nav-secondary-${item.href.split("/").pop()}`}>
                  {item.label}
                </Link>
              ))}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#F2CF6C] px-3 mb-1">Vorsorgebereiche</p>
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
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#F2CF6C] min-h-[44px]"
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
            <div className="pt-2 border-t border-white/15">
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
