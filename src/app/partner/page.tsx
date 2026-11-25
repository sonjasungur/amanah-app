import type { Metadata } from "next";
import { notFound } from "next/navigation";

// Hidden for the start (owner decision 25.11.2026, start blocker 10). The former content lives in
// src/components/partner/partner-page-content.tsx and is not routed. Answers 404 and stays out of
// the sitemap and search engines.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function PartnerPage(): never {
  notFound();
}
