"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useI18n, locales } from "@/lib/i18n/context";
import { localeNames, type Locale } from "@/lib/i18n/translations";
import { useAuth } from "@/lib/auth/context";
import { cn } from "@/lib/utils/cn";
import { Menu, X, LogOut } from "lucide-react";
import { useState } from "react";
import { linkButtonClassName } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";

const navLinks = [
  { href: "/", labelKey: "nav.home" as const },
  { href: "/check", labelKey: "nav.check" as const },
  { href: "/wissen", labelKey: "nav.knowledge" as const },
  { href: "/preise", labelKey: "nav.prices" as const },
  { href: "/dashboard", labelKey: "nav.dashboard" as const },
];

function isNavActive(pathname: string, href: string): boolean {
  if (href === "/wissen") return pathname.startsWith("/wissen");
  if (href === "/dashboard") return pathname.startsWith("/dashboard");
  return pathname === href;
}

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
    <header
      className="sticky top-0 z-40 bg-card/98 backdrop-blur-md border-b border-border no-print shadow-sm"
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between gap-4">
        <Logo />

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const active = isNavActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3.5 py-2 rounded-lg text-[15px] font-semibold transition-colors min-h-[44px] flex items-center",
                  active
                    ? "text-primary-dark bg-accent-soft ring-2 ring-primary/25 font-bold"
                    : "text-muted hover:text-primary-dark hover:bg-accent-soft/60"
                )}
                aria-current={active ? "page" : undefined}
              >
                {t(link.labelKey)}
              </Link>
            );
          })}
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
            className="text-[15px] border border-border rounded-lg px-2.5 py-2 bg-white ml-2 min-h-[44px]"
            aria-label="Sprache wählen"
          >
            {locales.map((l) => (
              <option key={l} value={l}>
                {localeNames[l]}
              </option>
            ))}
          </select>
          {!isLoading &&
            (session ? (
              <div className="flex items-center gap-2 ml-1">
                <Link href="/dashboard" className={linkButtonClassName({ size: "sm", variant: "primary" })}>
                  Mein Konto
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center text-sm font-medium text-muted hover:text-primary min-h-[44px] px-2"
                  aria-label={t("auth.logout")}
                >
                  <LogOut size={16} className="mr-1" aria-hidden />
                  {t("auth.logout")}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-1">
                <Link href="/register" className={linkButtonClassName({ size: "sm", variant: "outline", className: "min-w-[7.5rem]" })}>
                  Registrieren
                </Link>
                <Link href="/login" className={linkButtonClassName({ size: "sm", className: "min-w-[7.5rem]" })}>
                  Anmelden
                </Link>
              </div>
            ))}
        </nav>

        <button
          className="md:hidden p-2.5 rounded-lg hover:bg-accent-soft min-h-[44px] min-w-[44px] flex items-center justify-center"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menü"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileOpen && (
        <nav className="md:hidden border-t border-border px-4 py-4 space-y-1 bg-card">
          {navLinks.map((link) => {
            const active = isNavActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "block text-base font-semibold py-3 px-3 rounded-lg min-h-[44px]",
                  active ? "text-primary-dark bg-accent-soft font-bold" : "text-muted"
                )}
                onClick={() => setMobileOpen(false)}
              >
                {t(link.labelKey)}
              </Link>
            );
          })}
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
            className="w-full text-base border border-border rounded-lg px-3 py-3 mt-2"
          >
            {locales.map((l) => (
              <option key={l} value={l}>
                {localeNames[l]}
              </option>
            ))}
          </select>
          {!isLoading &&
            (session ? (
              <>
                <Link
                  href="/dashboard"
                  className={linkButtonClassName({ className: "w-full mt-2" })}
                  onClick={() => setMobileOpen(false)}
                >
                  Mein Konto
                </Link>
                <button
                  onClick={handleLogout}
                  className="block text-base font-semibold py-3 px-3 w-full text-left text-muted min-h-[44px]"
                >
                  {t("auth.logout")}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/register"
                  className={linkButtonClassName({ variant: "outline", className: "w-full mt-2" })}
                  onClick={() => setMobileOpen(false)}
                >
                  Registrieren
                </Link>
                <Link
                  href="/login"
                  className={linkButtonClassName({ className: "w-full mt-2" })}
                  onClick={() => setMobileOpen(false)}
                >
                  Anmelden
                </Link>
              </>
            ))}
        </nav>
      )}
    </header>
  );
}
