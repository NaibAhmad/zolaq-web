# PAYMENT_INVOICE_FLOW

## Goal

Document how Zolaq takes money from dealers and advertisers in MVP — **manually, via bank transfer, with no online payment integration**. This is the source of truth for `ADS_REVENUE_MODEL.md`, `INTERNAL_ADMIN_MVP_SCOPE.md`, and the campaign-go-live gate documented in `AD_PLACEMENT_MAP.md`.

**Round 2 update.** Sprint 8 adds two private routes that participate in this flow: `/admin/invoices` + `/admin/payments` for the admin side, and `/dealer/invoices` + `/dealer/payment-proof` for the dealer side. The **canonical `payment_status` state machine below is unchanged** and remains admin-owned. A separate dealer-side view shows the dealer the additional `payment_uploaded` indicator (when the dealer has uploaded proof but admin has not yet confirmed) and the downstream campaign states. **Admin still owns the final `payment_status`.**

## MVP decision (Sprint 7 + 8)

- **No online payment integration.** No card payment. No automated billing.
- **No dealer wallet** or stored balance.
- **No subscription auto-renewal.** Every renewal is a new manually-issued order.
- Everything runs through bank transfer + manual reconciliation by Sales Manager.
- Audit-logged at every state transition (see `INTERNAL_ADMIN_MVP_SCOPE.md` section O).

## Payment status state machine

```ts
// lib/billing/types.ts (Sprint 8)
export const PAYMENT_STATUSES = [
  "pending",        // order created, no invoice issued yet
  "invoice_sent",   // invoice / manual contract sent to buyer
  "paid",           // bank transfer confirmed; campaign can activate
  "overdue",        // invoice past due date, not yet paid
  "cancelled",      // order cancelled before payment
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export type OrderKind =
  | "verified_dealer_package"
  | "premium_dealer_profile"
  | "featured_dealer"
  | "featured_offer"
  | "sponsored_catalog_card"
  | "homepage_sponsored_block"
  | "content_sponsorship"
  | "compare_sponsored_offer"
  | "qa_sponsored_answer"
  | "bazar_nebzi_sponsored_question"
  | "qualified_lead_package"
  | "monthly_dealer_insight_report";

export type Order = {
  order_id: string;
  buyer_kind: "dealer" | "advertiser";
  buyer_id: string;                 // dealer_id or advertiser_id
  order_kind: OrderKind;            // see ADS_REVENUE_MODEL.md
  placement_ids: string[];          // ad placements gated by this order
  amount: number;                   // AZN
  currency: "AZN";
  invoice_number?: string;
  invoice_sent_at?: number;
  due_at?: number;
  paid_at?: number;
  cancelled_at?: number;
  payment_status: PaymentStatus;
  payment_proof_note?: string;      // free-text reference (no file upload in MVP)
  created_by: string;               // sales_manager user_id
  created_at: number;
  updated_at: number;
};
```

## Allowed transitions

```
pending      → invoice_sent | cancelled
invoice_sent → paid | overdue | cancelled
overdue      → paid | cancelled
paid         → (terminal — refunds in MVP are manual contract addenda; no status reversal)
cancelled    → (terminal)
```

Any other transition is rejected at the admin Form layer and would be a bug.

## P0 flow (the only flow that exists in MVP)

1. **Sales Manager creates the order.** Selects buyer (dealer / advertiser), `order_kind`, the specific placements the order covers, and a price. `payment_status = pending`.
2. **Invoice / manual contract issued.** Sales Manager issues invoice externally (accounting tool, signed PDF, or email-based) and records the invoice number + due date in the admin Form. `payment_status = invoice_sent`. Audit-log row written.
3. **Bank transfer.** Dealer / advertiser pays via bank transfer. Out of band.
4. **Payment proof recorded.** Sales Manager confirms with finance, writes a free-text `payment_proof_note` (e.g. "Bank statement ref #12345, 2026-06-12").
5. **Status flipped to `paid`.** Super Admin co-signs for high-value orders (>X AZN threshold — configurable). Audit-log row written.
6. **Campaign activates.** Only when `payment_status = paid` (or, for trade / partnership deals, Super Admin manually approves with a documented exception). See `AD_PLACEMENT_MAP.md` — placements with no `paid` upstream order cannot go live.
7. **End-of-campaign.** Campaign ends per `valid_until` on the placement, not by payment status — once paid, the campaign runs to completion regardless.
8. **Overdue handling.** If `due_at` passes without payment: Sales Manager flips to `overdue` (manually; no cron in MVP). Campaign does not start. Customer chase happens out of band.
9. **Cancellation.** Either side can cancel before `paid`. Once `paid`, refunds are out-of-band via signed addendum and recorded as a note — no status reversal.

## Audit-log entries required

Every transition produces one row in the global audit log (see `INTERNAL_ADMIN_MVP_SCOPE.md` section O):

| Action verb | Actor | Entity | Notes |
|---|---|---|---|
| `order_created` | sales_manager | Order | initial creation |
| `invoice_sent` | sales_manager | Order | `invoice_number`, `due_at` recorded |
| `payment_recorded` | sales_manager | Order | `payment_proof_note` required |
| `payment_confirmed` | super_admin or sales_manager | Order | flips to `paid`; campaign go-live unlocked |
| `order_marked_overdue` | sales_manager | Order | manual; no cron in MVP |
| `order_cancelled` | sales_manager / super_admin | Order | reason note required |
| `campaign_activated` | sales_manager | AdPlacement | only valid if order.payment_status = `paid` |
| `campaign_deactivated` | sales_manager / super_admin | AdPlacement | reason note required |
| `payment_proof_uploaded` | dealer_admin | Order | dealer submitted `payment_proof_note` at `/dealer/payment-proof`; does not advance `payment_status` |

## Dealer-side view (Sprint 8 — P0)

Round 2 promotes the dealer-side invoice view from P1 to **P0**. Dealers see their own orders and can upload payment proof through the dealer portal:

- `/dealer/invoices` — read-only list of own `Order` records linked to the session's `dealer_id`.
- `/dealer/payment-proof` — upload payment proof against an open `invoice_sent` order.

The dealer never owns the canonical `payment_status`. They see a **mapped view** that adds an intermediate "proof uploaded, awaiting confirmation" indicator and rolls forward into downstream campaign states. The canonical `Order.payment_status` enum (`pending | invoice_sent | paid | overdue | cancelled`) above remains authoritative; the dealer-side view is a presentation layer.

### Dealer-visible status set

```ts
// lib/billing/dealer-view.ts (Sprint 8) — presentation enum only; not stored
export const DEALER_VISIBLE_STATUSES = [
  "pending",            // mirrors Order.payment_status = "pending"
  "invoice_sent",       // mirrors Order.payment_status = "invoice_sent"
  "payment_uploaded",   // dealer uploaded proof; Order.payment_status still "invoice_sent" until admin confirms — non-canonical signal
  "paid",               // mirrors Order.payment_status = "paid"
  "approved",           // Order.payment_status = "paid" + all admin/Content Manager approvals signed on the linked AdPlacement
  "active",             // linked AdPlacement.status = "active" (campaign live within its window)
  "expired",            // linked AdPlacement.status = "ended" OR Order.due_at passed without payment
  "rejected",           // linked AdPlacement.status = "rejected" OR Order.payment_status = "cancelled"
] as const;
```

### Dealer-view derivation rule

| Underlying canonical signal | Dealer view |
|---|---|
| `Order.payment_status = "pending"` | `pending` |
| `Order.payment_status = "invoice_sent"`, no `DealerSubmission.kind = "payment_proof"` linked | `invoice_sent` |
| `Order.payment_status = "invoice_sent"`, a `payment_proof` submission exists in `submitted` or `under_review` | `payment_uploaded` |
| `Order.payment_status = "paid"`, no `AdPlacement` approval yet | `paid` |
| `Order.payment_status = "paid"` + all `AdPlacement` approvals signed but not yet within window | `approved` |
| `AdPlacement.status = "active"` for any linked placement | `active` |
| `Order.payment_status = "cancelled"` OR `AdPlacement.status = "ended"` past `end_at` | `expired` |
| `Order.payment_status = "cancelled"` triggered by admin rejection OR `AdPlacement.status = "rejected"` | `rejected` |

`payment_uploaded` is **not** a canonical `Order.payment_status` value — it never appears in the audit log, never gates campaign activation, and never advances the state machine. It exists only as a UI indicator so the dealer knows the platform received the proof.

### What the dealer can and cannot do

- **Can:** view own `Order` records at `/dealer/invoices`; upload payment-proof reference at `/dealer/payment-proof` against an `invoice_sent` order; cancel a `payment_proof` submission before admin confirms.
- **Cannot:** change `Order.payment_status`; mark own order as `paid`; bypass the `paid` gate to activate a campaign; see other dealers' orders.

### What admins / advertisers see in MVP

- Sales Manager continues to email invoices and renewal reminders out-of-band.
- Admin views the full `Order.payment_status` enum at `/admin/invoices` and `/admin/payments`.
- Advertiser self-service is still **P1** — no advertiser login surface in Sprint 8.

## Anti-patterns (do not do)

- Do **not** auto-activate a campaign on `invoice_sent`. Wait for `paid`.
- Do **not** silently extend a campaign because the dealer paid late. The campaign window is fixed; extensions require a new addendum line in the same order or a separate order.
- Do **not** delete an order. Use `cancelled`. The row stays for audit.
- Do **not** edit `amount` after `invoice_sent`. Cancel and re-issue.
- Do **not** allow Sales Manager to flip their own order to `paid` for amounts above the Super Admin co-sign threshold.

## Post-MVP (P1 + P2)

Round 2 update: read-only dealer invoice view + payment-proof upload moved from P1 → **P0** (Sprint 8). The remaining items below are still post-MVP.

- **P1 (Sprint 9):** Optional file attachment for payment proof (PDF / image with virus scan). Email reminders automated. Overdue auto-flag cron job. Email + WhatsApp notification when admin confirms `paid`.
- **P2:** Online card payment integration. Subscription billing for recurring packages (Verified Dealer, Premium Profile, Featured Dealer). Dealer wallet with topup → spend → refund flow. Auto-invoicing on package renewal. Refund workflow with status reversal capability and audit-protected refund reason.

## Cross-references

- What gets sold and at what cadence + dealer-side request flow → `ADS_REVENUE_MODEL.md`
- Campaign placement rules and labeling → `AD_PLACEMENT_MAP.md`
- Approval roles for `paid` confirmation → `ROLE_PERMISSION_MATRIX.md`
- Audit-log scope → `INTERNAL_ADMIN_MVP_SCOPE.md`
- Admin route inventory (`/admin/invoices`, `/admin/payments`) → `ADMIN_PANEL_ROUTE_MAP.md`
- Dealer route inventory (`/dealer/invoices`, `/dealer/payment-proof`) → `DEALER_PANEL_ROUTE_MAP.md`
- Step-by-step payment-proof workflow → `DEALER_SELF_SERVICE_P0_WORKFLOW.md` (workflow W8)
- Sprint 8 admin + dealer tooling for this flow → `SPRINT_8_IMPLEMENTATION_REQUIREMENTS.md`

## Not in Sprint 7

- Any code or schema for orders, invoices, or payments.
- Any payment-status field anywhere in the running app.
- Any email automation.
