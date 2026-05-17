// Payment-proof store. Dealer uploads proof → admin reviews → on approval,
// the linked invoice flips to `paid` and (handled by the admin handler) the
// originating ad request can be activated. Every transition writes audit.

import { randomUUID } from "node:crypto";
import { writeAudit } from "@/lib/admin/audit";
import { PAYMENT_PROOF_SEED } from "./seed";
import type { PaymentProof, PaymentProofStatus } from "./types";

type Store = { rows: Map<string, PaymentProof> };
const g = globalThis as unknown as { __zlq_payments_store?: Store };
const store: Store =
  g.__zlq_payments_store ??
  (g.__zlq_payments_store = {
    rows: new Map(PAYMENT_PROOF_SEED.map((r) => [r.payment_proof_id, { ...r }])),
  });

export type UploadProofInput = {
  invoice_id: string;
  dealer_id: string;
  reference: string;
  uploaded_by: string;
  file_ref?: string;
  proof_note?: string;
};

export function uploadPaymentProof(input: UploadProofInput): PaymentProof {
  const payment_proof_id = `pp_${randomUUID()}`;
  const t = Date.now();
  const row: PaymentProof = {
    payment_proof_id,
    invoice_id: input.invoice_id,
    dealer_id: input.dealer_id,
    reference: input.reference,
    ...(input.file_ref !== undefined && { file_ref: input.file_ref }),
    uploaded_by: input.uploaded_by,
    uploaded_at: t,
    ...(input.proof_note !== undefined && { proof_note: input.proof_note }),
    status: "pending_review",
  };
  store.rows.set(payment_proof_id, row);
  writeAudit({
    actor_type: "dealer",
    actor_id: input.dealer_id,
    role: "dealer",
    action: "payment.upload",
    entity_type: "payment_proof",
    entity_id: payment_proof_id,
    after: {
      invoice_id: row.invoice_id,
      reference: row.reference,
      file_ref: row.file_ref,
    },
  });
  return { ...row };
}

export type PaymentProofFilter = {
  dealer_id?: string;
  status?: PaymentProofStatus | readonly PaymentProofStatus[];
  invoice_id?: string;
};

export function listPaymentProofs(filter: PaymentProofFilter = {}): PaymentProof[] {
  let rows = Array.from(store.rows.values());
  if (filter.dealer_id) rows = rows.filter((r) => r.dealer_id === filter.dealer_id);
  if (filter.invoice_id) rows = rows.filter((r) => r.invoice_id === filter.invoice_id);
  if (filter.status) {
    const allowed = Array.isArray(filter.status) ? filter.status : [filter.status];
    rows = rows.filter((r) =>
      (allowed as readonly PaymentProofStatus[]).includes(r.status),
    );
  }
  rows.sort((a, b) => b.uploaded_at - a.uploaded_at);
  return rows.map((r) => ({ ...r }));
}

export function getPaymentProof(id: string): PaymentProof | null {
  const r = store.rows.get(id);
  return r ? { ...r } : null;
}

export function getPaymentProofForDealer(
  id: string,
  dealerId: string,
): PaymentProof | null {
  const r = store.rows.get(id);
  if (!r || r.dealer_id !== dealerId) return null;
  return { ...r };
}

export type ReviewResult =
  | { ok: true; row: PaymentProof }
  | { ok: false; error: "not_found" | "already_reviewed" };

export function reviewPaymentProof(input: {
  id: string;
  to: "approved" | "rejected";
  reviewer_id: string;
  reviewer_role: string;
  note?: string;
}): ReviewResult {
  const before = store.rows.get(input.id);
  if (!before) return { ok: false, error: "not_found" };
  if (before.status !== "pending_review") {
    return { ok: false, error: "already_reviewed" };
  }
  const t = Date.now();
  const next: PaymentProof = {
    ...before,
    status: input.to,
    reviewed_by: input.reviewer_id,
    reviewed_at: t,
    ...(input.note !== undefined && { admin_review_note: input.note }),
  };
  store.rows.set(input.id, next);
  writeAudit({
    actor_type: "admin",
    actor_id: input.reviewer_id,
    role: input.reviewer_role,
    action: input.to === "approved" ? "payment.approve" : "payment.reject",
    entity_type: "payment_proof",
    entity_id: input.id,
    before: { status: before.status },
    after: { status: next.status },
    ...(input.note !== undefined && { note: input.note }),
  });
  return { ok: true, row: { ...next } };
}
