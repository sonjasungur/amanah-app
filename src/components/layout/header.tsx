"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useI18n, locales } from "@/lib/i18n/context";
import { localeNames, type Locale } from "@/lib/i18n/translations";
import { useAuth } from "@/lib/auth/context";
import { cn } from "@/lib/utils/cn";
import { Menu, X, LogIn, LogOut } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";

const navLinks = [
  { href: "/", labelKey: "nav.home" as const },
  { href: "/check", labelKey: "nav.check" as const },
  { href: "/wissen", labelKey: "nav.knowledge" as const },
  { href: "/preise", labelKey: "nav.prices" as const },
  { href: "/dashboard", labelKey: "nav.dashboard" as const },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { locale, setLocale, t, isRtl } = useI18n();
  const { session, logout, isLoading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b border-primary/10 no-print shadow-sm" dir={isRtl ? "rtl" : "ltr"}>
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Logo />

        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-accent",
                pathname === link.href || (link.href === "/wissen" && pathname.startsWith("/wissen"))
                  ? "text-primary"
                  : "text-muted"
              )}
            >
              {t(link.labelKey)}
            </Link>
          ))}
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
            className="text-sm border border-primary/20 rounded-lg px-2 py-1 bg-white"
            aria-label="Sprache wählen"
          >
            {locales.map((l) => (
              <option key={l} value={l}>{localeNames[l]}</option>
            ))}
          </select>
          {!isLoading && (
            session ? (
              <Button size="sm" variant="ghost" onClick={handleLogout}>
                <LogOut size={16} className="mr-1" /> {t("auth.logout")}
              </Button>
            ) : (
              <Link href="/login">
                <Button size="sm" variant="outline">
                  <LogIn size={16} className="mr-1" /> {t("auth.login")}
                </Button>
              </Link>
            )
          )}
        </nav>

        <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menü">
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileOpen && (
        <nav className="md:hidden border-t border-primary/10 px-4 py-4 space-y-3">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="block text-sm font-medium py-2" onClick={() => setMobileOpen(false)}>
              {t(link.labelKey)}
            </Link>
          ))}
          <select value={locale} onChange={(e) => setLocale(e.target.value as Locale)} className="w-full text-sm border rounded-lg px-2 py-2">
            {locales.map((l) => (
              <option key={l} value={l}>{localeNames[l]}</option>
            ))}
          </select>
          {!isLoading && (
            session ? (
              <button onClick={handleLogout} className="block text-sm font-medium py-2 w-full text-left">
                {t("auth.logout")}
              </button>
            ) : (
              <Link href="/login" className="block text-sm font-medium py-2" onClick={() => setMobileOpen(false)}>
                {t("auth.login")}
              </Link>
            )
          )}
        </nav>
      )}
    </header>
  );
}
