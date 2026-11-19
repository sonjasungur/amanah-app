"use client";

import { useState } from "react";
import { Link2, Mail, MessageCircle, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookmarkButton } from "./bookmark-button";
import { ReadingSizeToggle } from "./reading-size-toggle";

/**
 * Share a direct link with family and print — no tracking, no account needed. Nothing is sent
 * anywhere until the reader clicks; WhatsApp and e-mail only receive the title and link.
 * Without a slug the personal bookmark is left out (topic pages).
 */
export function ArticleActions({ title, slug }: { title: string; slug?: string }) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [manualUrl, setManualUrl] = useState("");

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopyState("copied");
    } catch {
      setManualUrl(url);
      setCopyState("failed");
    }
  };

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        // The reader closed the dialog on purpose: do nothing.
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    await copyLink(url);
  };

  const shareText = () => `${title}\n${window.location.href}`;
  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText())}`, "_blank", "noopener,noreferrer");
  };
  const shareEmail = () => {
    window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(shareText())}`;
  };

  return (
    <div className="no-print flex flex-wrap gap-2">
      {slug && <BookmarkButton slug={slug} />}
      <ReadingSizeToggle />
      <Button type="button" variant="outline" size="sm" onClick={share} data-testid="article-share">
        <Link2 size={16} className="mr-2" aria-hidden /> {copyState === "copied" ? "Link kopiert" : "Link teilen"}
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={shareWhatsApp} data-testid="article-share-whatsapp">
        <MessageCircle size={16} className="mr-2" aria-hidden /> WhatsApp
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={shareEmail} data-testid="article-share-email">
        <Mail size={16} className="mr-2" aria-hidden /> E-Mail
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={() => window.print()} data-testid="article-print">
        <Printer size={16} className="mr-2" aria-hidden /> Drucken
      </Button>
      {copyState === "failed" && (
        <p className="w-full text-sm text-muted" role="status" data-testid="article-share-manual">
          Kopieren war nicht möglich. Link zum Kopieren: <span className="break-all">{manualUrl}</span>
        </p>
      )}
    </div>
  );
}
