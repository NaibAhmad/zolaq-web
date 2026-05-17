import type { PaymentProof } from "./types";

export const PAYMENT_PROOF_SEED: readonly PaymentProof[] = [
  {
    payment_proof_id: "pp_seed_1",
    invoice_id: "inv_seed_2",
    dealer_id: "dealer_premium_auto_baku",
    reference: "BANK-2026-05-01-7782",
    file_ref: "uploads/dealer_premium_auto_baku/proof-april.pdf",
    uploaded_by: "Premium Auto Finance",
    uploaded_at: Date.parse("2026-04-30T16:00:00+04:00"),
    proof_note: "Aprel ayı üçün ödəniş köçürmə qəbzi.",
    status: "approved",
    admin_review_note: "Köçürmə uyğundur.",
    reviewed_by: "admin_sales",
    reviewed_at: Date.parse("2026-05-01T10:00:00+04:00"),
  },
];
