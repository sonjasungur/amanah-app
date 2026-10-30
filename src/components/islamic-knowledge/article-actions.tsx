"use client";

import { useState } from "react";
import { Link2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Share a direct link with family and print — no tracking, no account needed. */
export function ArticleActions({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // Dialog dismissed — fall back to copying.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="no-print flex flex-wrap gap-2">
      <Button type="button" variant="outline" size="sm" onClick={share} data-testid="article-share">
        <Link2 size={16} className="mr-2" aria-hidden /> {copied ? "Link kopiert" : "Link teilen"}
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>
        <Printer size={16} className="mr-2" aria-hidden /> Drucken
      </Button>
    </div>
  );
}
