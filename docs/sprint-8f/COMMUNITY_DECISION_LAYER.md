# COMMUNITY_DECISION_LAYER

## Goal

This note locks the direction of Zolaq's community surface so future sprints
do not drift into a Facebook clone. The positioning is a single sentence:

> **Facebook = scattered discussion. Zolaq = structured automotive decision
> data.**

Every community feature shipped at Zolaq must reduce friction in a real
buying / ownership decision — never act as a generic discussion forum.

This is a forward-looking note, not a re-spec. The Sprint 8F engagement layer
(Bazar Nəbzi, Q&A tabs, private points, private activity history,
owner-only badge display) is already shipped per
[../sprint-8g/READINESS.md](../sprint-8g/READINESS.md). Sections below define
what each future phase owns.

## Sprint 8F — Ships now

Owner-only, structured, no public profile. Already in production state on
master pre-commit:

- **Bazar Nəbzi** — daily / weekly / monthly polls (`səs ver`, `proqnoz ver`)
  with closed-topic history in the `Tarixçə` tab. One vote per user per topic.
- **Q&A tabs** — `Suallar`, `Bazar Nəbzi`, `Günlük`, `Həftəlik`, `Aylıq`,
  `Tarixçə`.
- **Private points (`xal`)** — daily-capped ledger, owner-visible only, never
  exposed to dealers or any public surface.
- **Private activity history** — `Aktivlik tarixçəm` aggregates views, saved
  cars, comparisons, leads, lead-status events, votes, badges, points,
  encyclopedia and news reads. Reader-side aggregation, no new event table.
- **Owner-only badge / activity display** — `Nişanlarım` shows the 5 P0
  badges in earned / locked split. Dealers never see customer badges,
  points, votes, comparisons, or views.

Reference:
[../sprint-7k/USER_BADGE_SYSTEM.md](../sprint-7k/USER_BADGE_SYSTEM.md),
[../sprint-7k/COMMUNITY_POINTS_RULES.md](../sprint-7k/COMMUNITY_POINTS_RULES.md),
[../sprint-7j/COMMUNITY_PREDICTION_RULES.md](../sprint-7j/COMMUNITY_PREDICTION_RULES.md),
[../sprint-8g/READINESS.md](../sprint-8g/READINESS.md).

## Sprint 9H — Structured content expansion

No public profile yet. Still owner-private points. The expansion is in
**content shape**, not visibility:

- **Model / nəsil / trim-linked Q&A content population** — every Q&A item
  carries a canonical `(model_id, generation_id?, trim_id?)` foreign key so
  questions live in a structured graph, not a flat feed.
- **Structured owner review templates** — fixed-field templates (e.g.
  reliability, service cost, fuel real-world, parts availability) instead of
  free-form posts.
- **Expert answer templates** — same template shape for moderator / expert
  responses, so a question + expert answer can render as a single card.
- **Shareable Q&A cards** — link-out shareable image / URL card. Cards point
  back to Zolaq; we never embed Facebook UI inside Zolaq or vice versa.

## Sprint 10 beta — Pilot communities

Consent-gated, model-scoped, capped scale:

- **Pilot model communities for 3–5 popular models** — bounded surface,
  invite-only or opt-in, behind a feature flag.
- **Real owner reviews collected with consent** — explicit consent banner;
  reviews tied to a verified ownership signal (registration document, VIN,
  or service record check — exact mechanism to be designed in the Sprint 10
  brief).
- **Test "verified owner" badge concept** — design and shadow-ship only.
  No public surface yet. Visibility expansion requires a follow-up
  governance review under
  [../sprint-7k/GAMIFICATION_RISK_AND_TRUST_RULES.md](../sprint-7k/GAMIFICATION_RISK_AND_TRUST_RULES.md).

## Post-launch — Public surfaces (subject to re-review)

These surfaces are **not** approved by this note. They are listed so future
contributors know the direction; each requires a re-review of
[../sprint-7k/COMMUNITY_POINTS_RULES.md](../sprint-7k/COMMUNITY_POINTS_RULES.md)
and
[../sprint-7k/GAMIFICATION_RISK_AND_TRUST_RULES.md](../sprint-7k/GAMIFICATION_RISK_AND_TRUST_RULES.md)
before any public visibility ships:

- **Model müzakirələri** — model-scoped discussion surface, still tied to a
  canonical model / generation / trim id.
- **Sahib rəyləri** — public owner reviews, structured per the 9H template.
- **Təsdiqlənmiş sahib badge** — public verified-owner badge.
- **Usta / servis ekspert cavabları** — public expert answers from
  mechanics / service partners under a moderator-approved program.
- **Shareable community cards** — public, structured cards (Q&A, owner
  review, expert answer) with deterministic schema, shareable as link or
  image. Always link back to the canonical car / model page on Zolaq.

## Hard rules (do not break in any sprint)

These are restated from the current product direction. Engineering must
treat them as invariants:

- **No Facebook clone.** No free-form timeline, no friend graph, no
  reactions feed, no "share to my wall" surface inside Zolaq.
- **No copied Facebook comments without permission.** Comments from
  external groups, pages, or threads are not imported, scraped, or pasted.
- **No gambling / cash reward / leaderboard in MVP.** Points are
  non-redeemable, non-transferable, and there is no public ranking at P0
  or P1. Forbidden vocabulary remains: `mərc`, `bet`, `odds`, `payout`,
  `win money`, `stake`, `casino`.
- **No manipulation of Zolaq Recommendation, Dealer Verification, or
  Official Price.** Recommendation reads zero gamification state. Dealer
  verification is capability-based. `PriceRecord.verified` is unaffected
  by any community state.
- **All community content must be linked to model / generation / trim
  where possible.** Q&A, votes, reviews, and expert answers must carry a
  structured car reference so they remain decision-grade data, not
  conversation noise.

## What stays the same forever

The invariants that ship in Sprint 8F code are not just policy — they are
load-bearing in the data model:

- Badges and points are **owner-private**. Dealers and other customers
  cannot read them. Enforcement reference: `lib/gamification/badges.ts:2-9`
  ("Owner-visible cosmetic chrome. They MUST NOT affect…") and
  `lib/gamification/points.ts:1-4` ("Owner-visible only — no leaderboard,
  no public ranking, no cash value").
- No code outside `lib/gamification/` branches on badge or point state.
  This boundary is the durable defence against future drift; any new
  caller of `listUserBadges`, `userPointTotal`, `listUserPointGrants`,
  `listProfileActivity`, or `listUserVotes` from a dealer surface is a
  bug.
- Recommendation, verification, and official-price code paths read **zero**
  gamification state. Any future change that adds such a read requires
  the same governance step as a public-visibility expansion.

## Forward-looking links

- [Sprint 8G readiness summary](../sprint-8g/READINESS.md)
- [Sprint 9 gamification requirements](../sprint-7k/SPRINT_9_GAMIFICATION_REQUIREMENTS.md)
- [Community moderation scope](../sprint-7j/COMMUNITY_MODERATION_SCOPE.md)
- [Community prediction rules](../sprint-7j/COMMUNITY_PREDICTION_RULES.md)
- [Community points rules](../sprint-7k/COMMUNITY_POINTS_RULES.md)
- [User badge system](../sprint-7k/USER_BADGE_SYSTEM.md)
- [Gamification risk and trust rules](../sprint-7k/GAMIFICATION_RISK_AND_TRUST_RULES.md)
