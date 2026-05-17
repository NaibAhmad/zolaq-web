// Sprint 8C dealer submission types. Every dealer-initiated change to a
// profile, offer, or media item becomes a DealerSubmission row; admin acts on
// these, and approval applies the payload to the canonical entity.

export const SUBMISSION_KINDS = [
  "profile_edit",
  "offer_create",
  "offer_update",
  "media",
] as const;

export type SubmissionKind = (typeof SUBMISSION_KINDS)[number];

export const SUBMISSION_STATUSES = [
  "draft",
  "submitted",
  "under_review",
  "needs_revision",
  "approved",
  "published",
  "rejected",
  "expired",
  "cancelled",
] as const;

export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

export function isSubmissionStatus(value: unknown): value is SubmissionStatus {
  return (
    typeof value === "string" &&
    (SUBMISSION_STATUSES as readonly string[]).includes(value)
  );
}

export type DealerSubmission = {
  submission_id: string;
  dealer_id: string;
  kind: SubmissionKind;
  target_id?: string; // offer_id / media_id / undefined for profile
  payload: Record<string, unknown>;
  status: SubmissionStatus;
  reviewer_id?: string;
  review_note?: string;
  submitted_by: string; // dealer contact name at submit time
  created_at: number;
  updated_at: number;
  resolved_at?: number;
};
