// Sprint 8E manual invoice. No online payment surface in this sprint — the
// admin issues an invoice for an approved ad request, the dealer uploads
// payment proof, the admin approves the proof, the invoice flips to `paid`,
// and the originating ad request can be activated.

export const INVOICE_STATUSES = [
  "pending",
  "invoice_sent",
  "payment_uploaded",
  "paid",
  "overdue",
  "cancelled",
] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export type Invoice = {
  invoice_id: string;
  invoice_number: string;
  ad_request_id: string;
  dealer_id: string | null;
  amount: number;
  currency: "AZN" | "USD" | "EUR";
  due_at: string; // ISO yyyy-mm-dd
  status: InvoiceStatus;
  payment_proof_id?: string;
  notes?: string;
  cancel_reason?: string;
  paid_at?: number;
  marked_overdue_at?: number;
  created_by: string;
  created_at: number;
  updated_at: number;
};

export const INVOICE_STATUS_LABEL_AZ: Record<InvoiceStatus, string> = {
  pending: "Gözləmədə",
  invoice_sent: "Faktura göndərildi",
  payment_uploaded: "Ödəniş yükləndi",
  paid: "Ödənildi",
  overdue: "Müddəti keçib",
  cancelled: "Ləğv edildi",
};
