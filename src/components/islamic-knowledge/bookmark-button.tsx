"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAmanahStore } from "@/lib/store/use-amanah-store";

/** Saves an article in the personal folder (local or account). Reading needs no account. */
export function BookmarkButton({ slug }: { slug: string }) {
  const bookmarks = useAmanahStore((s) => s.knowledgeBookmarks);
  const updateField = useAmanahStore((s) => s.updateField);
  const saved = bookmarks.includes(slug);

  const toggle = () =>
    updateField("knowledgeBookmarks", saved ? bookmarks.filter((b) => b !== slug) : [...bookmarks, slug]);

  return (
    <Button type="button" variant="outline" size="sm" onClick={toggle} aria-pressed={saved} data-testid="article-bookmark">
      {saved ? <BookmarkCheck size={16} className="mr-2" aria-hidden /> : <Bookmark size={16} className="mr-2" aria-hidden />}
      {saved ? "Gemerkt" : "Merken"}
    </Button>
  );
}
