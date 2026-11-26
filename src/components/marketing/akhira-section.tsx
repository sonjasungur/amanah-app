import Link from "next/link";
import { ArrowRight, BookOpen, Heart, Lock, Users } from "lucide-react";

/**
 * Akhira on the home page (owner order 26.11.2026): every card separates the editorial Islamic knowledge
 * (free, read only) from the personal implementation in the protected account. The knowledge centre has no
 * user posts, comments or forums; personal entries stay private.
 */
const AKHIRA_ITEMS = [
  {
    icon: Heart,
    title: "Sadaqa Jariya planen",
    knowledge: { text: "Was Sadaqa Jariya ist und was nach dem Tod weiterwirkt.", href: "/sadaqa-jariya" },
    action: { text: "Deine Wünsche für dauerhafte Spenden und Projekte festhalten.", href: "/dashboard/sadaqa-jariya" },
  },
  {
    icon: BookOpen,
    title: "Wissen weitergeben",
    knowledge: { text: "Nützliches Wissen als gute Tat, die bleibt.", href: "/wissen" },
    action: { text: "Im Familienbrief aufschreiben, was deine Familie von dir lernen soll.", href: "/dashboard/familie" },
  },
  {
    icon: Users,
    title: "Familie informieren",
    knowledge: { text: "Barzakh und Bittgebete für Verstorbene.", href: "/barzakh" },
    action: { text: "Festhalten, worüber ihr gesprochen habt und was du dir wünschst.", href: "/dashboard/familiengespraech" },
  },
];

export function AkhiraSection() {
  return (
    <section className="on-dark wasiyya-hero py-16 md:py-20 text-white" data-testid="home-akhira">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-section-title text-white mb-3">Für deine Akhira vorsorgen</h2>
        <p className="text-body-lg text-white/85 max-w-2xl mb-10 leading-relaxed">
          Akhira bezeichnet das Jenseits. Hier geht es um Vorbereitung, nicht um Garantien: erst verstehen, dann
          festhalten, welche guten Taten nach dir weiterwirken sollen.
        </p>
        <div className="grid md:grid-cols-3 gap-5 mb-8">
          {AKHIRA_ITEMS.map(({ icon: Icon, title, knowledge, action }) => (
            <article key={title} className="rounded-2xl ring-1 ring-[#D4A537]/45 bg-white/[0.04] p-6 md:p-7 flex flex-col">
              <Icon size={28} className="text-[#F2CF6C] mb-4" aria-hidden />
              <h3 className="text-card-title font-bold text-white mb-4">{title}</h3>
              <Link href={knowledge.href} className="group rounded-xl bg-white/[0.05] px-4 py-3 hover:bg-white/10">
                <span className="block text-xs font-bold uppercase tracking-[0.16em] text-[#F2CF6C]">Islamisches Wissen</span>
                <span className="block text-white/85 mt-1">{knowledge.text}</span>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#F2CF6C] mt-2">
                  Lesen <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
                </span>
              </Link>
              <Link href={action.href} className="group mt-3 rounded-xl ring-1 ring-[#D4A537]/50 px-4 py-3 hover:bg-white/5">
                <span className="block text-xs font-bold uppercase tracking-[0.16em] text-[#F2CF6C]">Persönlich umsetzen</span>
                <span className="block text-white/85 mt-1">{action.text}</span>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#F2CF6C] mt-2">
                  In deinem Vorsorgeordner <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
                </span>
              </Link>
            </article>
          ))}
        </div>
        <p className="flex items-start gap-2 text-sm text-white/75 max-w-3xl">
          <Lock size={16} className="text-[#F2CF6C] shrink-0 mt-0.5" aria-hidden />
          Das Wissen auf Wasiyya ist redaktionell geführt, ohne Kommentare oder Foren. Was du persönlich festhältst,
          bleibt privat in deinem geschützten Bereich.
        </p>
      </div>
    </section>
  );
}
