"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { startPaths } from "@/lib/modules/config";
import { useAmanahStore } from "@/lib/store/use-amanah-store";

export function PathSelector() {
  const setSelectedPath = useAmanahStore((s) => s.setSelectedPath);

  return (
    <section className="py-12">
      <h2 className="text-2xl font-bold text-primary text-center mb-8">Was möchtest du vorbereiten?</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
        {startPaths.map((path) => (
          <Link
            key={path.id}
            href={path.path}
            onClick={() => setSelectedPath(path.id)}
          >
            <Card className="h-full hover:border-primary/30 hover:shadow-md transition-all cursor-pointer text-center">
              <span className="text-3xl block mb-3">{path.icon}</span>
              <p className="text-sm font-medium">{path.title}</p>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
