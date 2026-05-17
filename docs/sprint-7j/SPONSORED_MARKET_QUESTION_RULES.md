# SPONSORED_MARKET_QUESTION_RULES

## Goal

Define the integrity guardrails for **sponsored Bazar Nəbzi topics** (`ADS_REVENUE_MODEL.md` package #10). Sponsored topics are a real revenue surface, but they sit on top of a community engagement module — getting them wrong destroys user trust in the entire feature. These rules are non-negotiable.

## Hard rules

### 1. Label is mandatory
- Every sponsored topic carries the `Sponsorlu` (or `Reklam`) chip on the topic card, on the homepage preview block, in the `/qa` Bazar Nəbzi tab, and on the closed historical snapshot.
- The label is **never** hidden in a tooltip, behind a hover, or in microcopy. Same visual treatment as `ADS_REVENUE_MODEL.md` sponsored placements.
- Removing the label post-publication is a launch blocker → Moderator immediately suspends the topic and writes an audit-log row (`placement_suspended`).

### 2. Sponsor name cannot be hidden
- The sponsor's name appears in the topic header on the live topic and is **preserved forever** on the closed historical snapshot (see `PREDICTION_HISTORY_MODEL.md` — `sponsor_name` is in the snapshot schema).
- "Anonymous sponsor" is not an option in MVP.
- Sponsor logo / brand color is allowed only inside the labeled card region; cannot bleed into surrounding organic content.

### 3. Sponsor cannot modify final results
- `vote_count` per option and `result_percentages` are computed from real votes only. Sponsor has zero write access.
- After `status → closed`, snapshot is frozen. Any correction is a Super Admin action with an audit-log row stating why — and is rare.

### 4. Sponsor cannot remove negative outcomes
- If the topic resolves against the sponsor's preferred narrative, the snapshot still publishes. The closed historical record reflects what users voted and what actually happened.
- Sponsor cannot ask Zolaq to delete a closed topic. `archived` is reached only via retention policy, not advertiser request.
- Sponsor cannot rewrite `final_outcome` or `zolaq_market_summary` — these belong to Content Manager.

### 5. Zolaq Recommendation remains independent
- A sponsored topic does not affect the Zolaq Recommendation algorithm anywhere on the site (catalog, car detail, compare, decision center).
- Voting in a sponsored topic does not personalize the user's recommendations toward the sponsor.
- The "Zolaq tövsiyəsi" badge is never attached to sponsored topics.

### 6. Sponsored topic must pass moderator / admin approval
- Two-key approval is required before `status → active`:
  - **Content Manager** approves wording, options, integrity (no leading questions, no false dichotomies, no claims that misrepresent competitors).
  - **Moderator** reviews for manipulation potential (e.g. a sponsored topic whose options are designed to make the sponsor look favorable regardless of vote outcome).
  - **Sales Manager** approves the financial side and is the one who flips `payment_status = paid`.
- All three signatures recorded on the `BazarTopic` record (`approved_by_content`, `approved_by_moderator`, `approved_by_sales`) — see `PREDICTION_HISTORY_MODEL.md`.

### 7. Paid status must be confirmed before campaign goes live
- Sponsored topic stays in `sponsored_pending_approval` until the linked Order has `payment_status = paid` per `PAYMENT_INVOICE_FLOW.md`.
- "Invoice sent" alone is not enough. "Verbal agreement" is not enough.
- The campaign-activation API rejects `status → active` if `Order.payment_status !== "paid"` and the order_id is non-null.

### 8. Topic duration must be defined
- `start_date` and `end_date` are mandatory at creation and cannot be edited after the topic goes `active` (except `end_date` can be moved earlier via Moderator force-close).
- Duration matches one of the cadence bands: daily / weekly / monthly (see `COMMUNITY_PREDICTION_RULES.md`).
- A sponsored topic cannot run longer than one cadence band. To run longer, the sponsor buys a new topic in the next cadence cycle.

### 9. Placement is constrained to allowed surfaces
- Allowed surfaces (per `AD_PLACEMENT_MAP.md`):
  - Homepage "Bazar nə deyir?" preview block.
  - `/qa` Bazar Nəbzi tab.
  - Content sidebar adjacent to a related article (P1, sidebar feature not in P0).
- Prohibited surfaces:
  - Car detail page main content.
  - Lead detail pages (anywhere in `/profile/leads/**`).
  - Decision Center.
  - Anywhere a sponsored topic could be confused with the Zolaq Recommendation.

### 10. Sponsor cannot self-vote at scale
- Sponsor agreement explicitly disallows coordinated voting by the sponsor's employees or affiliates.
- Moderator monitors for vote patterns consistent with sponsor manipulation (see `COMMUNITY_MODERATION_SCOPE.md` "Duplicate voting / manipulation").
- Detected manipulation → vote invalidation + audit-log row + potential campaign suspension by Sales Manager.

## Sponsored-topic creation checklist (Content Manager)

Before flipping `status → sponsored_pending_approval`:

- [ ] Topic title is factually neutral (not "Why is X the best?").
- [ ] Options are mutually exclusive and exhaustive within reason.
- [ ] No option implies a guaranteed outcome favorable to the sponsor.
- [ ] No option misrepresents a competitor.
- [ ] `sponsored = true`, `sponsor_name` set, `sponsored_label` set to `Sponsorlu` or `Reklam`.
- [ ] `sponsored_order_id` linked to an Order in `PAYMENT_INVOICE_FLOW.md`.
- [ ] Cadence band matches the order term.
- [ ] `start_date` and `end_date` set within the cadence band.

Sales Manager flips `payment_status = paid` independently. Once paid + all three approvals present, anyone (Content Manager / Moderator / Super Admin) can flip the topic to `active`.

## Resolution rules (sponsored topics)

- Content Manager writes `final_outcome` and `zolaq_market_summary` independently of the sponsor.
- Sponsor receives the resolved snapshot in their monthly Dealer Insight Report (or campaign report for advertisers) — they do not approve the snapshot.
- If the topic resolves unfavorably for the sponsor (e.g. their model lost a "which gets more interest" question), the snapshot still publishes.

## Edge cases

| Situation | Resolution |
|---|---|
| Sponsor cancels mid-campaign | Order → `cancelled`; topic stays active for already-cast votes; campaign extension stops; snapshot publishes normally |
| Payment refunded after `paid` | Refunds are out-of-band addenda (per `PAYMENT_INVOICE_FLOW.md`); topic stays active or gets force-closed depending on Sales Manager decision; snapshot publishes |
| Sponsor disputes the `final_outcome` | Sponsor cannot dispute. Content Manager owns the resolution. Sponsor can buy a follow-up topic if they want to revisit the question |
| Topic flagged for manipulation | Moderator invalidates suspect votes; aggregates recompute; if integrity cannot be restored, Moderator can flip `status → rejected` with reason recorded; sponsor refund handled per `PAYMENT_INVOICE_FLOW.md` cancellation flow |
| Sponsor asks Zolaq to delete the historical snapshot | Refused. Snapshots are part of the public record |

## Cross-references

- Module concept → `MARKET_PULSE_MODULE.md`
- Voting rules and topic statuses → `COMMUNITY_PREDICTION_RULES.md`
- Schema (live topic + snapshot) → `PREDICTION_HISTORY_MODEL.md`
- Placement rules per page → `AD_PLACEMENT_MAP.md`
- Payment gate → `PAYMENT_INVOICE_FLOW.md`
- Moderation actions → `COMMUNITY_MODERATION_SCOPE.md`
- Approval roles → `ROLE_PERMISSION_MATRIX.md`

## Not in Sprint 7

- Any sponsored-topic code or data.
- Any campaign-activation API.
- Any approval workflow UI.
