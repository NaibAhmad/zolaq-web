// Sprint 8C dealer submission store. globalThis-pinned in-memory Map; mirrors
// the leads/decisions store pattern. Approval applies the payload to the
// canonical entity via the admin catalog/dealer stores.

import { randomUUID } from "node:crypto";
import { writeAudit } from "@/lib/admin/audit";
import {
  createPrice,
  updateDealer,
  updateOfferById,
} from "@/lib/admin";
import type {
  DealerSubmission,
  SubmissionKind,
  SubmissionStatus,
} from "./types";

type SubmissionStore = { submissions: Map<string, DealerSubmission> };

const g = globalThis as unknown as { __zlq_submission_store?: SubmissionStore };
const store: SubmissionStore =
  g.__zlq_submission_store ??
  (g.__zlq_submission_store = { submissions: new Map() });

export type CreateSubmissionInput = {
  dealer_id: string;
  kind: SubmissionKind;
  payload: Record<string, unknown>;
  submitted_by: string;
  target_id?: string;
  status?: SubmissionStatus;
};

export function createSubmission(
  input: CreateSubmissionInput,
): DealerSubmission {
  const submission_id = `sub_${randomUUID()}`;
  const t = Date.now();
  const submission: DealerSubmission = {
    submission_id,
    dealer_id: input.dealer_id,
    kind: input.kind,
    payload: input.payload,
    status: input.status ?? "submitted",
    submitted_by: input.submitted_by,
    ...(input.target_id !== undefined && { target_id: input.target_id }),
    created_at: t,
    updated_at: t,
  };
  store.submissions.set(submission_id, submission);
  writeAudit({
    actor_type: "dealer",
    actor_id: input.dealer_id,
    role: "dealer",
    action: "submission.create",
    entity_type: "submission",
    entity_id: submission_id,
    after: { kind: submission.kind, target_id: submission.target_id },
  });
  return { ...submission };
}

export type SubmissionFilter = {
  dealer_id?: string;
  kind?: SubmissionKind;
  status?: SubmissionStatus | readonly SubmissionStatus[];
};

export function listSubmissions(
  filter: SubmissionFilter = {},
): DealerSubmission[] {
  let rows = Array.from(store.submissions.values());
  if (filter.dealer_id) rows = rows.filter((s) => s.dealer_id === filter.dealer_id);
  if (filter.kind) rows = rows.filter((s) => s.kind === filter.kind);
  if (filter.status) {
    const allowed = Array.isArray(filter.status) ? filter.status : [filter.status];
    rows = rows.filter((s) => (allowed as readonly SubmissionStatus[]).includes(s.status));
  }
  rows.sort((a, b) => b.updated_at - a.updated_at);
  return rows.map((s) => ({ ...s }));
}

export function getSubmission(submissionId: string): DealerSubmission | null {
  const s = store.submissions.get(submissionId);
  return s ? { ...s } : null;
}

export function getSubmissionForDealer(
  submissionId: string,
  dealerId: string,
): DealerSubmission | null {
  const s = store.submissions.get(submissionId);
  if (!s || s.dealer_id !== dealerId) return null;
  return { ...s };
}

export type TransitionSubmissionInput = {
  submission_id: string;
  to_status: SubmissionStatus;
  reviewer_id?: string;
  review_note?: string;
  payload_patch?: Record<string, unknown>;
};

export type TransitionSubmissionResult =
  | { ok: true; submission: DealerSubmission }
  | { ok: false; error: "not_found" | "invalid_transition" };

export function transitionSubmission(
  input: TransitionSubmissionInput,
): TransitionSubmissionResult {
  const s = store.submissions.get(input.submission_id);
  if (!s) return { ok: false, error: "not_found" };
  const t = Date.now();
  const next: DealerSubmission = {
    ...s,
    status: input.to_status,
    updated_at: t,
    ...(input.reviewer_id !== undefined && { reviewer_id: input.reviewer_id }),
    ...(input.review_note !== undefined && { review_note: input.review_note }),
    ...(input.payload_patch !== undefined && {
      payload: { ...s.payload, ...input.payload_patch },
    }),
    ...((input.to_status === "approved" ||
      input.to_status === "rejected" ||
      input.to_status === "published" ||
      input.to_status === "cancelled") && { resolved_at: t }),
  };
  store.submissions.set(input.submission_id, next);
  return { ok: true, submission: { ...next } };
}

// Approve + apply: write the submission's payload to the canonical entity and
// flip its status to "published". Audit entries are written here so the
// approval and the resulting entity change are linked.
export function applyApprovedSubmission(args: {
  submission_id: string;
  reviewer_id: string;
  reviewer_role: string;
  review_note?: string;
}): TransitionSubmissionResult {
  const s = store.submissions.get(args.submission_id);
  if (!s) return { ok: false, error: "not_found" };

  // Apply the payload to the canonical store based on kind.
  if (s.kind === "profile_edit") {
    updateDealer(s.dealer_id, s.payload as Record<string, never>);
    writeAudit({
      actor_type: "admin",
      actor_id: args.reviewer_id,
      role: args.reviewer_role,
      action: "dealer.update",
      entity_type: "dealer",
      entity_id: s.dealer_id,
      after: s.payload,
      note: "via submission approval",
    });
  } else if (s.kind === "offer_create") {
    const payload = s.payload as Parameters<typeof createPrice>[0];
    const created = createPrice({
      ...payload,
      dealer_id: s.dealer_id,
      offer_status: "published",
      submitted_by: s.submitted_by,
    });
    writeAudit({
      actor_type: "admin",
      actor_id: args.reviewer_id,
      role: args.reviewer_role,
      action: "offer.publish",
      entity_type: "offer",
      entity_id: created.offer_id ?? created.price_id,
      after: { ...created },
      note: "approved + published from submission",
    });
  } else if (s.kind === "offer_update" && s.target_id) {
    updateOfferById(s.target_id, {
      ...(s.payload as Partial<Parameters<typeof updateOfferById>[1]>),
      offer_status: "published",
      reviewed_by: args.reviewer_id,
      published_at: new Date().toISOString(),
      ...(args.review_note !== undefined && { review_note: args.review_note }),
    });
    writeAudit({
      actor_type: "admin",
      actor_id: args.reviewer_id,
      role: args.reviewer_role,
      action: "offer.publish",
      entity_type: "offer",
      entity_id: s.target_id,
      after: s.payload,
    });
  }
  // "media" submissions are recorded but not auto-applied this sprint.

  const result = transitionSubmission({
    submission_id: args.submission_id,
    to_status: "published",
    reviewer_id: args.reviewer_id,
    ...(args.review_note !== undefined && { review_note: args.review_note }),
  });

  if (result.ok) {
    writeAudit({
      actor_type: "admin",
      actor_id: args.reviewer_id,
      role: args.reviewer_role,
      action: "submission.approve",
      entity_type: "submission",
      entity_id: args.submission_id,
      ...(args.review_note !== undefined && { note: args.review_note }),
    });
  }
  return result;
}
