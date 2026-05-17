# COMMUNITY_POINTS_RULES

## Goal

Define the **points economy** (`xal`) for Zolaq community participation: which
actions grant points, how many, with what daily caps, anti-spam rules, and the
hard constraints that keep points from ever becoming a real-world reward or a
trust-pillar lever.

Points are a **private, non-redeemable counter**. The only consumers of point
totals are (a) badge thresholds for selected badges in
[USER_BADGE_SYSTEM.md](USER_BADGE_SYSTEM.md) and (b) a private profile counter
on the user's own profile. No external system reads points.

## Hard constraints

- **Points have no cash value. They cannot be redeemed.** Not for vouchers, not
  for discounts, not for gifts, not for in-product currency, not for crypto.
- Points are **not transferable** between users.
- Points are **not visible** to dealers anywhere in any surface.
- Points are **owner-visible only** in P0 and P1 — visible to the user on
  their own profile, but never to other customers, never to dealers, never on
  any public surface. A future public profile (P2) would re-open this doc
  before any external visibility ships.
- **No leaderboard at P0 or P1.** Any future leaderboard would be P2 and
  remain non-redeemable per
  [GAMIFICATION_RISK_AND_TRUST_RULES.md](GAMIFICATION_RISK_AND_TRUST_RULES.md).
- Points **cannot affect Zolaq Recommendation.** The recommendation algorithm
  reads zero gamification state.
- Points **cannot affect Official Dealer Verification.**
  [DealerVerificationStatus](../../lib/dealers/types.ts) transitions are
  capability-based and immune to user points.
- Points **cannot affect Official Price.** No badge or point total changes the
  `verified` flag on a [PriceRecord](../../lib/cars/types.ts).
- **No cash value.** (Restated.)

## Point values

The points economy ships in two stages: a minimal **P0** ledger in Sprint 8
and an expanded **P1** ledger in Sprint 9. All values are admin-tunable via the
admin Form without code change. Visibility: P0 and P1 totals are
**owner-visible only** on the user's own profile — never public, never
exposed to dealers, never on a leaderboard (no leaderboard exists in P0 or
P1).

### P0 / Sprint 8 — minimal points

Six action types ship in MVP, all daily-capped, owner-private:

| Action | Points | Daily cap |
|---|---:|---:|
| Vote in Bazar Nəbzi (valid, non-invalidated) | 2 | 6 (≈ 1 daily + 1 weekly + 1 monthly + margin) |
| Ask a Q&A question (Moderator-approved) | 5 | 20 |
| Answer a Q&A question (Moderator-approved) | 3 | 30 |
| Compare 2+ cars (distinct trim set) | 2 | 6 |
| Submit verified lead (`LeadState ≥ submitted` per [lib/leads/types.ts](../../lib/leads/types.ts)) | 10 | 20 |
| Read encyclopedia / news entry (≥30s dwell, first time) | 1 | 10 |

### P1 / Sprint 9 — expanded points

Sprint 9 adds two more action types and the Moderator tooling required to
reverse grants on appeal / post-fact moderation:

| Action | Points | Daily cap |
|---|---:|---:|
| Answer marked helpful (`helpful_count` increment) | 5 per helpful, per answer | 25 |
| Complete a Decision Center step (each step, first time) | 5 | 15 |

Notes (apply to both P0 and P1):

- "Daily cap" means per UTC day, per `user_id`.
- "First time" qualifications dedup by the relevant identity tuple — see
  anti-spam rules below.
- Bazar Nəbzi daily cap of 6 corresponds to the cadence ceiling: at most 1
  daily + 1 weekly + 1 monthly active topic at a time in MVP, with margin for
  resolution-day overlaps.

## Anti-spam rules

- **All caps are per UTC day, per user.** A user cannot work around the cap by
  splitting actions across surfaces; a single counter governs each action type.
- **Q&A points** are granted **only after Moderator approval**. Rejection
  reverses the grant via an audit-logged compensating row.
- **Helpful-answer points** exclude helpful votes from the answer author and
  from accounts < 24h old (mirrors `helpful_answer` badge rule in
  [USER_BADGE_SYSTEM.md](USER_BADGE_SYSTEM.md)).
- **Reading points** dedup by unique `(user_id, content_id)`. Refreshing the
  page or revisiting an already-rewarded entry does not re-grant. Dwell time is
  validated server-side from canonical tracking events.
- **Comparison points** dedup by sorted-`trim_ids` hash. Comparing the same set
  of cars twice does not re-grant; varying the order does not bypass the dedup.
- **Lead points** are granted **on the first transition that crosses
  `submitted`** ([LeadState](../../lib/leads/types.ts)). Multiple subsequent
  state transitions on the same `lead_id` do not re-grant. A second `Lead` row
  with the same `phone_hash` within a configurable window is throttled.
- **Decision Center points** are granted **on the first completion of each
  step**, dedup by `(user_id, decision_id, step_id)`. Re-opening a completed
  Decision does not re-grant.
- **Suspicious-voting heuristics** (per
  [../sprint-7j/COMMUNITY_PREDICTION_RULES.md](../sprint-7j/COMMUNITY_PREDICTION_RULES.md))
  flag accounts; flagged accounts have point accrual **paused** pending
  Moderator review.
- **Cap overflow** silently drops the grant (no error to the user; a daily-cap
  event is written to the audit log for diagnostics only — without PII).

## Dealer self-promotion rule

- An authenticated user holding both `dealer_admin` and `customer` roles
  accrues points **only via the customer role**. The dealer role has zero
  point-earning surface.
- Q&A answers identified by Moderator as **dealer self-promotion** (per
  [../sprint-7j/COMMUNITY_MODERATION_SCOPE.md](../sprint-7j/COMMUNITY_MODERATION_SCOPE.md))
  forfeit any points awarded for that answer (compensating reversal row) and
  count toward the user's spam-strike record.
- Dealer-affiliated rings detected by abuse-detection (per
  [GAMIFICATION_RISK_AND_TRUST_RULES.md](GAMIFICATION_RISK_AND_TRUST_RULES.md))
  trigger pause-and-review across all member accounts.

## Audit log

- Every point grant writes one row to the global audit log per
  [../sprint-7j/SPRINT_8_IMPLEMENTATION_REQUIREMENTS.md](../sprint-7j/SPRINT_8_IMPLEMENTATION_REQUIREMENTS.md)
  Section J: `actor_user_id`, `action = "points_granted"`, `entity_kind =
  "point_grant"`, `entity_id`, `before` (prior total), `after` (new total),
  `timestamp`, `ip`, plus a `reason_code` (`qa_question_approved`,
  `bazar_vote_submitted`, `lead_submitted`, etc.).
- Every reversal (Moderator action, lead fraud finding, Q&A rejection) writes
  one row with `action = "points_reversed"` referencing the original grant id.
- Daily-cap silent-drops also write one row with `action =
  "points_cap_dropped"` for diagnostics.

## Tunability

All point values, daily caps, badge thresholds and decay rules (P2) are
configurable in the admin Form. Code change is required only to add a **new**
action type, not to retune an existing one.

## Cross-references

- Engagement overview →
  [GAMIFICATION_ENGAGEMENT_LAYER.md](GAMIFICATION_ENGAGEMENT_LAYER.md)
- Badges that consume point thresholds →
  [USER_BADGE_SYSTEM.md](USER_BADGE_SYSTEM.md)
- Bazar Nəbzi vote-point mechanics →
  [MARKET_PULSE_GAMIFICATION_RULES.md](MARKET_PULSE_GAMIFICATION_RULES.md)
- Privacy of point totals →
  [PROFILE_ACTIVITY_HISTORY.md](PROFILE_ACTIVITY_HISTORY.md)
- Trust hard rules →
  [GAMIFICATION_RISK_AND_TRUST_RULES.md](GAMIFICATION_RISK_AND_TRUST_RULES.md)
- Moderation contract →
  [../sprint-7j/COMMUNITY_MODERATION_SCOPE.md](../sprint-7j/COMMUNITY_MODERATION_SCOPE.md)
- Lead state machine → [lib/leads/types.ts](../../lib/leads/types.ts)
- Decision Center types → [lib/decisions/types.ts](../../lib/decisions/types.ts)

## Not in Sprint 7

Sprint 7K is documentation-only.

- The minimal P0 points ledger (six P0 actions, daily caps, owner-private
  profile counter) **ships in Sprint 8** per
  [SPRINT_9_GAMIFICATION_REQUIREMENTS.md](SPRINT_9_GAMIFICATION_REQUIREMENTS.md)
  P0-lite section — not in Sprint 7.
- `lib/gamification/points.ts` and the `point_grants` table population for
  the six P0 actions — Sprint 8.
- P1 expansion (helpful-vote points, Decision-step points, Moderator
  reversal UI, admin Form retuning) — Sprint 9.
- Decay / expiry of stale points — P2 only if ever introduced; no decay
  planned today.
- Any redemption surface — out of scope **forever** by product policy.
