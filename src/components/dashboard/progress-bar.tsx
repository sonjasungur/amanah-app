"use client";

import { useAmanahStore } from "@/lib/store/use-amanah-store";
import { pickDataFields } from "@/lib/store/store-utils";
import { calculateProgress } from "@/lib/utils/progress";

export function ProgressBar() {
  const store = useAmanahStore();
  const progress = calculateProgress(pickDataFields(store));

  return (
    <div className="w-full">
      <div className="flex justify-between text-base mb-2">
        <span className="font-semibold text-foreground">Fortschritt</span>
        <span className="text-primary font-bold">{progress}%</span>
      </div>
      <div className="h-3.5 bg-border rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
