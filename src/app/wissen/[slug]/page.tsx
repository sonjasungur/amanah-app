import Link from "next/link";
import { notFound } from "next/navigation";
import { wissenTopics } from "@/lib/knowledge/wissen-topics";
import { WISSEN_META } from "@/lib/knowledge/wissen-meta";
import { RichArticleCard } from "@/components/knowledge/rich-article-card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export function generateStaticParams() {
  return wissenTopics.map((t) => ({ slug: t.slug }));
}

export default async function WissenDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = wissenTopics.find((t) => t.slug === slug);
  if (!article) notFound();

  const meta = WISSEN_META[article.id];

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link href="/wissen" className="text-sm text-accent hover:underline flex items-center gap-1 mb-6">
        <ArrowLeft size={16} /> Alle Themen
      </Link>

      {meta && (
        <div className="mb-6 p-4 rounded-xl bg-accent/10 border border-accent/20 text-sm">
          <p className="font-semibold text-primary mb-1">Kurzantwort</p>
          <p className="text-muted">{meta.shortAnswer}</p>
          <p className="text-xs text-muted mt-2">Für: {meta.audience.join(" · ")}</p>
        </div>
      )}

      <RichArticleCard article={{ ...article, wissenMeta: meta }} />

      <div className="mt-8 flex flex-wrap gap-3">
        {article.details?.nextStepHref && (
          <Link href={article.details.nextStepHref}>
            <Button size="lg">{article.details.nextStepLabel}</Button>
          </Link>
        )}
        <Link href="/check"><Button size="lg" variant="outline">Amanah-Check</Button></Link>
      </div>
    </div>
  );
}
