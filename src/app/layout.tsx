import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AmanahAssistantFloat } from "@/components/ai/amanah-assistant-float";
import { BRAND } from "@/lib/brand";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: BRAND.metadataTitle,
  description: BRAND.metadataDescription,
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: BRAND.shortName },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: BRAND.metadataTitle,
    description: BRAND.metadataDescription,
    siteName: BRAND.name,
  },
};

export const viewport: Viewport = {
  themeColor: BRAND.themeColor,
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
