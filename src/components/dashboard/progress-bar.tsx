"use client";

import { useAmanahStore } from "@/lib/store/use-amanah-store";
import { pickDataFields } from "@/lib/store/store-utils";
import { calculateProgress } from "@/lib/utils/progress";
import { Progress } from "@/components/ui/progress";

export function ProgressBar() {
  const store = useAmanahStore();
  const progress = calculateProgress(pickDataFields(store));

  return <Progress value={progress} label="Gesamtfortschritt" />;
}
