import type { Invoice } from "./types";

export const INVOICE_SEED: readonly Invoice[] = [
  {
    invoice_id: "inv_seed_1",
    invoice_number: "ZLQ-2026-0011",
    ad_request_id: "adr_seed_2",
    dealer_id: "dealer_nordic_motors_azerbaijan",
    amount: 1200,
    currency: "AZN",
    due_at: "2026-05-25",
    status: "invoice_sent",
    notes: "Volvo premium profil — aylıq",
    created_by: "admin_sales",
    created_at: Date.parse("2026-05-13T11:00:00+04:00"),
    updated_at: Date.parse("2026-05-13T11:00:00+04:00"),
  },
  {
    invoice_id: "inv_seed_2",
    invoice_number: "ZLQ-2026-0009",
    ad_request_id: "adr_seed_3",
    dealer_id: "dealer_premium_auto_baku",
    amount: 2500,
    currency: "AZN",
    due_at: "2026-04-25",
    status: "paid",
    notes: "Ana səhifə bloku — may",
    paid_at: Date.parse("2026-05-01T10:00:00+04:00"),
    created_by: "admin_sales",
    created_at: Date.parse("2026-04-22T09:00:00+04:00"),
    updated_at: Date.parse("2026-05-01T10:00:00+04:00"),
  },
];
