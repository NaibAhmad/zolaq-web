// Sprint 8E payment proof. Dealer uploads metadata (reference number, optional
// file_ref, note). No real file storage in this sprint — file_ref is a
// free-form string (e.g., "wire-2026-05-13-12345"). Admin reviews and either
// approves (flips invoice to `paid`, activates ad request) or rejects (with
// review note).

export const PAYMENT_PROOF_STATUSES = [
  "pending_review",
  "approved",
  "rejected",
] as const;
export type PaymentProofStatus = (typeof PAYMENT_PROOF_STATUSES)[number];

export type PaymentProof = {
  payment_proof_id: string;
  invoice_id: string;
  dealer_id: string;
  reference: string; // bank transfer ref, etc.
  file_ref?: string; // path or external URL placeholder
  uploaded_by: string;
  uploaded_at: number;
  proof_note?: string;
  status: PaymentProofStatus;
  admin_review_note?: string;
  reviewed_by?: string;
  reviewed_at?: number;
};

export const PAYMENT_PROOF_STATUS_LABEL_AZ: Record<PaymentProofStatus, string> =
  {
    pending_review: "Yoxlamada",
    approved: "Təsdiqlənib",
    rejected: "Rədd edilib",
  };
