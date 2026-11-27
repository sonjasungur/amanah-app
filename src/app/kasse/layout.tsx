import type { Metadata } from "next";

/** Checkout results are personal: never indexed (owner order 25.11.2026). */
export const metadata: Metadata = { title: "Kasse — Wasiyya", robots: { index: false, follow: false } };

export default function KasseLayout({ children }: { children: React.ReactNode }) {
  return children;
}
