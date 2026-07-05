import { handleGuidedFlowRoute } from "@/lib/guided-flow/api-handler";
import { applyConfirmedUpdates, validateUpdates } from "@/lib/guided-flow/apply-confirmed-updates";
import { FLOW_DISCLAIMER } from "@/lib/guided-flow/config";
import type { SuggestedUpdate } from "@/lib/guided-flow/types";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const confirmedUpdates = (body.confirmedUpdates ?? body.suggestedUpdates) as SuggestedUpdate[] | undefined;
  const overwrite = body.overwrite === true;

  if (!Array.isArray(confirmedUpdates) || confirmedUpdates.length === 0) {
    return NextResponse.json({ error: "confirmedUpdates erforderlich" }, { status: 400 });
  }

  return handleGuidedFlowRoute(
    request,
    "apply",
    async ({ data }) => {
      const { valid, invalid } = validateUpdates(confirmedUpdates);
      if (valid.length === 0) {
        throw new Error(`Keine gültigen Felder: ${invalid.join(", ")}`);
      }
      const { data: merged, applied, rejected } = applyConfirmedUpdates(data, valid, { overwrite });
      return {
        data: merged,
        applied,
        rejected: [...rejected, ...invalid],
        disclaimer: FLOW_DISCLAIMER,
      };
    },
    body as Record<string, unknown>
  );
}
