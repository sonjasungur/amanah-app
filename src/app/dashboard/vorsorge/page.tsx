"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { VorsorgeFlow } from "@/components/vorsorge/vorsorge-flow";

function FlowWithStep() {
  return <VorsorgeFlow stepId={useSearchParams().get("schritt")} />;
}

export default function VorsorgePage() {
  return (
    <Suspense fallback={<VorsorgeFlow stepId={null} />}>
      <FlowWithStep />
    </Suspense>
  );
}
