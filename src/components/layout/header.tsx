"use client";

import Link from "next/link";
import { useFieldCorrections } from "@/lib/store/field-corrections";
import { usePathname, useRouter } from "next/navigation";
import { useI18n, locales } from "@/lib/i18n/context";
import { localeNames, type Locale } from "@/lib/i18n/translations";
import { useAuth } from "@/lib/auth/context";
import { cn } from "@/lib/utils/cn";
import { Menu, X, LogOut } from "lucide-react";
import { useState } from "react";
import { linkButtonClassName } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { isPublicRegistrationEnabled } from "@/lib/auth/public-registration";

/** Main areas. Check and prices stay reachable from the homepage and the footer. */
const navLinks = [
  { href: "/wissen", labelKey: "nav.knowledge" as const },
  { href: "/dashboard", labelKey: "nav.vorsorge" as const },
  { href: "/dashboard/testament", labelKey: "nav.testament" as const },
  { href: "/dashboard/janazah", labelKey: "nav.janazah" as const },
  { href: "/dashboard/einstellungen", labelKey: "nav.account" as const },
];

const SECTION_PREFIXES = ["/dashboard/testament", "/dashboard/janazah", "/dashboard/einstellungen"];

function isNavActive(pathname: string, href: string): boolean {
  if (href === "/wissen") return pathname.startsWith("/wissen");
  if (href === "/dashboard") {
    return pathname.startsWith("/dashboard") && !SECTION_PREFIXES.some((p) => pathname.startsWith(p));
  }
  return pathname.startsWith(href);
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { locale, setLocale, t, isRtl } = useI18n();
  const { session, logout, isLoading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const showRegister = isPublicRegistrationEnabled();

  const handleLogout = async () => {
    // An open date draft is the person's input: signing out says so instead of dropping it silently.
    const drafts = Object.values(useFieldCorrections.getState().open);
    if (drafts.length && !window.confirm(`${drafts.map((d) => `${d.label} „${d.text}“`).join(", ")} ist noch nicht gespeichert. Trotzdem abmelden? Die Eingabe wird dann verworfen.`)) return;
    const result = await logout();
    if (!result.ok && result.unsaved) {
      // The account may not hold the newest changes: the person decides, the logout does not drop them silently.
      if (!window.confirm(t(result.otherTab ? "auth.logoutUnsavedOtherTab" : "auth.logoutUnsaved"))) return;
      await logout({ force: true });
    }
    router.push("/");
  };

  return (
    <header
      className="on-dark sticky top-0 z-40 bg-navy/[0.97] backdrop-blur-md border-b border-[#D4A537]/45 no-print shadow-[0_1px_24px_rgba(0,0,0,0.25)] text-white"
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div className="max-w-7xl mx-auto px-4 py-3 md:py-3.5 flex items-center justify-between gap-4">
        <div className="shrink-0">
          <Logo light />
        </div>

        <nav className="hidden xl:flex items-center gap-0.5 min-w-0">
          {navLinks.map((link) => {
            const active = isNavActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-2 2xl:px-2.5 py-2 rounded-lg text-[14px] 2xl:text-[15px] font-semibold whitespace-nowrap transition-colors min-h-[44px] flex items-center",
                  active
                    ? "text-white font-bold shadow-[inset_0_-2px_0_#D4A537] rounded-none"
                    : "text-white/80 hover:text-white"
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
            className="text-[14px] 2xl:text-[15px] border border-white/25 rounded-lg px-1.5 py-2 bg-navy text-white ml-1 min-h-[44px]"
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
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center text-sm font-medium text-white/80 hover:text-white min-h-[44px] px-2"
                  aria-label={t("auth.logout")}
                >
                  <LogOut size={16} className="mr-1" aria-hidden />
                  {t("auth.logout")}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-1">
                {showRegister && (
                  <Link href="/register" className={linkButtonClassName({ size: "sm", variant: "outline", className: "px-3 bg-transparent text-white border-[#D4A537]/70 hover:bg-white/5" })}>
                    Registrieren
                  </Link>
                )}
                <Link href="/login" className={linkButtonClassName({ size: "sm", className: "px-3 wasiyya-cta border-0" })}>
                  Anmelden
                </Link>
              </div>
            ))}
        </nav>

        <button
          className="xl:hidden p-2.5 rounded-lg text-white hover:bg-white/10 min-h-[44px] min-w-[44px] flex items-center justify-center"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menü"
          aria-expanded={mobileOpen}
          data-testid="site-mobile-nav-toggle"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileOpen && (
        <nav className="xl:hidden border-t border-white/10 px-4 py-4 space-y-1 bg-navy" data-testid="site-mobile-nav">
          {navLinks.map((link) => {
            const active = isNavActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "block text-base font-semibold py-3 px-3 rounded-lg min-h-[44px]",
                  active ? "text-white bg-white/10 font-bold shadow-[inset_3px_0_0_#D4A537]" : "text-white/80"
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
            className="w-full text-base border border-white/25 bg-navy text-white rounded-lg px-3 py-3 mt-2"
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
                <button
                  onClick={handleLogout}
                  className="block text-base font-semibold py-3 px-3 w-full text-left text-white/80 min-h-[44px]"
                >
                  {t("auth.logout")}
                </button>
              </>
            ) : (
              <>
                {showRegister && (
                  <Link
                    href="/register"
                    className={linkButtonClassName({ variant: "outline", className: "w-full mt-2 bg-transparent text-white border-[#D4A537]/70" })}
                    onClick={() => setMobileOpen(false)}
                  >
                    Registrieren
                  </Link>
                )}
                <Link
                  href="/login"
                  className={linkButtonClassName({ className: "w-full mt-2 wasiyya-cta border-0" })}
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
