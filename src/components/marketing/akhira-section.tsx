"use client";

import { useState } from "react";
import Link from "next/link";
import { PrimarySourceCard } from "@/components/ui/primary-source-card";
import { islamicSources } from "@/lib/knowledge/sources";
import { COLORS } from "@/lib/design-tokens";
import { ArrowRight, BookOpen, Heart, Users } from "lucide-react";

const AKHIRA_ITEMS = [
  { icon: Heart, title: "Sadaqa Jariya planen", text: "Halte fest, welche dauerhaften Spenden und Projekte du wünschst.", href: "/wissen/sadaqa-jariya" },
  { icon: BookOpen, title: "Wissen weitergeben", text: "Dokumentiere, welches nützliche Wissen deiner Familie helfen soll.", href: "/wissen/akhira-vorsorge" },
  { icon: Users, title: "Familie informieren", text: "Erkläre, welche Unterstützung und Bittgebete du dir vorstellst.", href: "/wissen/familiengespraech" },
];

export function AkhiraSection() {
  const [sourceOpen, setSourceOpen] = useState(false);
  const hadith = islamicSources["hadith-sadaqa-jariya"];

  return (
    <section
      className="py-16 md:py-20 text-white"
      style={{
        background: `linear-gradient(160deg, ${COLORS.brandDark} 0%, ${COLORS.navy} 100%)`,
      }}
    >
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-section-title font-bold text-white mb-3">Für dein Akhira vorsorgen</h2>
        <p className="text-body-lg text-white/80 max-w-2xl mb-10 leading-relaxed">
          Akhira bezeichnet das Jenseits — hier geht es um Vorbereitung, nicht um Garantien. Halte fest, welche guten
          Taten nach dir weitergeführt werden sollen.
        </p>
        <div className="grid sm:grid-cols-3 gap-5 mb-8">
          {AKHIRA_ITEMS.map(({ icon: Icon, title, text, href }) => (
            <Link
              key={title}
              href={href}
              className="group rounded-2xl border-2 border-white/15 bg-white/5 p-6 md:p-7 backdrop-blur-sm hover:border-emerald/40 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/50 transition-all"
            >
              <Icon size={26} className="text-emerald mb-4" aria-hidden />
              <h3 className="text-card-title font-bold text-white mb-2">{title}</h3>
              <p className="text-body text-white/80 leading-relaxed">{text}</p>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald mt-4 group-hover:gap-2 transition-all">
                Thema öffnen <ArrowRight size={14} aria-hidden />
              </span>
            </Link>
          ))}
        </div>
        <button
          type="button"
          id="akhira-source-toggle"
          onClick={() => setSourceOpen(!sourceOpen)}
          className="text-sm font-semibold text-emerald hover:text-white transition-colors min-h-[44px] px-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/50"
          aria-expanded={sourceOpen}
          aria-controls="akhira-source-panel"
        >
          {sourceOpen ? "Quelle ausblenden" : "Islamische Primärquelle anzeigen (Sahih Muslim 1631)"}
        </button>
        {sourceOpen && hadith && (
          <div id="akhira-source-panel" role="region" aria-labelledby="akhira-source-toggle" className="mt-4">
            <PrimarySourceCard source={hadith} defaultOpen />
            <p className="text-sm text-white/65 mt-3">Sinngemäße Einordnung — keine Garantie religiöser Belohnung, keine Fatwa.</p>
          </div>
        )}
      </div>
    </section>
  );
}
