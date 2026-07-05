import { NextResponse } from "next/server";
import { getAiProviderName, isAiEnabled, requiresExternalAiConsent } from "@/lib/ai/config";

export async function GET() {
  return NextResponse.json({
    enabled: isAiEnabled(),
    provider: getAiProviderName(),
    requiresExternalConsent: requiresExternalAiConsent(),
    disclaimer: "Orientierung — keine Rechts-, Medizin- oder Fatwa-Beratung.",
  });
}
