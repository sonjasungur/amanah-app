import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AmanahAssistantFloat } from "@/components/ai/amanah-assistant-float";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AmanahOrdner — Islamisch vorbereitet",
  description:
    "Der islamische Vorsorge-, Janazah-, Testament-, Barzakh- und Sadaqa-Jariya-Kompass für Muslime in Deutschland.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "AmanahOrdner" },
};

export const viewport: Viewport = {
  themeColor: "#070f1c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={`${geist.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <AmanahAssistantFloat />
        </Providers>
      </body>
    </html>
  );
}
