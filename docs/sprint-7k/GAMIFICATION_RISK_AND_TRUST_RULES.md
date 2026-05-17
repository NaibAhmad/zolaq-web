# GAMIFICATION_RISK_AND_TRUST_RULES

## Goal

State the **non-negotiable trust and risk rules** that bound the entire
gamification / engagement layer. Each rule is one line, no ambiguity.

Any future feature that conflicts with a rule below is **out of scope by
product policy** and requires explicit approval (and a doc revision) before it
can be implemented.

## Hard rules

### Gambling boundary

- **No betting.** No wager, no stake, no payout. The product is not a betting
  platform.
- **No financial reward.** Points, badges, leaderboard positions, prediction
  results and any other engagement signal are non-redeemable for cash,
  vouchers, discounts, gift cards or in-product currency.
- **No crypto.** No tokens, no wallets, no on-chain rewards.
- **No paid manipulation.** A sponsor cannot purchase a badge, a leaderboard
  position, a higher point weight, or any other gamification advantage.
- **Banned terminology** in UI and copy: `bet`, `wager`, `odds`, `stake`,
  `payout`, `win`, `lose`, `crypto`, `cash`, `prize money`. Allowed verbs:
  `seç`, `təxmin et`, `iştirak et`, `qazan` (badge sense only), `vote`,
  `predict`, `pick`, `earn` (badge / points sense only).

### Sponsor / advertising integrity

- **Sponsored items always carry a label.** Every sponsored placement (Q&A
  topic, Bazar Nəbzi topic, ad surface) renders the `Sponsorlu` / `Reklam` /
  `Premium` chip per
  [../sprint-7j/AD_PLACEMENT_MAP.md](../sprint-7j/AD_PLACEMENT_MAP.md).
- **Zolaq Recommendation cannot be sponsored.** The recommendation algorithm
  reads zero gamification state, zero ad-spend state, and zero sponsor
  identity.
- **Prediction results cannot be modified by the sponsor.** A Bazar Nəbzi
  topic's `final_outcome` is decided by the Content Manager from factual data
  per
  [../sprint-7j/COMMUNITY_PREDICTION_RULES.md](../sprint-7j/COMMUNITY_PREDICTION_RULES.md),
  not by the sponsor of the topic and not by the popular vote.
- **Gamification is sponsor-neutral.** A vote on a sponsored topic grants the
  same points and counts toward the same badge thresholds as a vote on an
  organic topic.

### Trust-pillar isolation

- **Dealer Verification cannot be gamified.** Transitions of
  [DealerVerificationStatus](../../lib/dealers/types.ts)
  (`pending → official_dealer | verified_partner | premium_partner | rejected
  | expired`) are capability-based and immune to user badges, points or
  community votes.
- **Official Price cannot be gamified.** No badge, point total or vote changes
  the `verified` flag on a [PriceRecord](../../lib/cars/types.ts) or any
  displayed price.
- **Zolaq Recommendation cannot be gamified.** Restated for emphasis — the
  recommendation algorithm is the third trust pillar and reads zero
  gamification state.

### User-data privacy

- **Lead data remains private.** A dealer sees only the
  [Lead](../../lib/leads/types.ts) row assigned to that dealer; never the
  customer's profile, badges, points, viewed cars, saved cars, comparison
  history, Bazar Nəbzi votes or activity timeline.
- **Phone numbers** are hashed to `phone_hash` for all non-Ops roles per
  [../sprint-7j/SPRINT_8_IMPLEMENTATION_REQUIREMENTS.md](../sprint-7j/SPRINT_8_IMPLEMENTATION_REQUIREMENTS.md)
  Section I.
- **Tracking events** never carry raw PII per
  [BANNED_PII_KEYS](../../lib/tracking/events.ts); badge / point grants follow
  the same rule.
- **Private profile data** (viewed cars, saved cars, comparisons, votes,
  points, badges, reads, timeline) is reachable only by the owning user and by
  Admin / Moderator for audit purposes.

### Moderation requirements

- **All user-generated Q&A content is moderated** before public visibility per
  [../sprint-7j/COMMUNITY_MODERATION_SCOPE.md](../sprint-7j/COMMUNITY_MODERATION_SCOPE.md).
  Point grants for Q&A authorship are deferred until approval; rejection
  reverses the grant.
- **All Bazar Nəbzi topic copy is moderated** before activation per
  [../sprint-7j/COMMUNITY_PREDICTION_RULES.md](../sprint-7j/COMMUNITY_PREDICTION_RULES.md)
  and
  [../sprint-7j/SPONSORED_MARKET_QUESTION_RULES.md](../sprint-7j/SPONSORED_MARKET_QUESTION_RULES.md).
- **Moderator vote-invalidation cascades to gamification** — invalidated votes
  do not count toward badges, point thresholds or accuracy aggregates.
- **Moderator can revoke badges** and **reverse point grants**; both actions
  write one audit-log row.

### Abuse detection requirements (Sprint 9 P1, surfaces to Moderator queue)

These heuristics flag for human review only; they do not auto-revoke.

- **Multi-account same-device clusters voting identically** on Bazar Nəbzi
  topics, especially sponsored ones.
- **Self-helpful-marking rings** on Q&A — clusters of accounts that mark each
  other's answers helpful.
- **Dealer-affiliated accounts farming `helpful_answer`** for a specific
  brand's Q&A answers.
- **Lead-spam farming** for `official_offer_received` — mitigated structurally
  by requiring `LeadState ≥ submitted` (a canonical transition) and by
  de-duping new `Lead` rows on `phone_hash` within a configurable window.
- **Vote-rate anomalies** concentrated on sponsored topics — sudden spikes
  uniformly favouring the sponsor brand.
- **Sudden account creation immediately preceding a single high-value action**
  (vote on a sponsored topic, helpful vote on a dealer-affiliated answer) — the
  account is flagged for review and gamification accrual is paused.

Flagged accounts have gamification accrual **paused pending review**. Badges
already granted are not auto-revoked; the Moderator decides per
[../sprint-7j/COMMUNITY_MODERATION_SCOPE.md](../sprint-7j/COMMUNITY_MODERATION_SCOPE.md).

## P0-lite allowed scope (Sprint 8)

The CTO has authorised a lightweight, safe, non-monetary engagement layer at
MVP. The full hard-rules list above continues to apply. **In addition**, the
following — and only the following — are the gamification actions permitted in
Sprint 8 P0-lite:

- **Voting (Bazar Nəbzi)** — vote in daily / weekly / monthly topics per
  [MARKET_PULSE_GAMIFICATION_RULES.md](MARKET_PULSE_GAMIFICATION_RULES.md).
- **Learning** — encyclopedia and news reads (≥30s dwell, first time) tracked
  for the P0 `encyclopedia_reader` badge and 1-point grant.
- **Decision progress signals** — cosmetic chrome layered on top of the
  existing Decision Center readiness output, **without** any change to Step 5
  / Step 6 / Step 7 logic in [lib/decisions/types.ts](../../lib/decisions/types.ts).
- **Q&A participation** — ask / answer (Moderator-approved) granting the P0
  `qa_participant` badge and points; viewing own Q&A activity from the
  profile.
- **Private activity history** — viewed cars, saved cars, comparisons, lead
  submissions and state events, Bazar Nəbzi votes, Q&A authorship, read
  encyclopedia/news, earned badges, points balance — all owner-visible only,
  per [PROFILE_ACTIVITY_HISTORY.md](PROFILE_ACTIVITY_HISTORY.md).
- **Non-cash badges** — five P0 badges (`first_comparison`, `market_observer`,
  `encyclopedia_reader`, `official_offer_received`, `qa_participant`),
  non-redeemable, owner-visible only.

Everything outside this list — leaderboards, public per-user accuracy, public
profile pages, opt-in public badge visibility, the helpful-vote mechanic, the
Decision-step points action, the P1 / P2 badges — remains deferred to Sprint 9
(P1) or Sprint 10+ (P2) per
[SPRINT_9_GAMIFICATION_REQUIREMENTS.md](SPRINT_9_GAMIFICATION_REQUIREMENTS.md).

## Conflict resolution

If any future spec, badge, point rule or product surface conflicts with a hard
rule above, the hard rule wins. Update this doc explicitly before relaxing any
boundary.

## Cross-references

- Engagement overview →
  [GAMIFICATION_ENGAGEMENT_LAYER.md](GAMIFICATION_ENGAGEMENT_LAYER.md)
- Badges → [USER_BADGE_SYSTEM.md](USER_BADGE_SYSTEM.md)
- Points → [COMMUNITY_POINTS_RULES.md](COMMUNITY_POINTS_RULES.md)
- Bazar Nəbzi deltas →
  [MARKET_PULSE_GAMIFICATION_RULES.md](MARKET_PULSE_GAMIFICATION_RULES.md)
- Privacy →
  [PROFILE_ACTIVITY_HISTORY.md](PROFILE_ACTIVITY_HISTORY.md)
- Sprint 9 engineering tracker →
  [SPRINT_9_GAMIFICATION_REQUIREMENTS.md](SPRINT_9_GAMIFICATION_REQUIREMENTS.md)
- Underlying Sprint 7J trust contracts →
  [../sprint-7j/MARKET_PULSE_MODULE.md](../sprint-7j/MARKET_PULSE_MODULE.md),
  [../sprint-7j/COMMUNITY_PREDICTION_RULES.md](../sprint-7j/COMMUNITY_PREDICTION_RULES.md),
  [../sprint-7j/SPONSORED_MARKET_QUESTION_RULES.md](../sprint-7j/SPONSORED_MARKET_QUESTION_RULES.md),
  [../sprint-7j/COMMUNITY_MODERATION_SCOPE.md](../sprint-7j/COMMUNITY_MODERATION_SCOPE.md),
  [../sprint-7j/AD_PLACEMENT_MAP.md](../sprint-7j/AD_PLACEMENT_MAP.md),
  [../sprint-7j/DEALER_PORTAL_SCOPE.md](../sprint-7j/DEALER_PORTAL_SCOPE.md)

## Not in Sprint 7

Sprint 7K is documentation-only.

- Implementation of the P0-lite allowed scope above — **ships in Sprint 8**
  per [SPRINT_9_GAMIFICATION_REQUIREMENTS.md](SPRINT_9_GAMIFICATION_REQUIREMENTS.md)
  P0-lite section, not in Sprint 7.
- Moderation guard for P0 grants (spam-rejected Q&A reverses the
  corresponding badge grant and point grant via compensating audit-log rows)
  — Sprint 8.
- Full suspicious-voting heuristic surfacing in the Moderator queue —
  Sprint 9 (P1).
- Moderator UI for badge revocation / points reversal — Sprint 9 (P1).
- Any feature that exchanges a gamification signal for real value — out of
  scope **forever** by product policy.
