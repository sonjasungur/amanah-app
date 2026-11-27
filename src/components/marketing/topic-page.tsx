import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { TOPIC_IMAGES, type TopicImageId } from "@/lib/content/topic-images";

/** A planning function in the user's folder that belongs to a topic page. */
export interface TopicAction {
  href: `/dashboard${string}`;
  label: string;
  text: string;
}

/**
 * Topic pages (design "Royal Imperial", owner acceptance 25.11.2026): light, calm and readable. A white header
 * with a gold eyebrow and an optional photo in a gold frame; no background patterns.
 */
export function TopicHero({
  eyebrow,
  title,
  intro,
  image,
}: {
  eyebrow: string;
  title: ReactNode;
  intro: ReactNode;
  image?: TopicImageId;
}) {
  const img = image ? TOPIC_IMAGES[image] : undefined;
  return (
    <section className="topic-hero border-b border-[var(--gold-frame)]" data-testid="topic-hero">
      <div className={`max-w-7xl mx-auto px-4 py-10 md:py-16 grid gap-8 lg:gap-14 items-center ${img ? "lg:grid-cols-[1.15fr_0.85fr]" : ""}`}>
        <div className="min-w-0 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">{eyebrow}</p>
          <h1 className="text-display text-primary-dark mt-3 text-balance">{title}</h1>
          <div className="text-body-lg text-muted mt-5 leading-relaxed">{intro}</div>
        </div>
        {img && (
          <figure className="wasiyya-photo w-full max-w-md lg:max-w-none justify-self-center lg:justify-self-end">
            <div className="relative aspect-[4/3]">
              <Image src={img.src} alt={img.alt} fill sizes="(min-width: 1024px) 40vw, 90vw" className="object-cover" priority />
            </div>
          </figure>
        )}
      </div>
    </section>
  );
}

/** Links from a topic page to the matching functions of the planning folder. */
export function TopicFunctionLinks({ actions, title = "In deinem Vorsorgeordner festhalten" }: { actions: readonly TopicAction[]; title?: string }) {
  if (actions.length === 0) return null;
  return (
    <section className="mt-12" aria-labelledby="topic-functions" data-testid="topic-functions">
      <h2 id="topic-functions" className="text-section-title text-primary-dark">{title}</h2>
      <p className="text-body text-muted mt-2">Kostenlos mit einem Konto. Du entscheidest, was du festhältst; jede Angabe ist freiwillig.</p>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map((a) => (
          <li key={a.href}>
            <Link
              href={a.href}
              className="gold-frame group flex h-full flex-col rounded-2xl p-5 shadow-[0_14px_34px_-18px_rgba(11,18,38,0.35)] hover:shadow-[0_18px_40px_-16px_rgba(11,18,38,0.45)] transition-shadow"
            >
              <span className="font-semibold text-primary-dark text-lg">{a.label}</span>
              <span className="text-sm text-muted mt-1.5 flex-1">{a.text}</span>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
                Öffnen <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
