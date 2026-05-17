// Invoice store. Admin creates an invoice tied to an approved ad request;
// dealer uploads proof (lib/payments); admin approves proof which flips
// invoice to `paid` and activates the linked ad request.

import { randomUUID } from "node:crypto";
import { writeAudit } from "@/lib/admin/audit";
import { INVOICE_SEED } from "./seed";
import type { Invoice, InvoiceStatus } from "./types";

type Store = { rows: Map<string, Invoice>; counter: number };
const g = globalThis as unknown as { __zlq_invoices_store?: Store };
const store: Store =
  g.__zlq_invoices_store ??
  (g.__zlq_invoices_store = {
    rows: new Map(INVOICE_SEED.map((r) => [r.invoice_id, { ...r }])),
    counter: 12,
  });

function nextInvoiceNumber(): string {
  store.counter += 1;
  const padded = String(store.counter).padStart(4, "0");
  return `ZLQ-2026-${padded}`;
}

const ALLOWED: Record<InvoiceStatus, readonly InvoiceStatus[]> = {
  pending: ["invoice_sent", "cancelled"],
  invoice_sent: ["payment_uploaded", "overdue", "cancelled"],
  payment_uploaded: ["paid", "invoice_sent"],
  paid: [],
  overdue: ["paid", "cancelled"],
  cancelled: [],
};

export type CreateInvoiceInput = {
  ad_request_id: string;
  dealer_id: string | null;
  amount: number;
  currency: "AZN" | "USD" | "EUR";
  due_at: string;
  notes?: string;
  created_by: string;
  actor: { actor_id: string; role: string };
};

export function createInvoice(input: CreateInvoiceInput): Invoice {
  const invoice_id = `inv_${randomUUID()}`;
  const t = Date.now();
  const row: Invoice = {
    invoice_id,
    invoice_number: nextInvoiceNumber(),
    ad_request_id: input.ad_request_id,
    dealer_id: input.dealer_id,
    amount: input.amount,
    currency: input.currency,
    due_at: input.due_at,
    status: "pending",
    ...(input.notes !== undefined && { notes: input.notes }),
    created_by: input.created_by,
    created_at: t,
    updated_at: t,
  };
  store.rows.set(invoice_id, row);
  writeAudit({
    actor_type: "admin",
    actor_id: input.actor.actor_id,
    role: input.actor.role,
    action: "invoice.create",
    entity_type: "invoice",
    entity_id: invoice_id,
    after: { ...row },
  });
  return { ...row };
}

export type InvoiceFilter = {
  dealer_id?: string;
  status?: InvoiceStatus | readonly InvoiceStatus[];
  ad_request_id?: string;
};

export function listInvoices(filter: InvoiceFilter = {}): Invoice[] {
  let rows = Array.from(store.rows.values());
  if (filter.dealer_id !== undefined) {
    rows = rows.filter((r) => r.dealer_id === filter.dealer_id);
  }
  if (filter.ad_request_id) {
    rows = rows.filter((r) => r.ad_request_id === filter.ad_request_id);
  }
  if (filter.status) {
    const allowed = Array.isArray(filter.status) ? filter.status : [filter.status];
    rows = rows.filter((r) =>
      (allowed as readonly InvoiceStatus[]).includes(r.status),
    );
  }
  rows.sort((a, b) => b.updated_at - a.updated_at);
  return rows.map((r) => ({ ...r }));
}

export function getInvoice(id: string): Invoice | null {
  const r = store.rows.get(id);
  return r ? { ...r } : null;
}

export function getInvoiceForDealer(
  id: string,
  dealerId: string,
): Invoice | null {
  const r = store.rows.get(id);
  if (!r || r.dealer_id !== dealerId) return null;
  return { ...r };
}

const TRANSITION_ACTION: Record<InvoiceStatus, string> = {
  pending: "invoice.create",
  invoice_sent: "invoice.send",
  payment_uploaded: "payment.upload",
  paid: "invoice.mark_paid",
  overdue: "invoice.mark_overdue",
  cancelled: "invoice.cancel",
};

export type TransitionInvoiceResult =
  | { ok: true; row: Invoice }
  | { ok: false; error: "not_found" | "invalid_transition" };

export function transitionInvoice(input: {
  id: string;
  to: InvoiceStatus;
  actor: { actor_type: "admin" | "dealer"; actor_id: string; role: string };
  cancel_reason?: string;
  payment_proof_id?: string;
  note?: string;
}): TransitionInvoiceResult {
  const before = store.rows.get(input.id);
  if (!before) return { ok: false, error: "not_found" };
  const allowed = ALLOWED[before.status];
  if (!allowed.includes(input.to)) {
    return { ok: false, error: "invalid_transition" };
  }
  const t = Date.now();
  const next: Invoice = {
    ...before,
    status: input.to,
    updated_at: t,
    ...(input.to === "paid" && { paid_at: t }),
    ...(input.to === "overdue" && { marked_overdue_at: t }),
    ...(input.cancel_reason !== undefined && {
      cancel_reason: input.cancel_reason,
    }),
    ...(input.payment_proof_id !== undefined && {
      payment_proof_id: input.payment_proof_id,
    }),
  };
  store.rows.set(input.id, next);
  writeAudit({
    actor_type: input.actor.actor_type,
    actor_id: input.actor.actor_id,
    role: input.actor.role,
    action: TRANSITION_ACTION[input.to] as Parameters<
      typeof writeAudit
    >[0]["action"],
    entity_type: "invoice",
    entity_id: input.id,
    before: { status: before.status },
    after: { status: next.status },
    ...(input.note !== undefined && { note: input.note }),
  });
  return { ok: true, row: { ...next } };
}
