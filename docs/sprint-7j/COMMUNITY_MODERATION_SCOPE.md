# COMMUNITY_MODERATION_SCOPE

## Goal

Draw the line between **private user data** (which must never be public) and **public community participation** (which is the only kind of user-generated content the platform exposes), and define the moderation rules that keep that line honest. This doc constrains `MARKET_PULSE_MODULE.md`, `COMMUNITY_PREDICTION_RULES.md`, and `SPONSORED_MARKET_QUESTION_RULES.md`.

## Public vs. private boundary

- **Private (never public):** Lead / Sorğu data — see [Lead](../../lib/leads/types.ts), [LeadTimelineEvent](../../lib/leads/types.ts). This includes the customer's name, `phone_hash`, preferred contact, lead notes, lead state history, and the customer↔dealer conversation. Visible only to the customer themselves (own `/profile/leads/[leadId]`) and to Internal Ops / Sales Manager via admin tooling. Never to other customers. Never to other dealers. Never in public listings.
- **Private (never public):** Decision Center data — see [Decision](../../lib/decisions/types.ts), saved cars, viewed cars, comparisons, readiness scores. Visible only to the owning customer.
- **Public:** Q&A questions and answers ([QAEntry](../../lib/content/types.ts)). Bazar Nəbzi topics, vote counts and final outcomes (see `PREDICTION_HISTORY_MODEL.md`). Encyclopedia entries. News articles. Dealer profiles and offers. Catalog content.

## What customers can do publicly

- Submit Q&A questions (held for moderation).
- Comment / discuss on a Q&A entry — **P1**, not P0. In MVP Q&A is read-mostly; user-submitted questions enter the moderation queue rather than threading into public discussion.
- Vote in Bazar Nəbzi topics (one vote per topic per OTP-verified user — see `COMMUNITY_PREDICTION_RULES.md`).
- Report content (Q&A entry, Bazar Nəbzi topic, sponsored placement that looks unlabeled).
- View aggregated Bazar Nəbzi history (percentages, participant counts, final outcomes — **not** individual votes).

## What customers cannot do publicly

- Comment on private lead details. Leads have no public surface.
- See other customers' votes individually. Aggregates only.
- Vote more than once per Bazar Nəbzi topic.
- Submit Q&A as if from a dealer or expert. Dealer-authored answers run through the Q&A Sponsored Answer package (see `ADS_REVENUE_MODEL.md` package #9) and carry a `Sponsorlu` label.
- Post external links in Q&A submissions in MVP (link allowlist comes in P1).

## Moderator role (recap from `ROLE_PERMISSION_MATRIX.md`)

- Reviews user-submitted Q&A questions before they appear on `/qa`.
- Reviews Bazar Nəbzi sponsored topic copy at creation and resolution.
- Reviews reported content (Q&A entries, Bazar Nəbzi topics, sponsored placements).
- Reviews suspected dealer self-promotion in Q&A submissions.
- Reviews suspicious voting patterns (e.g. coordinated voting on a sponsored topic).
- Cannot publish editorial content (that is Content Manager's right).
- Cannot manage payments, ads, or catalog.

## Rules the moderation system enforces

### Spam / abuse
- Q&A submissions with promotional language, unsolicited dealer references, or links → reject with note "Spam / reklam — Sponsorlu paketdən istifadə edin."
- Sponsored content sneaking through as organic → reject; if recurring, escalate to Sales Manager.

### Dealer self-promotion
- Q&A submission that names a specific dealer or pitches an offer → reject. Direct the dealer to `ADS_REVENUE_MODEL.md` package #9 (Q&A Sponsored Answer).
- Bazar Nəbzi vote pattern that looks like a dealer pushing their own model → flag for Moderator + Sales Manager review; do not silently neutralize votes (transparency over filtering).
- Dealer creating an account as a customer and submitting promotional Q&A → reject; Internal Ops Admin can record the dealer record's reputation flag for repeat behavior.

### Duplicate voting / manipulation
- One Bazar Nəbzi vote per OTP-verified user per topic. Enforced at the data layer.
- Guests can see Bazar Nəbzi topics but must OTP-verify to vote.
- Voting spikes from one IP / device cluster → flag for Moderator review. In MVP, no automated throttle — Moderator decides whether to invalidate suspect votes (and the invalidation itself produces an audit-log row).
- Final outcome on a closed topic is **never** edited to match the popular vote — outcome is set by Content Manager based on factual data.

### Sponsored content labeling
- Every sponsored Q&A answer must carry `Sponsorlu` chip + sponsor name.
- Every sponsored Bazar Nəbzi topic must carry `Sponsorlu` chip + sponsor name on the live topic AND on the closed historical snapshot.
- Unlabeled sponsored content is a launch blocker; if discovered post-launch, Moderator immediately suspends the placement and writes an audit-log row.

## Customer reporting

- Every Q&A entry, Bazar Nəbzi topic, and sponsored placement carries a "Şikayət et" / report button (Sprint 8 UI).
- Reports go into the Moderation queue (see `INTERNAL_ADMIN_MVP_SCOPE.md` section P).
- Customer who reports is identified by `user_id` but not shown publicly; reporter identity visible to Moderator only.

## Audit-log integration

Every moderation action writes one global audit-log row (see `INTERNAL_ADMIN_MVP_SCOPE.md` section O):

| Action verb | Notes |
|---|---|
| `qa_submission_approved` | new Q&A goes live |
| `qa_submission_rejected` | rejection reason required |
| `bazar_topic_approved` | applies to organic topics |
| `bazar_topic_sponsored_approved` | also requires `paid` payment status |
| `vote_invalidated` | reason required; affected user_ids logged |
| `report_received` | system event |
| `report_resolved` | resolution + outcome |
| `placement_suspended` | when sponsored content lacks label |

## Schema sketch (Sprint 8)

```ts
// lib/moderation/types.ts (Sprint 8)
export const REPORT_TARGETS = [
  "qa_entry",
  "bazar_topic",
  "ad_placement",
] as const;

export type ReportTarget = (typeof REPORT_TARGETS)[number];

export const REPORT_REASONS = [
  "spam",
  "off_topic",
  "dealer_self_promotion",
  "unlabeled_sponsored",
  "incorrect_facts",
  "vote_manipulation",
  "other",
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

export const REPORT_STATUSES = [
  "open",
  "in_review",
  "resolved_action_taken",
  "resolved_no_action",
  "escalated",
] as const;

export type ReportStatus = (typeof REPORT_STATUSES)[number];

export type ContentReport = {
  report_id: string;
  reporter_user_id: string;
  target_kind: ReportTarget;
  target_id: string;
  reason: ReportReason;
  note?: string;
  status: ReportStatus;
  assigned_moderator_id?: string;
  resolved_at?: number;
  resolution_note?: string;
  created_at: number;
};
```

## Cross-references

- Roles + Moderator's capability set → `ROLE_PERMISSION_MATRIX.md`
- Bazar Nəbzi voting / topic lifecycle rules → `COMMUNITY_PREDICTION_RULES.md`
- Sponsored Bazar Nəbzi integrity guardrails → `SPONSORED_MARKET_QUESTION_RULES.md`
- Audit-log scope → `INTERNAL_ADMIN_MVP_SCOPE.md`

## Not in Sprint 7

- Public commenting on Q&A entries.
- Report buttons in UI.
- Vote-throttling code.
- Any change to the public/private boundary as it currently exists.
