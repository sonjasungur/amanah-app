"use client";

import { useState } from "react";
import { PrimarySourceCard } from "@/components/ui/primary-source-card";
import { islamicSources } from "@/lib/knowledge/sources";
import { COLORS } from "@/lib/design-tokens";
import { BookOpen, Heart, Users } from "lucide-react";

const AKHIRA_ITEMS = [
  { icon: Heart, title: "Sadaqa Jariya planen", text: "Halte fest, welche dauerhaften Spenden und Projekte du wünschst." },
  { icon: BookOpen, title: "Wissen weitergeben", text: "Dokumentiere, welches nützliche Wissen deiner Familie helfen soll." },
  { icon: Users, title: "Familie informieren", text: "Erkläre, welche Unterstützung und Bittgebete du dir vorstellst." },
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
          {AKHIRA_ITEMS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-white/15 bg-white/5 p-6 md:p-7 backdrop-blur-sm">
              <Icon size={26} className="text-emerald mb-4" aria-hidden />
              <h3 className="text-card-title font-bold text-white mb-2">{title}</h3>
              <p className="text-body text-white/80 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setSourceOpen(!sourceOpen)}
          className="text-sm font-semibold text-emerald hover:text-white transition-colors min-h-[44px]"
          aria-expanded={sourceOpen}
        >
          {sourceOpen ? "Quelle ausblenden" : "Islamische Primärquelle anzeigen (Sahih Muslim 1631)"}
        </button>
        {sourceOpen && hadith && (
          <div className="mt-4">
            <PrimarySourceCard source={hadith} />
            <p className="text-sm text-white/65 mt-3">Sinngemäße Einordnung — keine Garantie religiöser Belohnung, keine Fatwa.</p>
          </div>
        )}
      </div>
    </section>
  );
}
