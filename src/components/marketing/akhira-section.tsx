"use client";

import { useState } from "react";
import { PrimarySourceCard } from "@/components/ui/primary-source-card";
import { islamicSources } from "@/lib/knowledge/sources";
import { SectionHeader } from "@/components/marketing/marketing-ui";
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
    <section className="py-14 md:py-16 bg-card border-y border-border">
      <div className="max-w-5xl mx-auto px-4">
        <SectionHeader
          title="Für dein Akhira vorsorgen"
          description="Akhira bezeichnet das Jenseits — hier geht es um Vorbereitung, nicht um Garantien. Halte fest, welche guten Taten nach dir weitergeführt werden sollen."
        />
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          {AKHIRA_ITEMS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-xl border border-border bg-background p-5">
              <Icon size={22} className="text-success mb-3" aria-hidden />
              <h3 className="font-semibold text-primary mb-2">{title}</h3>
              <p className="text-base text-muted">{text}</p>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setSourceOpen(!sourceOpen)}
          className="text-sm font-medium text-accent hover:underline min-h-[44px]"
          aria-expanded={sourceOpen}
        >
          {sourceOpen ? "Quelle ausblenden" : "Islamische Primärquelle anzeigen (Sahih Muslim 1631)"}
        </button>
        {sourceOpen && hadith && (
          <div className="mt-4">
            <PrimarySourceCard source={hadith} />
            <p className="text-sm text-muted mt-3">Sinngemäße Einordnung — keine Garantie religiöser Belohnung, keine Fatwa.</p>
          </div>
        )}
      </div>
    </section>
  );
}
