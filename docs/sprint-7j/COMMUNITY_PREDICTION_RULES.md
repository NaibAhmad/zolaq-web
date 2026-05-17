# COMMUNITY_PREDICTION_RULES

## Goal

Define the **participation rules, topic types, and status enum** for Bazar Nəbzi. This is the operational rulebook that Sprint 8 implements in `lib/bazar-nebzi/types.ts`. Concept lives in `MARKET_PULSE_MODULE.md`. Schema lives in `PREDICTION_HISTORY_MODEL.md`.

## Participation rules

### Who can vote
- **OTP-verified Customers only.** Authentication continues to be the existing OTP flow ([lib/auth/session.ts](../../lib/auth/session.ts)) — no new auth surface for Bazar Nəbzi.
- **Guests** can read topics, see live aggregate percentages, see participant count and closing date. When a guest clicks "Sən də seç", the existing OTP verification flow opens. After successful verification, the vote is recorded.
- One vote per OTP-verified user per topic. Enforced server-side via a unique constraint on `(topic_id, user_id)` (see `PREDICTION_HISTORY_MODEL.md`).
- A user cannot change their vote after submitting in MVP. (Vote-change is a P1 consideration — disallow in P0 to keep aggregates stable and the audit trail simple.)
- Dealers cannot vote on behalf of customers. Dealer Admin role (P1) does not include a vote capability — only the Customer role does. A user can hold both `dealer_admin` and `customer` roles, but each topic accepts only one vote per `user_id` regardless of role.

### Reward rules
- **No money involved.** No wager. No payout. No deposit. No withdrawal.
- **No cash-value rewards.** No vouchers, no discounts, no credit, no in-product currency.
- **Only badges / points / fun achievements** are allowed (P1) — and they remain non-redeemable. A "Bazar nəbzi iştirakçısı" badge on a profile is the maximum reward surface. Any feature that exchanges badges/points for value (discount, gift, cash) is **out of scope forever** under this module's product policy.
- No leaderboards in P0. A leaderboard could appear in P1 but must remain non-redeemable.

### Voting mechanics
- 3–4 multiple-choice options per topic. No free text.
- Vote is final once submitted.
- Aggregate percentages and participant count are visible to everyone (including guests) on the live topic, both before and after voting. This is the lower-stakes path — visible aggregates encourage participation since no money is at stake.
- Individual votes are private — only aggregates are public.
- Closing date is fixed at topic creation and shown on every view of the topic. Force-close by Moderator is the only way to close early.

### Admin / moderator powers
- **Admin / Moderator can close a topic early** if it is being abused or if data dependency makes the question no longer meaningful (e.g. a model is delisted mid-week).
- **Content Manager marks the final outcome** when resolving a closed topic. Outcome is set by factual data, not by the popular vote.
- **Sponsored topics require approval** — see `SPONSORED_MARKET_QUESTION_RULES.md`. Sponsored topics cannot go live until both Sales Manager (financial) and Content Manager + Moderator (editorial) have approved, and `payment_status = paid` per `PAYMENT_INVOICE_FLOW.md`.
- **Suspicious voting can be flagged.** Moderator can invalidate votes (writes audit-log row per `COMMUNITY_MODERATION_SCOPE.md`). Aggregates re-compute after invalidation.
- **Dealer- or manufacturer-sponsored topics must not be disguised** as neutral content. Sponsor name on the live topic and on the historical snapshot is mandatory.

## Topic types

Three cadence bands. Each band runs at most one active topic at a time in MVP (inventory limit per `MARKET_PULSE_MODULE.md`).

```ts
// lib/bazar-nebzi/types.ts (Sprint 8)
export const BAZAR_TOPIC_TYPES = [
  "daily",      // Günlük   — opens start-of-day, closes end-of-day
  "weekly",     // Həftəlik — opens Monday, closes Sunday
  "monthly",    // Aylıq    — opens 1st of month, closes last day of month
] as const;

export type BazarTopicType = (typeof BAZAR_TOPIC_TYPES)[number];
```

## Topic statuses

```ts
export const BAZAR_TOPIC_STATUSES = [
  "draft",                          // being authored; not visible
  "sponsored_pending_approval",     // sponsored only; awaits approvals + paid
  "active",                         // public, accepting votes
  "closed",                         // public, votes frozen, awaiting outcome
  "resolved",                       // public, final_outcome + Zolaq summary set
  "archived",                       // public, retention period passed; read-only
  "rejected",                       // terminal; never went live
] as const;

export type BazarTopicStatus = (typeof BAZAR_TOPIC_STATUSES)[number];
```

## Allowed transitions

```
draft
  → sponsored_pending_approval   (organic topic skips this — Content Manager flags sponsored=true)
  → active                       (organic topic: Content Manager approves; sponsored topic: must be paid + approved)
  → rejected

sponsored_pending_approval
  → active                       (Sales Manager `paid` + Content Manager + Moderator approve)
  → rejected
  → draft                        (sent back for edits)

active
  → closed                       (end_date passes OR Moderator force-close)
  → rejected                     (extreme cases — abuse, data invalid; freezes votes)

closed
  → resolved                     (Content Manager writes final_outcome + zolaq_market_summary)
  → archived                     (skipping resolved is allowed for topics with no determinable outcome — e.g. force-closed; Content Manager writes a note explaining)

resolved
  → archived                     (after retention period)

archived
  → (terminal)

rejected
  → (terminal)
```

Any other transition is rejected at the admin Form layer.

## Voting eligibility checks (server-side)

Before recording a vote, the API must verify:

1. Topic exists.
2. Topic `status = active`.
3. `now < end_date`.
4. User is OTP-verified (session valid per [lib/auth/session.ts](../../lib/auth/session.ts)).
5. `(topic_id, user_id)` unique constraint not violated.
6. Selected option_id belongs to this topic.

Failure of any check returns a non-recording error. Tracking event `bazar_vote_submitted` fires only on successful recording (see `MARKET_PULSE_MODULE.md`).

## Suspicious-voting heuristics (P1 — for context only)

Sprint 8 ships with **no automated throttle**. Sprint 9 can layer in heuristics surfaced to the Moderator queue:

- Sudden spike in votes from one IP / device cluster.
- Voting pattern that uniformly favors a sponsored topic's sponsor brand.
- A user who created an account immediately before voting and never used the platform otherwise.

Heuristics flag for review only. Moderator decides whether to invalidate.

## What happens at closing time

1. End-of-period reached, OR Moderator triggers force-close.
2. Topic `status → closed`. Votes frozen.
3. Content Manager (within retention window — recommended 7 days) writes:
   - `final_outcome` — which option turned out to be correct, or `inconclusive`.
   - `zolaq_market_summary` — short editorial note explaining what happened.
4. Topic `status → resolved`. Snapshot appears in `/qa` Bazar Nəbzi tab under the appropriate cadence sub-tab and in "Tarixçə".
5. After configured retention period, `status → archived`. Snapshot remains visible but is read-only and exits "active history" listings.

## Cross-references

- Module concept and homepage placement → `MARKET_PULSE_MODULE.md`
- Schema (topic, option, vote, history snapshot) → `PREDICTION_HISTORY_MODEL.md`
- Sponsored-topic integrity → `SPONSORED_MARKET_QUESTION_RULES.md`
- Moderation scope (reports, vote invalidation) → `COMMUNITY_MODERATION_SCOPE.md`
- Sprint 8 admin tooling for topic CRUD + close + resolve → `INTERNAL_ADMIN_MVP_SCOPE.md`

## Not in Sprint 7

- Vote-recording API.
- Topic CRUD.
- Vote-change feature.
- Leaderboards or badges.
- Throttling / heuristics.
