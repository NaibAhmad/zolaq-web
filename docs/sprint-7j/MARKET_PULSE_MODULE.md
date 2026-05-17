# MARKET_PULSE_MODULE — "Zolaq Bazar Nəbzi"

## Goal

Introduce a community engagement module that brings users back to Zolaq regularly, gives the platform a public history archive of market sentiment, and provides a new sponsorable surface for advertisers — **without** turning Zolaq into a gambling, betting, or prediction-market product.

This is the concept doc. Voting rules live in `COMMUNITY_PREDICTION_RULES.md`. Schema lives in `PREDICTION_HISTORY_MODEL.md`. Sponsorship rules live in `SPONSORED_MARKET_QUESTION_RULES.md`. Placement rules live in `AD_PLACEMENT_MAP.md`.

## What this is NOT

- **Not gambling.** No wager. No stake. No odds.
- **Not real-money betting.** No money in. No money out. No payouts.
- **Not a Polymarket clone.** No order book. No price. No tradable position.
- **Not crypto.** No tokens. No wallets.
- **Not financial trading.** No leverage. No derivatives.
- **No cash rewards.** Closed topics produce a community history snapshot, not a payout.
- **No betting terminology.** Strings like "bet", "wager", "odds", "stake", "payout", "win", "lose" are banned from UI and copy. Allowed verbs: `seç`, `təxmin et`, `iştirak et`, `vote`, `predict`, `pick`.

## What this IS

A lightweight community sentiment module called **Zolaq Bazar Nəbzi** ("market pulse"). Users vote on automotive market questions. Results are public aggregates: percentages, participant count, closing date. After closing, Content Manager writes a short "Zolaq market summary" explaining what actually happened. The closed topic is archived in public history.

## Example questions

- Bu həftə ən çox maraq görəcək model hansıdır? (Weekly)
- EV marağı bu ay artacaq, azalacaq, yoxsa sabit qalacaq? (Monthly)
- Deepal S07 yoxsa BYD Song Plus daha çox sorğu alacaq? (Weekly)
- Hansı model bu həftə daha çox müqayisə ediləcək? (Weekly)
- Qiymətlər növbəti ay artacaq, azalacaq, yoxsa sabit qalacaq? (Monthly)
- Bu gün ən çox sorğu hansı brendə gedəcək? (Daily)

Each topic has 3–4 multiple-choice options, never an open text input.

## Cadence

Three bands, each with separate inventory and pacing:

- **Günlük / Daily** — opens at start-of-day, closes end-of-day. Lightweight. Driver for return visits.
- **Həftəlik / Weekly** — opens Monday, closes Sunday. Mid-weight. Anchors the "Bazar nə deyir?" homepage block by default.
- **Aylıq / Monthly** — opens first of month, closes last of month. Heavier-weight. Used for trend topics (EV interest, price direction).

Content Manager schedules topics in advance; at most one active topic per cadence band at a time in MVP. Inventory ceiling is intentional — overlapping daily topics dilute participation.

## MVP behaviour summary

- Users vote/predict without money.
- Results show percentage, participant count, and closing date.
- Voting requires an OTP-verified Customer account (see [lib/auth/session.ts](../../lib/auth/session.ts)). Guests see live aggregates but the vote action prompts them to verify.
- One vote per OTP-verified user per topic.
- Closed predictions are saved into **public history**.
- History lives under Q&A / community history — **no new public route in Sprint 7**. The `/qa` route gains a Bazar Nəbzi tab/category in Sprint 8.
- User profile can show prediction history and badges later (P1) — not in P0.
- Sponsored topics allowed **only with clear `Sponsorlu` / `Reklam` label** (see `SPONSORED_MARKET_QUESTION_RULES.md`).
- Sponsored topics never manipulate the Zolaq Recommendation.

## Where it shows up

### Homepage preview block — "Bazar nə deyir?" / "Zolaq Bazar Nəbzi"

Placement is documented; UI is built in Sprint 8. Slot is in [app/(public)/page.tsx](../../app/(public)/page.tsx) after `HomeContentTeaser` and before `HomeDealerTeaser`.

Block contents:
- Section heading: "Bazar nə deyir?" with subheading "Zolaq Bazar Nəbzi".
- One active question (highest-priority band per Content Manager).
- 3–4 multiple-choice options.
- Current percentages per option (only after the user votes, or for guests — show percentages immediately to drive interest; this is the lower-stakes path since there is no money).
- Participant count: "1,234 istifadəçi iştirak edib".
- Closing date: "Bağlanır: 19 May 2026".
- Primary CTA: "Sən də seç" (links into the vote action — opens OTP flow if guest).
- Secondary CTA: "Tarixçəyə bax" — links to `/qa` Bazar Nəbzi tab (Sprint 8).
- If the active topic is sponsored: `Sponsorlu` chip + sponsor name in the card header.

### `/qa` Bazar Nəbzi tab/category (Sprint 8)

Tabs / categories under existing `/qa`:
- "Bazar Nəbzi" — landing on currently active topics across all cadences.
- "Günlük" — daily archive.
- "Həftəlik" — weekly archive.
- "Aylıq" — monthly archive.
- "Tarixçə" — full closed-and-resolved history with Zolaq market summaries.

Existing Q&A content remains in its current tabs/categories; Bazar Nəbzi is additive, not a replacement.

### Profile (P1, Sprint 9+)
- Customer's prediction history (own votes, accuracy when outcomes are decided).
- Participation badge (e.g. "Bazar nəbzi 100 istifadəçi" — for fun, not redeemable).

## Topic lifecycle

```
draft
  ↓ (Content Manager sets options, dates, type)
active
  ↓ (end_date passes OR Moderator force-closes)
closed
  ↓ (Content Manager writes final_outcome + zolaq_market_summary)
resolved
  ↓ (retention period passes; archive snapshot frozen)
archived
```

Sponsored topics insert one extra state at the beginning: `sponsored_pending_approval` — held until Sales Manager confirms `payment_status = paid` and Content Manager + Moderator approve copy. Then `→ active`.

`rejected` is a terminal state from `draft` or `sponsored_pending_approval`.

Detailed status enum and transitions are in `COMMUNITY_PREDICTION_RULES.md`. Schema is in `PREDICTION_HISTORY_MODEL.md`.

## Why this works as engagement

- Daily / weekly / monthly cadence gives users a reason to return at multiple frequencies.
- Closed-topic history accumulates into a content library that is itself SEO-valuable.
- "Zolaq market summary" on resolved topics positions Zolaq as a market intelligence brand, not just a catalog.
- The module surfaces interest in specific models, which feeds back into Decision Center activity (driving leads).
- It gives the sales team a new sponsorable surface (`Bazar Nəbzi Sponsored Question` — `ADS_REVENUE_MODEL.md` package #10).

## Tracking events (Sprint 8 additions to [lib/tracking/events.ts](../../lib/tracking/events.ts))

Not added in Sprint 7. To be added when the module ships:

- `bazar_topic_viewed` — topic shown on homepage block or `/qa` tab.
- `bazar_vote_started` — vote action clicked (may be a guest who is about to verify).
- `bazar_vote_submitted` — vote successfully recorded.
- `bazar_topic_history_opened` — closed-topic snapshot opened.

PII rule continues to apply — no raw phone, email, or name in payloads (see [BANNED_PII_KEYS](../../lib/tracking/events.ts)).

## Cross-references

- Voting rules and status enum → `COMMUNITY_PREDICTION_RULES.md`
- Schema (topic, option, vote, history snapshot) → `PREDICTION_HISTORY_MODEL.md`
- Sponsored-topic integrity → `SPONSORED_MARKET_QUESTION_RULES.md`
- Placement rules and labeling → `AD_PLACEMENT_MAP.md`
- Moderator's role and reporting → `COMMUNITY_MODERATION_SCOPE.md`

## Not in Sprint 7

- The "Bazar nə deyir?" homepage block component.
- The `/qa` Bazar Nəbzi tab.
- The vote action.
- Any topic data (no seed, no DB, no API).
- Any tracking event addition.

All of the above is **P0 in Sprint 8** (see `SPRINT_8_IMPLEMENTATION_REQUIREMENTS.md`).
