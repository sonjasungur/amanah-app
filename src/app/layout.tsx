import { getSiteUrl } from "@/lib/seo/site-url";
import type { Metadata, Viewport } from "next";
import { Geist, Noto_Naskh_Arabic, Source_Sans_3, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Header } from "@/components/layout/header";
import { StagingBanner } from "@/components/layout/staging-banner";
import { Footer } from "@/components/layout/footer";
import { BRAND } from "@/lib/brand";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

/** Arabic names and terms in documents and prints. Loaded only where Arabic characters appear. */
const arabic = Noto_Naskh_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "700"],
  display: "swap",
  preload: false,
});

/** Serif for document headings (design direction "editorial"). Self-hosted by next/font, not preloaded. */
const docSerif = Source_Serif_4({
  variable: "--font-doc-serif",
  subsets: ["latin", "latin-ext"],
  // Real italics for the family letter's closing (P2.6 owner acceptance), not a slanted roman.
  style: ["normal", "italic"],
  display: "swap",
  preload: false,
});

/** Humanist sans for document labels and the emergency sheet (P2.6 design research). Not preloaded. */
const docSans = Source_Sans_3({
  variable: "--font-doc-sans",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
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
    type: "website",
    locale: "de_DE",
  },
  twitter: { card: "summary_large_image", title: BRAND.metadataTitle, description: BRAND.metadataDescription },
};

export const viewport: Viewport = {
  themeColor: BRAND.themeColor,
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={`${geist.variable} ${arabic.variable} ${docSerif.variable} ${docSans.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        <Providers>
          <StagingBanner />
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
