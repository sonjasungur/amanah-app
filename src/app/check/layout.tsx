import { publicPageMetadata } from "@/lib/seo/public-pages";

export const metadata = publicPageMetadata("/check");

export default function CheckLayout({ children }: { children: React.ReactNode }) {
  return children;
}
