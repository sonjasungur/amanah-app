import type { ReviewStatus } from "@/lib/types";

const LABELS: Record<ReviewStatus, string> = {
  draft: "Entwurf",
  needs_scholar_review: "Noch nicht fachlich geprüft",
  reviewed: "Fachlich geprüft",
};

export function ReviewStatusBadge({ status }: { status: ReviewStatus }) {
  const needsReview = status !== "reviewed";
  return (
    <span
      className={
        needsReview
          ? "text-xs font-semibold px-2 py-0.5 rounded bg-warning/10 text-warning border border-warning/30"
          : "text-xs font-semibold px-2 py-0.5 rounded bg-success/10 text-success border border-success/30"
      }
      data-testid="review-status-badge"
    >
      {LABELS[status] ?? status}
    </span>
  );
}
