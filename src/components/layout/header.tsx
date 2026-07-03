"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n, locales } from "@/lib/i18n/context";
import { localeNames, type Locale } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils/cn";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const navLinks = [
  { href: "/", label: "Start" },
  { href: "/check", label: "Amanah-Check" },
  { href: "/janazah-kompass", label: "Wissen" },
  { href: "/preise", label: "Preise" },
  { href: "/dashboard", label: "Mein Ordner" },
];

export function Header() {
  const pathname = usePathname();
  const { locale, setLocale, t, isRtl } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b border-primary/10 no-print" dir={isRtl ? "rtl" : "ltr"}>
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🕌</span>
          <span className="font-bold text-primary text-lg">AmanahOrdner</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === link.href ? "text-primary" : "text-muted"
              )}
            >
              {link.href === "/" ? t("nav.home") : link.href === "/check" ? t("nav.check") : link.href === "/dashboard" ? t("nav.dashboard") : link.href === "/preise" ? t("nav.prices") : t("nav.knowledge")}
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
        </nav>

        <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menü">
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileOpen && (
        <nav className="md:hidden border-t border-primary/10 px-4 py-4 space-y-3">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="block text-sm font-medium py-2" onClick={() => setMobileOpen(false)}>
              {link.label}
            </Link>
          ))}
          <select value={locale} onChange={(e) => setLocale(e.target.value as Locale)} className="w-full text-sm border rounded-lg px-2 py-2">
            {locales.map((l) => (
              <option key={l} value={l}>{localeNames[l]}</option>
            ))}
          </select>
        </nav>
      )}
    </header>
  );
}
