"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

export function MobileStickyCta({
  href,
  label,
  hiddenOnPath,
}: {
  href: string;
  label: string;
  hiddenOnPath?: string;
}) {
  const pathname = usePathname();
  if (hiddenOnPath && pathname === hiddenOnPath) return null;

  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-40 p-3 bg-card/95 backdrop-blur border-t border-primary/10 shadow-lg no-print">
      <Link href={href} className="block">
        <Button size="lg" className="w-full">{label}</Button>
      </Link>
    </div>
  );
}
