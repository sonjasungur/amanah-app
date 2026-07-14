import Link from "next/link";
import { notFound } from "next/navigation";
import { wissenTopics } from "@/lib/knowledge/wissen-topics";
import { WISSEN_META } from "@/lib/knowledge/wissen-meta";
import { RichArticleCard, WissenFormCta } from "@/components/knowledge/rich-article-card";
import { CHECK_LABELS } from "@/lib/design-tokens";
import { ArrowLeft } from "lucide-react";

export function generateStaticParams() {
  return wissenTopics.map((t) => ({ slug: t.slug }));
}

const JANAZAH_CTA = "Janazah-Wünsche jetzt festhalten";

export default async function WissenDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = wissenTopics.find((t) => t.slug === slug);
  if (!article) notFound();

  const meta = WISSEN_META[article.id];
  const formLabel =
    slug === "janazah-wuensche"
      ? JANAZAH_CTA
      : article.details?.nextStepLabel ?? "In meinem Ordner festhalten";

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:py-12 pb-24">
      <nav className="sticky top-[57px] z-30 -mx-4 px-4 py-3 bg-background/95 backdrop-blur border-b border-border mb-6 md:static md:bg-transparent md:border-0 md:p-0 md:mb-6">
        <Link href="/wissen" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1 min-h-[44px]">
          <ArrowLeft size={16} aria-hidden /> Zurück zu allen Themen
        </Link>
      </nav>

      <RichArticleCard article={{ ...article, wissenMeta: meta }} />

      {article.details?.nextStepHref && (
        <WissenFormCta href={article.details.nextStepHref} label={formLabel} />
      )}

      <p className="mt-8 text-center">
        <Link href="/check" className="text-sm font-medium text-muted hover:text-primary underline-offset-4 hover:underline">
          {CHECK_LABELS.nav} starten
        </Link>
      </p>
    </div>
  );
}
