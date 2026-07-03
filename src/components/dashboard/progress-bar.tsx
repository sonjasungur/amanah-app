"use client";

import { useAmanahStore } from "@/lib/store/use-amanah-store";
import { calculateProgress } from "@/lib/utils/progress";

export function ProgressBar() {
  const store = useAmanahStore();
  const progress = calculateProgress(store as Parameters<typeof calculateProgress>[0]);

  return (
    <div className="w-full">
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium">Fortschritt</span>
        <span className="text-primary font-bold">{progress}%</span>
      </div>
      <div className="h-3 bg-sand rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
