# GAMIFICATION_ENGAGEMENT_LAYER

## Goal

Define how Zolaq increases user retention, learning, comparison behaviour, community
participation and market-pulse engagement **without** turning the product into a
gambling, betting, crypto or cash-rewards platform — and **without** compromising the
three trust pillars: Zolaq Recommendation, Official Dealer Verification, Official
Price Trust.

This is the top-of-addendum overview for Sprint 7K. Detailed specifications live in
the sibling docs: [USER_BADGE_SYSTEM.md](USER_BADGE_SYSTEM.md),
[MARKET_PULSE_GAMIFICATION_RULES.md](MARKET_PULSE_GAMIFICATION_RULES.md),
[COMMUNITY_POINTS_RULES.md](COMMUNITY_POINTS_RULES.md),
[PROFILE_ACTIVITY_HISTORY.md](PROFILE_ACTIVITY_HISTORY.md),
[GAMIFICATION_RISK_AND_TRUST_RULES.md](GAMIFICATION_RISK_AND_TRUST_RULES.md).
Engineering punch list lives in
[SPRINT_9_GAMIFICATION_REQUIREMENTS.md](SPRINT_9_GAMIFICATION_REQUIREMENTS.md).

## What gamification IS in Zolaq

- **Badges** (`nişanlar`) — soft achievement markers awarded for meaningful
  behaviour (first comparison, EV research, market-pulse participation, helpful
  Q&A answer, verified lead). Visible on the user's own profile.
- **Points** (`xal`) — a private, non-redeemable counter accumulated through
  approved actions. Capped daily. Used only to unlock badge thresholds and to
  show the user a personal sense of progress.
- **Activity timeline** — a unified, user-private history view that consolidates
  viewed cars, saved cars, comparisons, leads, Bazar Nəbzi votes, Q&A activity
  and read encyclopedia/news items.
- **Soft achievements** — milestones like "İlk müqayisə", "Ağıllı seçimçi",
  surfaced as profile chrome, never as gates on product flow.
- **Opt-in participation prompts** — e.g. "Bu həftəki Bazar Nəbzini gör"
  invitations on profile, never blocking core actions.

## What gamification is NOT

- **Not gambling.** No wager, no stake, no odds, no payout.
- **Not betting.** No money in, no money out.
- **Not crypto.** No tokens, no wallets, no on-chain rewards.
- **Not cash rewards.** No vouchers, no discounts-for-points, no gift cards.
- **Not a manipulation lever on Zolaq Recommendation.** The recommendation
  algorithm reads zero gamification state.
- **Not a path to Official Dealer Verification.**
  [DealerVerificationStatus](../../lib/dealers/types.ts) transitions are
  capability-based and immune to user badges, points or community votes.
- **Not a way to influence Official Price.** No badge changes the `verified` flag
  on a [PriceRecord](../../lib/cars/types.ts).

Banned vocabulary (UI + docs): `bet`, `wager`, `odds`, `stake`, `payout`, `win`,
`lose`, `crypto`, `cash`, `prize money`. Allowed verbs: `seç`, `təxmin et`,
`iştirak et`, `qazan` (badge sense only), `vote`, `predict`, `pick`, `earn`
(badge/points sense only).

## Where it appears

### Decision Center

- Each completed Decision Center step (P1) grants a small private points reward
  and may award `smart_chooser` once the readiness summary crosses a threshold.
- **Hard rule:** gamification does not alter the existing Step 5 / Step 6 / Step 7
  logic in [lib/decisions/types.ts](../../lib/decisions/types.ts). Badges are
  cosmetic chrome layered after the [ReadinessSummary](../../lib/decisions/types.ts)
  is computed. Removing the gamification layer leaves the Decision Center flow
  byte-identical.

### Compare

- `first_comparison` triggers on the user's first comparison with ≥2 trims.
- `smart_chooser` may also trigger here if the user repeatedly compares and then
  proceeds into the Decision Center.
- No badge gates the Compare action.

### Q&A

- `qa_helper` accumulates as the user contributes approved Q&A answers.
- `helpful_answer` triggers when an individual answer crosses a helpful-count
  threshold, **after** Moderator approval, and **excluding** suspicious helpful
  votes per the abuse rules in
  [GAMIFICATION_RISK_AND_TRUST_RULES.md](GAMIFICATION_RISK_AND_TRUST_RULES.md).

### Bazar Nəbzi

- `market_observer` triggers when the user votes in ≥3 topics across ≥2 cadence
  bands (daily / weekly / monthly per
  [../sprint-7j/MARKET_PULSE_MODULE.md](../sprint-7j/MARKET_PULSE_MODULE.md)).
- A private "Mənim təxminlərim" slice appears on the user's profile (P1) —
  showing the user's own votes, the resolved outcomes, and a private accuracy
  count. **Never** exposed publicly, never exposed to dealers.
- No leaderboards in P0 or P1. P2 reconsideration only, and any leaderboard
  remains strictly non-redeemable.

### Encyclopedia / News reading

- `encyclopedia_reader` and `ev_researcher` track first-time reads with ≥30s
  dwell, deduplicated per `(user_id, content_id)`.
- Reading does not affect Zolaq Recommendation.

### User Profile

- Profile gains three subsections under existing `/profile/**` routes (P1):
  - "Nişanlarım" — earned badges.
  - "Aktivlik tarixçəm" — unified activity timeline per
    [PROFILE_ACTIVITY_HISTORY.md](PROFILE_ACTIVITY_HISTORY.md).
  - "Mənim təxminlərim" — Bazar Nəbzi personal history.
- No new top-level public routes. No public profile page in P0/P1.

## How it supports lead generation without forcing users

- Submitting a verified lead (one that reaches `LeadState ≥ submitted` per
  [lib/leads/types.ts](../../lib/leads/types.ts)) grants points and the
  `official_offer_received` / `test_drive_stage` badges as the lead progresses.
- The badge is visible **only to the user** — never to dealers, never on a
  public surface. Dealers see only the [Lead](../../lib/leads/types.ts) row
  assigned to them, per
  [../sprint-7j/DEALER_PORTAL_SCOPE.md](../sprint-7j/DEALER_PORTAL_SCOPE.md).
- Gamification can prompt ("Növbəti addımı tamamla — test sürüş təyin et") but
  never blocks any lead-form submission or hides any pricing.
- No "submit-N-leads-to-unlock-X" mechanics. Each lead badge is granted on
  factual state transitions, not on quotas.

## P0 / P1 / P2 rollout

P0-lite ships in Sprint 8. The CTO has decided that early retention and
community activity require a minimal, safe, non-monetary engagement layer at
MVP — not deferred to Sprint 9.

- **P0 — MVP / Sprint 8 (P0-lite engagement layer)**:
  - Homepage "Bazar nə deyir?" preview block (already P0 per
    [../sprint-7j/SPRINT_8_IMPLEMENTATION_REQUIREMENTS.md](../sprint-7j/SPRINT_8_IMPLEMENTATION_REQUIREMENTS.md)
    Section F).
  - `/qa` Bazar Nəbzi tab with sub-tabs `Suallar`, `Bazar Nəbzi`, `Günlük`,
    `Həftəlik`, `Aylıq`, `Tarixçə` (no new public route).
  - Daily / weekly / monthly topic cadence and basic vote flow (six
    server-side eligibility checks per
    [../sprint-7j/COMMUNITY_PREDICTION_RULES.md](../sprint-7j/COMMUNITY_PREDICTION_RULES.md)).
  - Closed-topic history snapshots surfaced under `/qa` Tarixçə.
  - Basic profile activity history under existing `/profile/**` (private,
    owner-visible) per
    [PROFILE_ACTIVITY_HISTORY.md](PROFILE_ACTIVITY_HISTORY.md).
  - Basic badge display in profile — five P0 badges per
    [USER_BADGE_SYSTEM.md](USER_BADGE_SYSTEM.md): `first_comparison`,
    `market_observer`, `encyclopedia_reader`, `official_offer_received`,
    `qa_participant`.
  - Minimal points ledger — six P0 actions, daily-capped, owner-private, per
    [COMMUNITY_POINTS_RULES.md](COMMUNITY_POINTS_RULES.md).
  - **No leaderboard. No public profile. No cash. No opt-in public badge
    visibility.**
- **P1 — Sprint 9 (expanded engagement)**: full badge engine and points
  retuning, Moderator badge-revocation / point-reversal tooling,
  `user_bazar_stats` derived view, "Mənim təxminlərim" personal accuracy
  slice, advanced suspicious-voting heuristics surfacing, additional profile
  subsections, P1 badges (`smart_chooser`, `ev_researcher`, `price_watcher`,
  `test_drive_stage`), and the two P1-only point actions (`helpful_answer`
  increment, `complete a Decision Center step`).
- **P2 — Sprint 10+**: leaderboards (non-redeemable, opt-in display), seasonal
  challenges (e.g. "EV ay"), public profile pages, encyclopedia reading
  streaks, advanced Q&A reputation (`helpful_answer`, `qa_helper` badges).

## Cross-references

- Badge catalogue → [USER_BADGE_SYSTEM.md](USER_BADGE_SYSTEM.md)
- Bazar Nəbzi gamification deltas →
  [MARKET_PULSE_GAMIFICATION_RULES.md](MARKET_PULSE_GAMIFICATION_RULES.md)
- Points economy → [COMMUNITY_POINTS_RULES.md](COMMUNITY_POINTS_RULES.md)
- Profile + privacy → [PROFILE_ACTIVITY_HISTORY.md](PROFILE_ACTIVITY_HISTORY.md)
- Risk / trust hard rules →
  [GAMIFICATION_RISK_AND_TRUST_RULES.md](GAMIFICATION_RISK_AND_TRUST_RULES.md)
- Engineering tasks →
  [SPRINT_9_GAMIFICATION_REQUIREMENTS.md](SPRINT_9_GAMIFICATION_REQUIREMENTS.md)
- Underlying Bazar Nəbzi rules →
  [../sprint-7j/MARKET_PULSE_MODULE.md](../sprint-7j/MARKET_PULSE_MODULE.md),
  [../sprint-7j/COMMUNITY_PREDICTION_RULES.md](../sprint-7j/COMMUNITY_PREDICTION_RULES.md),
  [../sprint-7j/PREDICTION_HISTORY_MODEL.md](../sprint-7j/PREDICTION_HISTORY_MODEL.md),
  [../sprint-7j/SPONSORED_MARKET_QUESTION_RULES.md](../sprint-7j/SPONSORED_MARKET_QUESTION_RULES.md)
- Moderation and roles →
  [../sprint-7j/COMMUNITY_MODERATION_SCOPE.md](../sprint-7j/COMMUNITY_MODERATION_SCOPE.md),
  [../sprint-7j/ROLE_PERMISSION_MATRIX.md](../sprint-7j/ROLE_PERMISSION_MATRIX.md)

## Not in Sprint 7

Sprint 7K is documentation-only — no code, no routes, no UI in this sprint.
The deliverables enumerated under "P0 — MVP / Sprint 8 (P0-lite engagement
layer)" above are **implemented in Sprint 8**, not Sprint 7. Specifically
deferred beyond Sprint 7:

- All UI components and tracking-event additions (Sprint 8 — per
  [../sprint-7j/SPRINT_8_IMPLEMENTATION_REQUIREMENTS.md](../sprint-7j/SPRINT_8_IMPLEMENTATION_REQUIREMENTS.md)
  Sections F and L, augmented by
  [SPRINT_9_GAMIFICATION_REQUIREMENTS.md](SPRINT_9_GAMIFICATION_REQUIREMENTS.md)
  P0-lite section).
- All P1-tier badges, the helpful-vote and Decision-step point actions, the
  `user_bazar_stats` derived view, and the "Mənim təxminlərim" slice — Sprint
  9.
- Leaderboards, seasonal challenges, public profile, reading streaks, advanced
  Q&A reputation — Sprint 10+.
- Any change to Decision Center Step 5 / 6 / 7 logic, the Compare flow, Q&A
  authoring, the lead flow, or content flow — out of scope at any tier.
