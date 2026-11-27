import { notFound } from "next/navigation";
import { isInternalToolsEnabled } from "@/lib/flags/internal-tools";
import { ReviewSandbox } from "./review-sandbox";

export const metadata = { title: "Prüfworkflow-Sandbox — intern", robots: { index: false, follow: false } };

/** Internal demo with synthetic data only. No real firm, no mandate, no persistence. */
export default function ReviewSandboxPage() {
  if (!isInternalToolsEnabled()) notFound();
  return <ReviewSandbox />;
}
