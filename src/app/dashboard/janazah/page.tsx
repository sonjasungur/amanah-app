"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { JanazahGuidedFlow } from "@/components/modules/janazah-guided-flow";
import { SaveBar } from "@/components/storage/save-bar";

function JanazahInner() {
  const searchParams = useSearchParams();
  const schrittParam = searchParams.get("schritt");
  const initialStep = schrittParam !== null ? parseInt(schrittParam, 10) : undefined;

  return (
    <>
      <JanazahGuidedFlow initialStep={Number.isNaN(initialStep) ? undefined : initialStep} />
      <SaveBar compact />
    </>
  );
}

export default function JanazahPage() {
  return (
    <Suspense fallback={<JanazahGuidedFlow />}>
      <JanazahInner />
    </Suspense>
  );
}
