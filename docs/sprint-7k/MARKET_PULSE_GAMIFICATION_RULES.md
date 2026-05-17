# MARKET_PULSE_GAMIFICATION_RULES

## Goal

Define how the gamification / engagement layer integrates with **Zolaq Bazar
Nəbzi** without changing the underlying voting, sponsorship or moderation
contract established in Sprint 7J.

This doc is **additive only**. It does not redefine voting, topic lifecycle,
schema or sponsor rules. Authoritative sources:

- Concept → [../sprint-7j/MARKET_PULSE_MODULE.md](../sprint-7j/MARKET_PULSE_MODULE.md)
- Voting rules and statuses →
  [../sprint-7j/COMMUNITY_PREDICTION_RULES.md](../sprint-7j/COMMUNITY_PREDICTION_RULES.md)
- Schema → [../sprint-7j/PREDICTION_HISTORY_MODEL.md](../sprint-7j/PREDICTION_HISTORY_MODEL.md)
- Sponsorship → [../sprint-7j/SPONSORED_MARKET_QUESTION_RULES.md](../sprint-7j/SPONSORED_MARKET_QUESTION_RULES.md)
- Moderation → [../sprint-7j/COMMUNITY_MODERATION_SCOPE.md](../sprint-7j/COMMUNITY_MODERATION_SCOPE.md)

## What this is NOT (reaffirmed)

- **Not betting.** No wager, no stake, no payout.
- **No money.** No money in, no money out.
- **No crypto.** No tokens, no wallets.
- **No cash reward.** Closed topics produce a community history snapshot and
  optionally a participation badge — never a payout.
- Banned vocabulary, identical to 7J: `bet`, `wager`, `odds`, `stake`, `payout`,
  `win`, `lose`. Allowed verbs: `seç`, `təxmin et`, `iştirak et`, `vote`,
  `predict`, `pick`.

## MVP / Sprint 8 P0 behaviour

The Bazar Nəbzi voting experience ships in Sprint 8 as part of the P0-lite
engagement layer. This is the canonical Sprint-7K statement of the P0 scope —
the underlying schema, vote API and admin tooling are owned by
[../sprint-7j/SPRINT_8_IMPLEMENTATION_REQUIREMENTS.md](../sprint-7j/SPRINT_8_IMPLEMENTATION_REQUIREMENTS.md)
Section F.

- **Voting access** — OTP-verified Customers can vote, one vote per
  `(topic_id, user_id)`. Guests can read live topics and see aggregate
  percentages, participant count and closing date; the vote action opens the
  existing OTP flow ([lib/auth/session.ts](../../lib/auth/session.ts)).
- **Cadence** — three bands per
  [../sprint-7j/MARKET_PULSE_MODULE.md](../sprint-7j/MARKET_PULSE_MODULE.md):
  daily / weekly / monthly. At most one active topic per band.
- **Results display** — percentage per option, participant count, closing
  date, sponsor label (if any). Individual votes remain private.
- **Closed-topic history** — every resolved topic produces a public snapshot
  saved under the `/qa` Tarixçə tab.
- **No new public route** — Bazar Nəbzi lives entirely inside the existing
  `/qa` route. Tab structure:
  - `Suallar` — existing Q&A content.
  - `Bazar Nəbzi` — landing on currently active topics across all cadences.
  - `Günlük` — daily archive.
  - `Həftəlik` — weekly archive.
  - `Aylıq` — monthly archive.
  - `Tarixçə` — full closed-and-resolved history with `zolaq_market_summary`.
- **Gamification grants in P0** — a valid vote (i.e. not Moderator-invalidated)
  grants 2 points per
  [COMMUNITY_POINTS_RULES.md](COMMUNITY_POINTS_RULES.md) (daily cap 6) and
  counts toward the P0 `market_observer` badge per
  [USER_BADGE_SYSTEM.md](USER_BADGE_SYSTEM.md). Both signals are
  owner-private.
- **No leaderboard, no public per-user accuracy, no public profile** at P0.
  The "Mənim təxminlərim" personal slice and `user_bazar_stats` derived view
  remain P1 (see below).

## Cadence (unchanged)

Three bands per [MARKET_PULSE_MODULE.md](../sprint-7j/MARKET_PULSE_MODULE.md):

- **Günlük / Daily** — opens start-of-day, closes end-of-day.
- **Həftəlik / Weekly** — opens Monday, closes Sunday.
- **Aylıq / Monthly** — opens 1st of month, closes last of month.

At most one active topic per cadence band at a time in MVP (Content Manager
controls inventory).

## Topic statuses (unchanged, reused as-is)

Reproduced for cross-doc convenience; canonical definition lives in
[../sprint-7j/COMMUNITY_PREDICTION_RULES.md](../sprint-7j/COMMUNITY_PREDICTION_RULES.md):

- `draft` — being authored; not visible.
- `sponsored_pending_approval` — awaits approvals + paid status.
- `active` — public, accepting votes.
- `closed` — public, votes frozen, awaiting outcome.
- `resolved` — `final_outcome` and `zolaq_market_summary` written.
- `archived` — retention period passed; read-only.
- `rejected` — terminal; never went live.

Sprint 7K introduces **no new statuses**. Gamification consumes these states as
read-only signals.

## Voting rules (delta over 7J)

The six eligibility checks server-side (topic exists; topic active; before
end_date; OTP-verified; uniqueness; option_id valid) are **unchanged**.

Gamification adds only **non-authoritative derived aggregates** computed off the
canonical `bazar_votes` and `bazar_topic_snapshots` tables:

- `user_participation_count` — distinct `topic_id` count where the user has a
  non-invalidated vote.
- `user_cadence_breadth` — distinct cadence-band count (1–3).
- `user_correct_count` — votes whose `option_id == topic.final_outcome` and
  `topic.status = resolved`.
- `user_streak_days` — consecutive days the user voted on a daily topic
  (informational only; never used as gating).

All four are **private to the user**. Nothing about an individual user's vote
or accuracy is shown publicly on the topic page. Public topic surfaces continue
to show only aggregate percentages, participant count and closing date.

## History rules

- The closed → resolved → archived flow is unchanged.
- A user's personal Bazar Nəbzi history slice is exposed only via the
  authenticated profile under `/profile/**` (P1 — "Mənim təxminlərim" subsection
  per [PROFILE_ACTIVITY_HISTORY.md](PROFILE_ACTIVITY_HISTORY.md)).
- The user's personal slice is **never** shown to dealers, never to other
  customers, never to guests, and never appears in the public `/qa` Bazar Nəbzi
  history view (which continues to show only aggregate snapshots).

## Sponsor labeling and sponsor neutrality

- Sponsored topics continue to carry the `Sponsorlu` / `Reklam` chip per
  [../sprint-7j/AD_PLACEMENT_MAP.md](../sprint-7j/AD_PLACEMENT_MAP.md) and
  [../sprint-7j/SPONSORED_MARKET_QUESTION_RULES.md](../sprint-7j/SPONSORED_MARKET_QUESTION_RULES.md).
- **Gamification is sponsor-neutral.** A vote on a sponsored topic grants the
  same points and counts toward the same badge thresholds as a vote on an
  organic topic — neither more nor less. There is no "sponsored multiplier".
- Sponsors **cannot** purchase a badge, a leaderboard position, or any
  gamification surface. The `Sponsorlu` / `Reklam` / `Premium` label is the
  only sponsor-visible affordance.

## Moderation rules

- Moderator vote-invalidation cascades to gamification: an invalidated vote does
  **not** count toward `user_participation_count`, `user_correct_count`,
  `user_cadence_breadth`, `user_streak_days`, the `market_observer` badge, or
  points. Recomputation runs after every invalidation.
- A user flagged via suspicious-voting heuristics (per
  [../sprint-7j/COMMUNITY_PREDICTION_RULES.md](../sprint-7j/COMMUNITY_PREDICTION_RULES.md)
  "Suspicious-voting heuristics") has gamification accrual **paused** until
  Moderator review. Badges already granted are not auto-revoked; the Moderator
  decides.
- Moderator-revoked badges write one row to the global audit log per
  [../sprint-7j/SPRINT_8_IMPLEMENTATION_REQUIREMENTS.md](../sprint-7j/SPRINT_8_IMPLEMENTATION_REQUIREMENTS.md)
  Section J.

## Result storage

- Authoritative tables (`bazar_topics`, `bazar_options`, `bazar_votes`,
  `bazar_topic_snapshots`) are **unchanged**.
- Gamification adds a derived read-model only:
  - `user_bazar_stats` materialized view (Sprint 9 P1), keyed on `user_id`,
    containing `participation_count`, `correct_count`, `cadence_breadth`,
    `streak_days`, `last_voted_at`. Rebuilt on every vote-write and every
    Moderator invalidation.
- No new authoritative table. Removing the read-model leaves the Bazar Nəbzi
  data layer byte-identical.

## Placement in Q&A / community history

- The public `/qa` Bazar Nəbzi tab (Sprint 8 — see
  [../sprint-7j/MARKET_PULSE_MODULE.md](../sprint-7j/MARKET_PULSE_MODULE.md)) is
  **unchanged** by Sprint 7K.
- The user's personal slice ("Mənim təxminlərim") appears only on the
  authenticated profile, never on `/qa`.

## Why this is safe

- No real-money exchange.
- No public per-user accuracy or ranking — eliminates the social pressure that
  would push a community-prediction product toward a betting product.
- Sponsor neutrality prevents brand-driven manipulation of badge or point
  outcomes.
- Moderator invalidation cascades to gamification, so flagged abuse cannot
  silently feed badges.

## Cross-references

- Engagement overview →
  [GAMIFICATION_ENGAGEMENT_LAYER.md](GAMIFICATION_ENGAGEMENT_LAYER.md)
- Badge mechanics → [USER_BADGE_SYSTEM.md](USER_BADGE_SYSTEM.md)
  (`market_observer` rule)
- Points mechanics → [COMMUNITY_POINTS_RULES.md](COMMUNITY_POINTS_RULES.md)
  (Bazar Nəbzi vote points + daily cap)
- Privacy → [PROFILE_ACTIVITY_HISTORY.md](PROFILE_ACTIVITY_HISTORY.md)
- Risk / trust → [GAMIFICATION_RISK_AND_TRUST_RULES.md](GAMIFICATION_RISK_AND_TRUST_RULES.md)
- Bazar Nəbzi core →
  [../sprint-7j/MARKET_PULSE_MODULE.md](../sprint-7j/MARKET_PULSE_MODULE.md),
  [../sprint-7j/COMMUNITY_PREDICTION_RULES.md](../sprint-7j/COMMUNITY_PREDICTION_RULES.md),
  [../sprint-7j/PREDICTION_HISTORY_MODEL.md](../sprint-7j/PREDICTION_HISTORY_MODEL.md),
  [../sprint-7j/SPONSORED_MARKET_QUESTION_RULES.md](../sprint-7j/SPONSORED_MARKET_QUESTION_RULES.md)

## Not in Sprint 7

Sprint 7K is documentation-only.

- The Bazar Nəbzi vote API, the `/qa` Bazar Nəbzi tab, the homepage "Bazar nə
  deyir?" preview block, and the daily/weekly/monthly schema all **ship in
  Sprint 8** per
  [../sprint-7j/SPRINT_8_IMPLEMENTATION_REQUIREMENTS.md](../sprint-7j/SPRINT_8_IMPLEMENTATION_REQUIREMENTS.md)
  Section F — not in Sprint 7.
- The P0 gamification grants on a vote (badge + 2 points) ship in Sprint 8 per
  [SPRINT_9_GAMIFICATION_REQUIREMENTS.md](SPRINT_9_GAMIFICATION_REQUIREMENTS.md)
  P0-lite section — not in Sprint 7.
- The `user_bazar_stats` materialised view — Sprint 9 (P1).
- The "Mənim təxminlərim" profile subsection — Sprint 9 (P1).
- Public leaderboards — P2 (Sprint 10+), and they remain non-redeemable.
- Public per-user accuracy display — out of scope **forever** by product
  policy.
